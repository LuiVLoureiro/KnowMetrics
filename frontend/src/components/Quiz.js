import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import api from '../services/api';
import { useApp } from '../contexts/AppContext';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  Trophy,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

ChartJS.register(...registerables);

const Quiz = () => {
  const { showNotification } = useApp();
  
  const [phase, setPhase] = useState('select'); // select, quiz, result
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [numQuestions, setNumQuestions] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Quiz state
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  
  // Results
  const [results, setResults] = useState(null);

  // Audio refs
  const correctSound = useRef(null);
  const wrongSound = useRef(null);

  useEffect(() => {
    loadQuizzes();
    // Create audio elements
    correctSound.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
    wrongSound.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.getQuizzes();
      setQuizzes(data.filter(q => q.question_count > 0));
    } catch (error) {
      showNotification('Error loading quizzes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!selectedQuiz) {
      showNotification('Please select a quiz', 'warning');
      return;
    }

    try {
      setLoading(true);
      const num = numQuestions ? parseInt(numQuestions) : null;
      const sessionData = await api.startSession(selectedQuiz.id, num);
      
      setSession(sessionData);
      setQuestions(sessionData.questions);
      setCurrentIndex(0);
      setStartTime(Date.now());
      setPhase('quiz');
      setAnswered(false);
      setLastResult(null);
    } catch (error) {
      showNotification(error.message || 'Error starting quiz', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer) => {
    if (answered || !session) return;
    
    setAnswered(true);
    const timeSpent = (Date.now() - startTime) / 1000;
    const question = questions[currentIndex];

    try {
      const result = await api.submitAnswer(
        session.session_id,
        question.id,
        answer,
        timeSpent
      );
      
      setLastResult({ ...result, selectedAnswer: answer });
      
      // Play sound effect (using Web Audio API fallback)
      try {
        if (result.is_correct) {
          playTone(800, 0.1); // High pitch for correct
        } else {
          playTone(200, 0.2); // Low pitch for wrong
        }
      } catch (e) {
        // Ignore audio errors
      }
    } catch (error) {
      showNotification('Error submitting answer', 'error');
      setAnswered(false);
    }
  };

  // Simple tone generator
  const playTone = (frequency, duration) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), duration * 1000);
    } catch (e) {
      // Ignore
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setStartTime(Date.now());
      setAnswered(false);
      setLastResult(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    try {
      setLoading(true);
      const finalResults = await api.finishSession(session.session_id);
      setResults(finalResults);
      setPhase('result');
    } catch (error) {
      showNotification('Error finishing quiz', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setPhase('select');
    setSession(null);
    setQuestions([]);
    setCurrentIndex(0);
    setResults(null);
    setSelectedQuiz(null);
    setNumQuestions('');
  };

  // Render quiz selection
  if (phase === 'select') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
            <Play className="w-8 h-8 text-primary" />
            Start Quiz
          </h2>
          <p className="text-white/60 mt-2">Select a quiz to begin studying</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-white/60">No quizzes available. Import some questions first!</p>
          </div>
        ) : (
          <div className="card">
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Select Quiz</label>
                <select
                  value={selectedQuiz?.id || ''}
                  onChange={(e) => {
                    const quiz = quizzes.find(q => q.id === parseInt(e.target.value));
                    setSelectedQuiz(quiz);
                  }}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Choose a quiz...</option>
                  {quizzes.map(quiz => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.name} ({quiz.question_count} questions)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Number of Questions (optional)
                </label>
                <input
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  placeholder={`All (${selectedQuiz?.question_count || 0})`}
                  min="1"
                  max={selectedQuiz?.question_count}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </div>

              <button
                onClick={startQuiz}
                disabled={!selectedQuiz}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render quiz
  if (phase === 'quiz' && questions.length > 0) {
    const question = questions[currentIndex];
    
    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-white/60 mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span className="text-primary">{question.topic}</span>
          </div>
          <div className="h-2 bg-card rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="card mb-6">
          <p className="text-xl text-white leading-relaxed">{question.question_text}</p>
        </div>

        {/* Alternatives */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {question.alternatives.map((alt, index) => {
            let buttonClass = 'card hover:bg-card/80 cursor-pointer transition-all py-4 px-6';
            
            if (answered && lastResult) {
              if (alt === lastResult.correct_answer) {
                buttonClass = 'card bg-success/20 border-2 border-success py-4 px-6';
              } else if (alt === lastResult.selectedAnswer && !lastResult.is_correct) {
                buttonClass = 'card bg-error/20 border-2 border-error py-4 px-6';
              } else {
                buttonClass = 'card opacity-50 py-4 px-6';
              }
            }
            
            return (
              <button
                key={index}
                onClick={() => submitAnswer(alt)}
                disabled={answered}
                className={buttonClass}
              >
                <span className="text-white">{alt}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback & Next */}
        {answered && lastResult && (
          <div className="animate-fade-in">
            <div className={`
              card mb-4 flex items-center gap-4
              ${lastResult.is_correct ? 'bg-success/20' : 'bg-error/20'}
            `}>
              {lastResult.is_correct ? (
                <CheckCircle2 className="w-8 h-8 text-success" />
              ) : (
                <XCircle className="w-8 h-8 text-error" />
              )}
              <div>
                <p className={`font-bold ${lastResult.is_correct ? 'text-success' : 'text-error'}`}>
                  {lastResult.is_correct ? 'Correct!' : 'Wrong!'}
                </p>
                {lastResult.explanation && (
                  <p className="text-white/70 text-sm mt-1">{lastResult.explanation}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={nextQuestion}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  View Results
                  <Trophy className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Score indicator */}
        <div className="text-center text-white/50 text-sm mt-4">
          Score: {lastResult?.current_score || 0} / {lastResult?.questions_answered || currentIndex}
        </div>
      </div>
    );
  }

  // Render results
  if (phase === 'result' && results) {
    const accuracy = (results.correct_answers / results.total_questions) * 100;
    
    const pieData = {
      labels: ['Correct', 'Wrong'],
      datasets: [{
        data: [results.correct_answers, results.wrong_answers],
        backgroundColor: ['#4CAF50', '#F44336'],
        hoverOffset: 8
      }]
    };

    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${results.score >= 7 ? 'text-success' : results.score >= 5 ? 'text-warning' : 'text-error'}`} />
          <h2 className="text-3xl font-bold text-white">Quiz Complete!</h2>
        </div>

        {/* Main Score */}
        <div className="card-primary text-center mb-6">
          <p className="text-white/70 mb-2">Your Score</p>
          <p className="text-6xl font-bold">{results.score.toFixed(1)}</p>
          <p className="text-white/70 mt-2">out of 10</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{results.correct_answers}</p>
            <p className="text-white/50 text-sm">Correct</p>
          </div>
          <div className="card text-center">
            <XCircle className="w-6 h-6 mx-auto mb-2 text-error" />
            <p className="text-2xl font-bold text-error">{results.wrong_answers}</p>
            <p className="text-white/50 text-sm">Wrong</p>
          </div>
          <div className="card text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{Math.round(results.average_time)}s</p>
            <p className="text-white/50 text-sm">Avg Time</p>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Results Distribution</h3>
          <div className="h-64">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Topic Breakdown */}
        {results.topics && results.topics.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Topic</h3>
            <div className="space-y-3">
              {results.topics.map((topic, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-32 text-white/70 text-sm truncate">{topic.topic}</span>
                  <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${topic.accuracy >= 70 ? 'bg-success' : topic.accuracy >= 50 ? 'bg-warning' : 'bg-error'}`}
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-white/70 text-sm">{topic.accuracy.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={resetQuiz}
            className="flex-1 btn-secondary py-4 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            New Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
};

export default Quiz;

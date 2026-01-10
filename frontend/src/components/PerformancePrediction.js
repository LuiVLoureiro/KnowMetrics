import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../contexts/AppContext';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Calendar
} from 'lucide-react';

const PerformancePrediction = () => {
  const { showNotification } = useApp();
  
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [examQuestions, setExamQuestions] = useState('');
  const [minScore, setMinScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.getQuizzes();
      // Only show quizzes with sessions
      setQuizzes(data.filter(q => q.session_count > 0));
    } catch (error) {
      showNotification('Error loading quizzes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPrediction = async () => {
    if (!selectedQuiz || !examQuestions || !minScore) {
      showNotification('Please fill all fields', 'warning');
      return;
    }

    try {
      setPredicting(true);
      const data = await api.getPerformancePrediction(
        selectedQuiz,
        parseInt(examQuestions),
        parseFloat(minScore)
      );
      setPrediction(data);
    } catch (error) {
      showNotification(error.message || 'Error getting prediction', 'error');
    } finally {
      setPredicting(false);
    }
  };

  const getProbabilityColor = (prob) => {
    if (prob >= 70) return 'text-success';
    if (prob >= 40) return 'text-warning';
    return 'text-error';
  };

  const getProbabilityBg = (prob) => {
    if (prob >= 70) return 'bg-success';
    if (prob >= 40) return 'bg-warning';
    return 'bg-error';
  };

  const getStatusEmoji = (retention) => {
    if (retention >= 70) return '✅';
    if (retention >= 50) return '🟡';
    if (retention >= 30) return '🟠';
    return '🔴';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          Performance Prediction
        </h2>
        <p className="text-white/60 mt-2">
          Estimate your exam results based on study history
        </p>
      </div>

      {/* Input Form */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Quiz</label>
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
            >
              <option value="">Select quiz...</option>
              {quizzes.map(quiz => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.name} ({quiz.session_count} sessions)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-white/70 text-sm mb-2">Exam Questions</label>
            <input
              type="number"
              value={examQuestions}
              onChange={(e) => setExamQuestions(e.target.value)}
              placeholder="e.g., 50"
              min="1"
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-white/70 text-sm mb-2">Min. Correct to Pass</label>
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="e.g., 30"
              min="1"
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        
        <button
          onClick={getPrediction}
          disabled={predicting || !selectedQuiz}
          className="w-full mt-4 btn-primary py-3 flex items-center justify-center gap-2"
        >
          {predicting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              Predict Performance
            </>
          )}
        </button>
      </div>

      {quizzes.length === 0 && (
        <div className="card text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/30" />
          <p className="text-white/60">
            No quizzes with completed sessions found.
          </p>
          <p className="text-white/40 text-sm mt-2">
            Complete some study sessions first to enable predictions.
          </p>
        </div>
      )}

      {/* Prediction Results */}
      {prediction && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-primary text-center">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Predicted Correct</p>
              <p className="text-4xl font-bold">{prediction.predicted_correct}</p>
              <p className="text-white/50 text-sm">of {examQuestions}</p>
            </div>
            
            <div className="card-primary text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Estimated Time</p>
              <p className="text-4xl font-bold">{prediction.predicted_time}</p>
            </div>
            
            <div className={`card text-center ${getProbabilityBg(prediction.pass_probability)}/20`}>
              <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${getProbabilityColor(prediction.pass_probability)}`} />
              <p className="text-white/70 text-sm">Pass Probability</p>
              <p className={`text-4xl font-bold ${getProbabilityColor(prediction.pass_probability)}`}>
                {prediction.pass_probability.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Probability Bar */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Pass Probability</h3>
            <div className="h-4 bg-background rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getProbabilityBg(prediction.pass_probability)}`}
                style={{ width: `${prediction.pass_probability}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-white/50">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Topic Retention */}
          {prediction.topics_retention && Object.keys(prediction.topics_retention).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Retention by Topic</h3>
              <div className="space-y-3">
                {Object.entries(prediction.topics_retention).map(([topic, retention]) => (
                  <div key={topic} className="flex items-center gap-4">
                    <span className="w-40 text-white/70 text-sm truncate">{topic}</span>
                    <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          retention >= 70 ? 'bg-success' : 
                          retention >= 50 ? 'bg-warning' : 'bg-error'
                        }`}
                        style={{ width: `${retention}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-white/70 text-sm">
                      {retention.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Schedule */}
          {prediction.study_schedule && prediction.study_schedule.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recommended Study Schedule
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-white/50 font-medium">Topic</th>
                      <th className="text-center py-3 px-4 text-white/50 font-medium">Retention</th>
                      <th className="text-left py-3 px-4 text-white/50 font-medium">Next Review</th>
                      <th className="text-center py-3 px-4 text-white/50 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prediction.study_schedule.map((item, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 px-4 text-xl">
                          {getStatusEmoji(item.retention_rate)}
                        </td>
                        <td className="py-3 px-4 text-white font-medium">{item.topic}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`
                            ${item.retention_rate >= 70 ? 'text-success' : 
                              item.retention_rate >= 50 ? 'text-warning' : 'text-error'}
                          `}>
                            {item.retention_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/70">{item.next_review}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${item.priority === 'High' ? 'bg-error/20 text-error' :
                              item.priority === 'Medium' ? 'bg-warning/20 text-warning' :
                              'bg-success/20 text-success'}
                          `}>
                            {item.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card bg-primary/10 border border-primary/30">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium mb-2">Study Tips</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Focus on topics with low retention (red/orange)</li>
                  <li>• Review topics marked as "Review now" first</li>
                  <li>• Regular short sessions are better than long cramming</li>
                  <li>• Predictions improve with more study sessions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformancePrediction;

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../contexts/AppContext';
import { 
  PlusCircle, 
  Save, 
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Star
} from 'lucide-react';

const CreateQuestion = () => {
  const { showNotification, navigateTo } = useApp();
  
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [newQuizName, setNewQuizName] = useState('');
  const [isNewQuiz, setIsNewQuiz] = useState(false);
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [alternatives, setAlternatives] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  
  // Preview
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.getQuizzes();
      setQuizzes(data);
    } catch (error) {
      showNotification('Error loading quizzes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addAlternative = () => {
    if (alternatives.length < 6) {
      setAlternatives([...alternatives, '']);
    }
  };

  const removeAlternative = (index) => {
    if (alternatives.length > 2) {
      const newAlts = alternatives.filter((_, i) => i !== index);
      setAlternatives(newAlts);
      if (correctAnswer === alternatives[index]) {
        setCorrectAnswer('');
      }
    }
  };

  const updateAlternative = (index, value) => {
    const newAlts = [...alternatives];
    newAlts[index] = value;
    setAlternatives(newAlts);
  };

  const validateForm = () => {
    if (!selectedQuiz && !newQuizName.trim()) {
      showNotification('Please select or create a quiz', 'warning');
      return false;
    }
    if (!topic.trim()) {
      showNotification('Please enter a topic', 'warning');
      return false;
    }
    if (!questionText.trim()) {
      showNotification('Please enter the question', 'warning');
      return false;
    }
    const validAlts = alternatives.filter(a => a.trim());
    if (validAlts.length < 2) {
      showNotification('At least 2 alternatives required', 'warning');
      return false;
    }
    if (!correctAnswer) {
      showNotification('Please select the correct answer', 'warning');
      return false;
    }
    if (!validAlts.includes(correctAnswer)) {
      showNotification('Correct answer must be one of the alternatives', 'warning');
      return false;
    }
    return true;
  };

  const saveQuestion = async (addAnother = false) => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      let quizId = selectedQuiz;
      
      // Create new quiz if needed
      if (isNewQuiz && newQuizName.trim()) {
        const newQuiz = await api.createQuiz({ name: newQuizName.trim() });
        quizId = newQuiz.id;
        setQuizzes([...quizzes, newQuiz]);
        setSelectedQuiz(newQuiz.id);
        setIsNewQuiz(false);
        setNewQuizName('');
      }

      // Create question
      const validAlts = alternatives.filter(a => a.trim());
      await api.createQuestion({
        quiz_id: parseInt(quizId),
        topic: topic.trim(),
        question_text: questionText.trim(),
        alternatives: validAlts,
        correct_answer: correctAnswer,
        explanation: explanation.trim() || null,
        difficulty
      });

      showNotification('Question saved!', 'success');

      if (addAnother) {
        // Clear form but keep quiz and topic
        setQuestionText('');
        setAlternatives(['', '']);
        setCorrectAnswer('');
        setExplanation('');
        setShowPreview(false);
      } else {
        navigateTo('metrics');
      }
    } catch (error) {
      showNotification(error.message || 'Error saving question', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <PlusCircle className="w-8 h-8 text-primary" />
          Create Question
        </h2>
        <p className="text-white/60 mt-2">Add new questions to your quizzes</p>
      </div>

      <div className="card">
        <div className="space-y-6">
          {/* Quiz Selection */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Quiz *</label>
            <div className="flex gap-2">
              <select
                value={isNewQuiz ? 'new' : selectedQuiz}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setIsNewQuiz(true);
                    setSelectedQuiz('');
                  } else {
                    setIsNewQuiz(false);
                    setSelectedQuiz(e.target.value);
                  }
                }}
                className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
              >
                <option value="">Select a quiz...</option>
                {quizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>{quiz.name}</option>
                ))}
                <option value="new">+ Create new quiz</option>
              </select>
            </div>
            
            {isNewQuiz && (
              <input
                type="text"
                value={newQuizName}
                onChange={(e) => setNewQuizName(e.target.value)}
                placeholder="New quiz name..."
                className="w-full mt-2 bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Topic *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Algebra, History, etc."
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
            />
          </div>

          {/* Question */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Question *</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question..."
              rows={3}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* Alternatives */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Alternatives * ({alternatives.length}/6)
            </label>
            <div className="space-y-2">
              {alternatives.map((alt, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={alt}
                    onChange={(e) => updateAlternative(index, e.target.value)}
                    placeholder={`Alternative ${index + 1}`}
                    className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                  />
                  {alternatives.length > 2 && (
                    <button
                      onClick={() => removeAlternative(index)}
                      className="p-3 bg-error/20 text-error rounded-xl hover:bg-error/30"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {alternatives.length < 6 && (
              <button
                onClick={addAlternative}
                className="mt-2 text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add alternative
              </button>
            )}
          </div>

          {/* Correct Answer */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Correct Answer *</label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
            >
              <option value="">Select correct answer...</option>
              {alternatives.filter(a => a.trim()).map((alt, index) => (
                <option key={index} value={alt}>{alt}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Difficulty</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`p-2 rounded-lg transition-colors ${
                    difficulty >= level ? 'text-warning' : 'text-white/30'
                  }`}
                >
                  <Star className={`w-6 h-6 ${difficulty >= level ? 'fill-warning' : ''}`} />
                </button>
              ))}
              <span className="ml-2 text-white/50 self-center">
                {['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][difficulty - 1]}
              </span>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Explanation (optional)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Why is this the correct answer?"
              rows={2}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-primary hover:text-primary/80 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          {showPreview && (
            <div className="bg-background rounded-xl p-4 border border-white/10">
              <p className="text-primary text-sm mb-2">{topic || 'Topic'}</p>
              <p className="text-white mb-4">{questionText || 'Question text...'}</p>
              <div className="grid grid-cols-2 gap-2">
                {alternatives.filter(a => a.trim()).map((alt, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg ${
                      alt === correctAnswer 
                        ? 'bg-success/20 border border-success' 
                        : 'bg-card'
                    }`}
                  >
                    {alt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => saveQuestion(true)}
              disabled={saving}
              className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Save & Add Another
                </>
              )}
            </button>
            <button
              onClick={() => saveQuestion(false)}
              disabled={saving}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save & Exit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestion;

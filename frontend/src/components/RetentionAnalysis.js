import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';
import api from '../services/api';
import { useApp } from '../contexts/AppContext';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  BookOpen,
  TrendingUp,
  Clock
} from 'lucide-react';

ChartJS.register(...registerables);

const RetentionAnalysis = () => {
  const { showNotification } = useApp();
  
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.getQuizzes();
      setQuizzes(data.filter(q => q.session_count > 0));
    } catch (error) {
      showNotification('Error loading quizzes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAnalysis = async (quizId) => {
    setSelectedQuiz(quizId);
    if (!quizId) {
      setAnalysis(null);
      return;
    }

    try {
      setAnalyzing(true);
      const data = await api.getRetentionAnalysis(quizId);
      setAnalysis(data);
    } catch (error) {
      showNotification(error.message || 'Error loading analysis', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRetentionColor = (retention) => {
    if (retention >= 70) return 'text-success';
    if (retention >= 50) return 'text-warning';
    return 'text-error';
  };

  const getStatusBadge = (retention) => {
    if (retention >= 70) return { text: 'Mastered', class: 'bg-success/20 text-success' };
    if (retention >= 50) return { text: 'Learning', class: 'bg-warning/20 text-warning' };
    if (retention >= 30) return { text: 'At Risk', class: 'bg-orange-500/20 text-orange-400' };
    return { text: 'Critical', class: 'bg-error/20 text-error' };
  };

  // Radar chart data for retention by topic
  const radarData = analysis?.all_topics ? {
    labels: analysis.all_topics.slice(0, 8).map(t => t.topic),
    datasets: [{
      label: 'Retention Rate',
      data: analysis.all_topics.slice(0, 8).map(t => t.retention_rate),
      backgroundColor: 'rgba(9, 130, 195, 0.2)',
      borderColor: '#0982c3',
      borderWidth: 2,
      pointBackgroundColor: '#0982c3'
    }]
  } : null;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 25 },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } }
      }
    },
    plugins: {
      legend: { display: false }
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
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Retention Analysis
        </h2>
        <p className="text-white/60 mt-2">
          Track memory retention using the Ebbinghaus forgetting curve
        </p>
      </div>

      {/* Quiz Selection */}
      <div className="card mb-6">
        <label className="block text-white/70 text-sm mb-2">Select Quiz to Analyze</label>
        <select
          value={selectedQuiz}
          onChange={(e) => getAnalysis(e.target.value)}
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

      {quizzes.length === 0 && (
        <div className="card text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/30" />
          <p className="text-white/60">No quizzes with completed sessions found.</p>
          <p className="text-white/40 text-sm mt-2">
            Complete some study sessions first to see retention analysis.
          </p>
        </div>
      )}

      {analyzing && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !analyzing && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-white/50 text-sm">Sessions</p>
              <p className="text-2xl font-bold text-white">{analysis.total_sessions}</p>
            </div>
            <div className="card text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-white/50 text-sm">Questions</p>
              <p className="text-2xl font-bold text-white">{analysis.total_questions}</p>
            </div>
            <div className="card text-center">
              <Brain className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-white/50 text-sm">Overall Retention</p>
              <p className={`text-2xl font-bold ${getRetentionColor(analysis.overall_retention)}`}>
                {analysis.overall_retention.toFixed(1)}%
              </p>
            </div>
            <div className="card text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-white/50 text-sm">Topics</p>
              <p className="text-2xl font-bold text-white">{analysis.all_topics?.length || 0}</p>
            </div>
          </div>

          {/* Topics at Risk & Mastered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* At Risk */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-error" />
                Topics at Risk
              </h3>
              {analysis.topics_at_risk?.length > 0 ? (
                <div className="space-y-3">
                  {analysis.topics_at_risk.map((topic, i) => (
                    <div key={i} className="bg-error/10 rounded-xl p-3 border border-error/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-medium">{topic.topic}</span>
                        <span className="text-error font-bold">{topic.retention_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex gap-4 text-sm text-white/50">
                        <span>Accuracy: {topic.accuracy.toFixed(0)}%</span>
                        <span>Exposures: {topic.exposures}</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden mt-2">
                        <div 
                          className="h-full bg-error"
                          style={{ width: `${topic.retention_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-center py-4">No topics at risk!</p>
              )}
            </div>

            {/* Mastered */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Mastered Topics
              </h3>
              {analysis.topics_mastered?.length > 0 ? (
                <div className="space-y-3">
                  {analysis.topics_mastered.map((topic, i) => (
                    <div key={i} className="bg-success/10 rounded-xl p-3 border border-success/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-medium">{topic.topic}</span>
                        <span className="text-success font-bold">{topic.retention_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex gap-4 text-sm text-white/50">
                        <span>Accuracy: {topic.accuracy.toFixed(0)}%</span>
                        <span>Exposures: {topic.exposures}</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden mt-2">
                        <div 
                          className="h-full bg-success"
                          style={{ width: `${topic.retention_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-center py-4">Keep studying to master topics!</p>
              )}
            </div>
          </div>

          {/* Radar Chart */}
          {radarData && analysis.all_topics.length >= 3 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Retention Map</h3>
              <div className="h-80">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          )}

          {/* All Topics Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">All Topics</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/50 font-medium">Topic</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Accuracy</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Retention</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Exposures</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Days Since Review</th>
                    <th className="text-center py-3 px-4 text-white/50 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.all_topics?.map((topic, i) => {
                    const status = getStatusBadge(topic.retention_rate);
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-medium">{topic.topic}</td>
                        <td className="py-3 px-4 text-center text-white/70">
                          {topic.accuracy.toFixed(0)}%
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-2 bg-background rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  topic.retention_rate >= 70 ? 'bg-success' :
                                  topic.retention_rate >= 50 ? 'bg-warning' : 'bg-error'
                                }`}
                                style={{ width: `${topic.retention_rate}%` }}
                              />
                            </div>
                            <span className={`text-sm ${getRetentionColor(topic.retention_rate)}`}>
                              {topic.retention_rate.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-white/70">{topic.exposures}</td>
                        <td className="py-3 px-4 text-center text-white/70">
                          {topic.days_since_review}d
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Card */}
          <div className="card bg-primary/10 border border-primary/30">
            <div className="flex gap-4">
              <Brain className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium mb-2">About Retention Analysis</h4>
                <p className="text-white/70 text-sm">
                  This analysis uses the <strong>Ebbinghaus forgetting curve</strong> to estimate 
                  how well you remember each topic over time. Topics with low retention need review 
                  soon, while mastered topics can be reviewed less frequently.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetentionAnalysis;

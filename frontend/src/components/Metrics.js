import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { useApp } from '../contexts/AppContext';
import { 
  BarChart3, 
  Target, 
  Clock, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookOpen
} from 'lucide-react';

ChartJS.register(...registerables);

const Metrics = () => {
  const { showNotification } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chartType, setChartType] = useState('accuracy');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardData, sessionsData] = await Promise.all([
        api.getDashboard(),
        api.getSessions({ completed_only: true, limit: 20 })
      ]);
      setDashboard(dashboardData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading metrics:', error);
      showNotification('Error loading metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'rgba(255,255,255,0.8)', font: { family: 'Poppins' } }
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.6)' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255,255,255,0.6)' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: 'rgba(255,255,255,0.8)', font: { family: 'Poppins' } }
      }
    }
  };

  // Build evolution chart data
  const evolutionData = {
    labels: sessions.slice().reverse().map((_, i) => `Session ${i + 1}`),
    datasets: [
      {
        label: 'Score',
        data: sessions.slice().reverse().map(s => s.score),
        borderColor: '#0982c3',
        backgroundColor: 'rgba(9, 130, 195, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Build accuracy pie data
  const accuracyData = dashboard ? {
    labels: ['Correct', 'Wrong'],
    datasets: [{
      data: [dashboard.total_correct, dashboard.total_wrong],
      backgroundColor: ['#4CAF50', '#F44336'],
      hoverOffset: 8
    }]
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Dashboard
        </h2>
        <button
          onClick={loadData}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="text-white/50 text-sm">Total Quizzes</p>
          <p className="text-3xl font-bold text-white">{dashboard?.total_quizzes || 0}</p>
        </div>
        
        <div className="card text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="text-white/50 text-sm">Total Sessions</p>
          <p className="text-3xl font-bold text-white">{dashboard?.total_sessions || 0}</p>
        </div>
        
        <div className="card text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-success" />
          <p className="text-white/50 text-sm">Average Score</p>
          <p className="text-3xl font-bold text-success">{dashboard?.average_score?.toFixed(1) || 0}</p>
        </div>
        
        <div className="card text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-warning" />
          <p className="text-white/50 text-sm">Study Time</p>
          <p className="text-2xl font-bold text-warning">
            {Math.round((dashboard?.total_study_time || 0) / 60)}m
          </p>
        </div>
      </div>

      {/* Accuracy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-success/20 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Correct Answers</p>
            <p className="text-2xl font-bold text-success">{dashboard?.total_correct || 0}</p>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-error/20 rounded-xl flex items-center justify-center">
            <XCircle className="w-7 h-7 text-error" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Wrong Answers</p>
            <p className="text-2xl font-bold text-error">{dashboard?.total_wrong || 0}</p>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Accuracy</p>
            <p className="text-2xl font-bold text-primary">{dashboard?.accuracy?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Evolution Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Score Evolution</h3>
          <div className="h-64">
            {sessions.length > 0 ? (
              <Line data={evolutionData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-white/50">
                No sessions yet
              </div>
            )}
          </div>
        </div>

        {/* Accuracy Pie */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Overall Accuracy</h3>
          <div className="h-64">
            {accuracyData && (dashboard?.total_correct + dashboard?.total_wrong > 0) ? (
              <Doughnut data={accuracyData} options={pieOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-white/50">
                No data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Sessions</h3>
        {dashboard?.recent_sessions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Quiz</th>
                  <th className="text-center py-3 px-4 text-white/50 font-medium">Questions</th>
                  <th className="text-center py-3 px-4 text-white/50 font-medium">Score</th>
                  <th className="text-center py-3 px-4 text-white/50 font-medium">Accuracy</th>
                  <th className="text-center py-3 px-4 text-white/50 font-medium">Time</th>
                  <th className="text-center py-3 px-4 text-white/50 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent_sessions.map((session) => (
                  <tr key={session.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-medium">{session.quiz_name}</td>
                    <td className="py-3 px-4 text-center text-white/70">{session.total_questions}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${session.score >= 7 ? 'text-success' : session.score >= 5 ? 'text-warning' : 'text-error'}`}>
                        {session.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-white/70">
                      {((session.correct_answers / session.total_questions) * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-center text-white/70">
                      {Math.round(session.total_time)}s
                    </td>
                    <td className="py-3 px-4 text-center text-white/50 text-sm">
                      {new Date(session.finished_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-white/50">
            No sessions completed yet. Start a quiz to see your progress!
          </div>
        )}
      </div>
    </div>
  );
};

export default Metrics;

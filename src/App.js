import React from 'react';
import { useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import Metrics from './components/Metrics';
import Quiz from './components/Quiz';
import CreateQuestion from './components/CreateQuestion';
import PerformancePrediction from './components/PerformancePrediction';
import RetentionAnalysis from './components/RetentionAnalysis';
import Notification from './components/Notification';

const App = () => {
  const { currentView, notification } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'metrics':
        return <Metrics />;
      case 'quiz':
        return <Quiz />;
      case 'create':
        return <CreateQuestion />;
      case 'prediction':
        return <PerformancePrediction />;
      case 'retention':
        return <RetentionAnalysis />;
      default:
        return <Metrics />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 border-2 border-primary/30">
        <div className="animate-fade-in">
          {renderView()}
        </div>
      </main>
      {notification && <Notification {...notification} />}
    </div>
  );
};

export default App;

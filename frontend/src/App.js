import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import Notification from './components/Notification';
import Metrics from './components/Metrics';
import Quiz from './components/Quiz';
import CreateQuestion from './components/CreateQuestion';
import ImportQuestions from './components/ImportQuestions';
import PerformancePrediction from './components/PerformancePrediction';
import RetentionAnalysis from './components/RetentionAnalysis';
import PromptGenerator from './components/PromptGenerator';

const MainContent = () => {
  const { currentPage } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'metrics':
        return <Metrics />;
      case 'quiz':
        return <Quiz />;
      case 'create':
        return <CreateQuestion />;
      case 'import':
        return <ImportQuestions />;
      case 'prediction':
        return <PerformancePrediction />;
      case 'prompt':
        return <PromptGenerator />;
      case 'retention':
        return <RetentionAnalysis />;
      default:
        return <Metrics />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-background">
      {renderPage()}
    </main>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <MainContent />
        <Notification />
      </div>
    </AppProvider>
  );
}

export default App;

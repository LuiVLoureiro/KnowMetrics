import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('metrics');
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }, []);

  const navigate = useCallback((view) => {
    setCurrentView(view);
  }, []);

  const value = {
    currentView,
    setCurrentView,
    navigate,
    notification,
    showNotification,
    isLoading,
    setIsLoading
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

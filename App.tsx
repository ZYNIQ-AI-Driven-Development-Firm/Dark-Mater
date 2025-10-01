import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import LoaderPage from './components/LoaderPage';
import LandingPage from './components/LandingPage';

type AuthState = 'initializing' | 'landing' | 'loggedOut' | 'loading' | 'loggedIn';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('initializing');

  const handleEnterApp = () => {
    setAuthState('loggedOut');
  };

  const handleGoToLanding = () => {
    setAuthState('landing');
  };

  const handleLoginSuccess = () => {
    setAuthState('loading');
  };
  
  const handleLogout = () => {
    setAuthState('loggedOut');
  };

  useEffect(() => {
    if (authState === 'initializing') {
      const timer = setTimeout(() => {
        setAuthState('landing');
      }, 3000); // Initial splash screen for 3 seconds
      return () => clearTimeout(timer);
    }
    if (authState === 'loading') {
      const timer = setTimeout(() => {
        setAuthState('loggedIn');
      }, 3000); // Simulate loading for 3 seconds after login
      return () => clearTimeout(timer);
    }
  }, [authState]);

  const renderContent = () => {
    switch (authState) {
      case 'initializing':
      case 'loading':
        return <LoaderPage />;
      case 'landing':
        return <LandingPage onEnter={handleEnterApp} />;
      case 'loggedIn':
        return <MainPage onLogout={handleLogout} />;
      case 'loggedOut':
      default:
        return <LoginPage onLoginSuccess={handleLoginSuccess} onGoToLanding={handleGoToLanding} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      {renderContent()}
    </div>
  );
};

export default App;
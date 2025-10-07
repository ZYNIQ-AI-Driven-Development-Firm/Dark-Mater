import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import LoaderPage from './components/LoaderPage';
import LandingPage from './components/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';


import { initializeSecurity } from './src/lib/security';

type AuthState = 'initializing' | 'landing' | 'loggedOut' | 'loading' | 'loggedIn';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('initializing');


  const handleEnterApp = () => {
    setAuthState('loggedOut');
    window.history.pushState({}, '', '/login');
  };

  const handleGoToLanding = () => {
    setAuthState('landing');
    window.history.pushState({}, '', '/');
  };

  const handleLoginSuccess = () => {
    setAuthState('loading');
    window.history.pushState({}, '', '/dashboard');
  };
  
  const handleLogout = () => {
    setAuthState('landing');
    window.history.pushState({}, '', '/');
  };

  useEffect(() => {
    // Initialize security measures on app start
    initializeSecurity();

    if (authState === 'initializing') {
      // Check for existing authentication
      const accessToken = localStorage.getItem('dark_matter_access_token');
      const refreshToken = localStorage.getItem('dark_matter_refresh_token');
      
      if (accessToken && refreshToken) {
        // User has tokens, skip to main page
        setAuthState('loggedIn');
        window.history.pushState({}, '', '/dashboard');
      } else {
        // No tokens, show landing page after splash
        const timer = setTimeout(() => {
          setAuthState('landing');
          window.history.pushState({}, '', '/');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
    if (authState === 'loading') {
      const timer = setTimeout(() => {
        setAuthState('loggedIn');
        window.history.pushState({}, '', '/dashboard');
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
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-gray-300 font-mono">
        {renderContent()}



      </div>
    </ErrorBoundary>
  );
};

export default App;

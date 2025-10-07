import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service (e.g., Sentry, LogRocket)
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with Dark Matter theme
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="relative w-full max-w-md mx-auto">
            {/* Decorative Corners */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-red-500/50"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-red-500/50"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-red-500/50"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-red-500/50"></div>
            
            <div className="bg-gray-900/80 border border-red-500/30 p-8 text-center">
              <h1 className="text-lg text-red-400 mb-4 font-mono">[ SYSTEM ERROR ]</h1>
              
              <div className="text-gray-300 text-sm space-y-3">
                <p>An unexpected error occurred in the application.</p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="text-left bg-black/50 p-3 border border-red-500/20 mt-4">
                    <p className="text-red-400 text-xs mb-2">DEBUG INFO:</p>
                    <p className="text-xs text-gray-400 break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col gap-3 mt-6">
                  <button
                    onClick={() => {
                      this.setState({ hasError: false, error: undefined });
                    }}
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold transition-colors border-2 border-red-500"
                  >
                    [ TRY AGAIN ]
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="py-2 px-4 text-red-400 font-bold border-2 border-red-500/50 hover:border-red-500 transition-colors"
                  >
                    [ RELOAD APPLICATION ]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
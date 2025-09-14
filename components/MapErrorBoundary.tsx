'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

export class MapErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center p-8">
            <div className="text-red-500 text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Map Loading Error</h3>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message?.includes('already initialized') 
                ? 'Map is reloading due to hot refresh...' 
                : 'There was an issue loading the map.'}
            </p>
            {this.state.error && (
              <details className="text-xs text-gray-500 mb-4">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-left bg-gray-200 p-2 rounded">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

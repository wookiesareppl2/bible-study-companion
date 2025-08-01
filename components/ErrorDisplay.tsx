import React from 'react';

interface ErrorDisplayProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4" role="alert">
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg border-2 border-red-200 text-center">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong.</h2>
        <p className="text-gray-600 mb-6">
          We're sorry, but the application has encountered an unexpected error. This has been logged for the developer.
        </p>
        <details className="p-4 bg-gray-100 rounded-md text-left text-sm text-gray-700">
          <summary className="font-medium cursor-pointer">Error Details</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all">
            {error.message}
          </pre>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};
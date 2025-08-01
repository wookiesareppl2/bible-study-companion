import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from './ErrorDisplay.tsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // This is the crucial part. We log the detailed error information.
    console.error("Uncaught error:", error);
    console.error("Component stack trace:", errorInfo.componentStack);
  }
  
  public resetState = () => {
      this.setState({ hasError: false, error: null });
      // For a more forceful reset, you could use window.location.reload()
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorDisplay error={this.state.error} resetErrorBoundary={this.resetState} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. If not provided, a default "Something went wrong" message is shown. */
  fallback?: ReactNode;
  /** If true, render nothing on error instead of a fallback UI. */
  silent?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.silent) {
        return null;
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center h-full">
          <p className="text-sm text-muted-foreground">Something went wrong.</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-3 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

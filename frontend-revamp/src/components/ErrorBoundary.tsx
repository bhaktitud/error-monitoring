import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logComponentError } from '../lib/sdk-integration';

interface Props {
  children: ReactNode;
  fallback?: React.ReactElement | ((error: Error) => React.ReactElement);
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary untuk menangkap error rendering komponen React
 * dan melaporkannya ke LogRaven SDK.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Kirim error ke LogRaven SDK
    logComponentError(error, {
      componentName: this.props.componentName || 'UnknownComponent',
      props: this.props,
      reactErrorInfo: errorInfo,
    });

    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      // Tampilkan fallback UI
      const { fallback } = this.props;
      
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(this.state.error);
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 border border-red-500 rounded bg-red-50">
          <h2 className="text-lg font-bold text-red-700">Terjadi kesalahan.</h2>
          <p className="text-red-600">
            {this.state.error.message || 'Komponen ini gagal dirender.'}
          </p>
          <button
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// HOC untuk membungkus komponen dengan ErrorBoundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<Props, 'children'> & { componentName?: string } = {}
): React.FC<P> {
  const componentName = options.componentName || Component.displayName || Component.name;
  
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options} componentName={componentName}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withErrorBoundary(${componentName})`;
  
  return WithErrorBoundary;
} 
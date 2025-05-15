import React from 'react';
import { captureException } from '../core/capture';

type Props = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  componentName?: string;
};

type State = { hasError: boolean };

export class LogRavenErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      extraContext: {
        componentStack: info.componentStack,
        componentName: this.props.componentName || 'UnknownComponent',
      },
    });
  }

  render() {
    return this.state.hasError
      ? this.props.fallback ?? <div>Something went wrong.</div>
      : this.props.children;
  }
}

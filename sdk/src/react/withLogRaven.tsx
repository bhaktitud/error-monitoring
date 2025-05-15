import React from 'react';
import { LogRavenErrorBoundary } from './ErrorBoundary';

export function withLogRaven<P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    fallback?: React.ReactNode
  ) {
    const Wrapped: React.FC<P> = (props) => {
      return (
        <LogRavenErrorBoundary fallback={fallback} componentName={Component.name}>
          <Component {...props} />
        </LogRavenErrorBoundary>
      );
    };
    return Wrapped;
  }
  
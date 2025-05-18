/**
 * SDK Integration Module
 * 
 * Modul ini bertanggung jawab untuk integrasi SDK LogRaven dengan frontend
 * untuk monitoring error real-time.
 */

import { init, captureException, setUser, setTags } from '../../../sdk/src';
import { useEffect, useCallback } from 'react';

/**
 * Inisialisasi SDK dengan DSN dan konfigurasi
 */
export function initializeSDK(dsn: string, config: {
  environment?: string;
  release?: string;
  apiUrl?: string;
  enableConsoleCapture?: boolean;
  enableNetworkCapture?: boolean;
}) {
  init({
    dsn,
    environment: config.environment || 'development',
    release: config.release || 'unknown',
    apiUrl: config.apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  });

  // Capture unhandled errors dan rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      captureException(event.error || new Error(event.message), {
        url: window.location.href,
        path: window.location.pathname,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          url: window.location.href,
          path: window.location.pathname,
        }
      );
    });

    // Enable console error capturing
    if (config.enableConsoleCapture) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const error = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
        captureException(error, {
          url: window.location.href,
          path: window.location.pathname,
          console: true,
        });
        originalConsoleError.apply(console, args);
      };
    }

    // Enable network error capturing
    if (config.enableNetworkCapture) {
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        try {
          const response = await originalFetch(input, init);
          if (!response.ok) {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : 'unknown';
            captureException(new Error(`Network request failed: ${response.status}`), {
              url: window.location.href,
              path: window.location.pathname,
              statusCode: response.status,
              networkRequest: {
                url,
                method: init?.method || 'GET',
                status: response.status,
              },
            });
          }
          return response;
        } catch (error) {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : 'unknown';
          captureException(error instanceof Error ? error : new Error(String(error)), {
            url: window.location.href,
            path: window.location.pathname,
            networkRequest: {
              url,
              method: init?.method || 'GET',
            },
          });
          throw error;
        }
      };
    }
  }
}

/**
 * Set informasi pengguna untuk konteks error
 */
export function setUserContext(user: { id: string; email?: string; name?: string; [key: string]: unknown }) {
  setUser({
    userId: user.id,
    ...user,
  });
}

/**
 * Set tags untuk konteks error
 */
export function setErrorTags(tags: Record<string, string>) {
  setTags(tags);
}

/**
 * Custom React hook untuk inisialisasi SDK
 */
export function useSDK(dsn: string, config: {
  environment?: string;
  release?: string;
  apiUrl?: string;
  enableConsoleCapture?: boolean;
  enableNetworkCapture?: boolean;
  user?: { id: string; email?: string; name?: string; [key: string]: unknown };
  tags?: Record<string, string>;
}) {
  useEffect(() => {
    initializeSDK(dsn, config);

    if (config.user) {
      setUserContext(config.user);
    }

    if (config.tags) {
      setErrorTags(config.tags);
    }
  }, [dsn]);

  const logError = useCallback((error: Error, additionalContext?: Record<string, unknown>) => {
    captureException(error, additionalContext);
  }, []);

  return { logError };
}

/**
 * Fungsi untuk menangkap error dari component boundary
 */
export function logComponentError(error: Error, componentInfo: { 
  componentName: string; 
  props?: unknown;
  reactErrorInfo?: unknown;
}) {
  captureException(error, {
    componentInfo,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
} 
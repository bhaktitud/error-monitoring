import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { initializeLogRaven, captureException } from '../lib/lograven';

// Custom error boundary untuk menangkap runtime error React
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Kirim error ke LogRaven
    console.error('Error ditangkap oleh error boundary:', error, errorInfo);
    
    // Pastikan kita menggunakan imported captureException
    captureException(error, {
      contexts: {
        errorInfo: {
          componentStack: errorInfo.componentStack
        }
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ color: '#e53e3e' }}>Terjadi kesalahan</h1>
          <p>Aplikasi mengalami error yang telah dilaporkan secara otomatis.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              backgroundColor: '#3182ce',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              marginTop: '1rem',
              cursor: 'pointer'
            }}
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Inisialisasi LogRaven SDK saat aplikasi dimuat
    initializeLogRaven();
  }, []);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
} 
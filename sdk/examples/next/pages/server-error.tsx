import React, { useState } from 'react';

export default function ServerErrorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testApiWithoutError = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/trigger-error');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Terjadi error saat memanggil API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const testApiWithError = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/trigger-error?error=true');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Terjadi error saat memanggil API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <h1>Contoh Error di API Route</h1>
      <p>Halaman ini digunakan untuk menguji integrasi LogRaven SDK dengan API Route di Next.js.</p>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={testApiWithoutError}
          disabled={loading}
          style={{
            backgroundColor: '#4CAF50',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Test API (Sukses)
        </button>
        
        <button 
          onClick={testApiWithError}
          disabled={loading}
          style={{
            backgroundColor: '#f44336',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Test API (Error)
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px' 
        }}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {result && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#e8f5e9', 
          color: '#2e7d32',
          borderRadius: '4px' 
        }}>
          <p><strong>Pesan:</strong> {result.message}</p>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/"
          style={{
            color: '#2196f3',
            textDecoration: 'none'
          }}
        >
          &larr; Kembali ke Beranda
        </a>
      </div>
    </div>
  );
} 
import React, { useEffect } from 'react';
import Link from 'next/link';
import { captureException, logError } from '../lib/lograven';

export default function Home() {
  const handleTestError = () => {
    try {
      // Membuat error contoh
      throw new Error('Ini adalah contoh error yang sengaja dibuat');
    } catch (error) {
      // Menangkap dan melaporkan error ke LogRaven
      captureException(error);
      alert('Error telah dicatat oleh LogRaven SDK!');
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <h1>Contoh Penggunaan LogRaven SDK dengan Next.js</h1>
      <p>Aplikasi ini mengintegrasikan LogRaven SDK untuk melacak error di aplikasi Next.js.</p>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={handleTestError}
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
          Coba Buat Error
        </button>
        
        <Link
          href="/server-error"
          style={{
            backgroundColor: '#2196F3',
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
          Test API Route Error
        </Link>
        
        <Link
          href="/api/error-with-nest-adapter?error=false"
          style={{
            backgroundColor: '#FFC107',
            border: 'none',
            color: 'black',
            padding: '10px 20px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Test API Tanpa NestJS
        </Link>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h2>Cara Kerja</h2>
        <p>1. LogRaven SDK diinisialisasi di _app.tsx saat aplikasi dimuat.</p>
        <p>2. Ketika tombol "Coba Buat Error" ditekan, error akan dibuat dan ditangkap.</p>
        <p>3. Error tersebut akan dikirim ke LogRaven untuk dilacak dan dimonitor.</p>
        <p>4. Aplikasi ini juga mendemonstrasikan penanganan error di API Route.</p>
      </div>
    </div>
  );
} 
import { init, captureException, setUser } from '@lograven/sdk';

// Inisialisasi LogRaven SDK dengan konfigurasi dasar
export function initializeLogRaven() {
  init({
    dsn: '6369f64f-261b-4b3e-bd7c-309127deaf3a',
    environment: 'development',
    release: '1.0.0',
    apiUrl: 'http://localhost:3000'
  });
  
  // Set default user info
  setUser({
    id: 'user-123',
    email: 'user@example.com',
    username: 'demouser'
  });
  
  console.log('LogRaven SDK telah diinisialisasi tanpa adapter NestJS');
}

// Fungsi helper untuk menangkap error
export function logError(error: any, context?: Record<string, any>) {
  console.error('Error terdeteksi:', error);
  captureException(error, { 
    contexts: { 
      additionalContext: context || {} 
    }
  });
}

// Export fungsi yang sering digunakan dari SDK
export { captureException, setUser }; 
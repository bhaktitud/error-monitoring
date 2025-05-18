/**
 * Konfigurasi SDK untuk digunakan di seluruh aplikasi
 */
import { initializeSDK, setUserContext, setErrorTags } from './sdk-integration';

/**
 * Inisialisasi SDK dengan project DSN
 * @param dsn Project DSN dari halaman pengaturan proyek
 * @param userData Data pengguna yang sedang login
 */
export function initializeAppSDK(
  dsn: string, 
  userData?: { 
    id: string; 
    email?: string; 
    name?: string;
  }
) {
  // Inisialisasi SDK dengan konfigurasi
  initializeSDK(dsn, {
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    enableConsoleCapture: true,
    enableNetworkCapture: true,
  });

  // Set informasi pengguna jika tersedia
  if (userData) {
    setUserContext(userData);
  }

  // Set tag default untuk aplikasi
  setErrorTags({
    appName: 'LogRaven Dashboard',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  });

  console.log('[LogRaven SDK] Initialized successfully');
}

/**
 * Aplikasikan SDK di _app.tsx dengan contoh:
 * 
 * ```tsx
 * // pages/_app.tsx
 * import { useEffect } from 'react';
 * import { useRouter } from 'next/router';
 * import { initializeAppSDK } from '../lib/sdk-config';
 * import { useAuth } from '../hooks/useAuth';
 * 
 * function MyApp({ Component, pageProps }) {
 *   const { user } = useAuth();
 *   const router = useRouter();
 *   
 *   useEffect(() => {
 *     // Gunakan DSN proyek monitoring Anda
 *     const dsn = process.env.NEXT_PUBLIC_LOGRAVEN_DSN;
 *     
 *     if (dsn) {
 *       initializeAppSDK(dsn, user);
 *     }
 *   }, [user]);
 *   
 *   return (
 *     <ErrorBoundary>
 *       <Component {...pageProps} />
 *     </ErrorBoundary>
 *   );
 * }
 * 
 * export default MyApp;
 * ```
 */ 
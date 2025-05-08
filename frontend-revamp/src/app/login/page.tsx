'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiLogIn, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';
import { login } from '@/lib/auth';
import { useCookies } from 'next-client-cookies';

export default function LoginPage() {
  const router = useRouter();
  const cookies = useCookies();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needVerification, setNeedVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setNeedVerification(false);

    try {
      // Memanggil API login
      const data = await AuthAPI.login(email, password);
      
      // Simpan token di localStorage dan cookie
      login(data.token, cookies);
      
      // Redirect ke halaman projects setelah berhasil login
      router.push('/projects');
    } catch (err) {
      console.error('Error during login:', err);
      if (err instanceof Error) {
        // Cek apakah error karena email belum diverifikasi
        if (err.message.includes('Email belum diverifikasi')) {
          setNeedVerification(true);
          setVerificationEmail(email);
        } else {
          setError(err.message);
        }
      } else {
        setError('Email atau password salah. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setResendStatus('sending');
    
    try {
      await AuthAPI.resendVerification(verificationEmail);
      setResendStatus('success');
    } catch (err) {
      console.error('Error resending verification:', err);
      setResendStatus('error');
    }
  };

  // Tampilkan halaman verifikasi jika user belum verifikasi email
  if (needVerification) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Verifikasi Email</CardTitle>
              <CardDescription>Email Anda belum diverifikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                  <div className="flex">
                    <FiAlertCircle className="text-amber-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 text-sm">
                        Anda perlu memverifikasi email <strong>{verificationEmail}</strong> sebelum dapat login. 
                        Silakan cek email Anda untuk link verifikasi atau kirim ulang email verifikasi.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  {resendStatus === 'idle' && (
                    <Button 
                      onClick={handleResendVerification} 
                      className="w-full"
                    >
                      Kirim Ulang Email Verifikasi
                    </Button>
                  )}
                  
                  {resendStatus === 'sending' && (
                    <Button 
                      disabled 
                      className="w-full"
                    >
                      Mengirim...
                    </Button>
                  )}
                  
                  {resendStatus === 'success' && (
                    <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-3">
                      <div className="flex">
                        <FiCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                        <p className="text-green-800 text-sm">
                          Email verifikasi telah dikirim. Silakan cek inbox Anda.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {resendStatus === 'error' && (
                    <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-3">
                      <div className="flex">
                        <FiAlertCircle className="text-red-500 mr-2 mt-1 flex-shrink-0" />
                        <p className="text-red-800 text-sm">
                          Gagal mengirim email verifikasi. Silakan coba lagi.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setNeedVerification(false);
                  setResendStatus('idle');
                }}
              >
                Kembali ke Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Monitor</h1>
          <p className="text-gray-600">Masuk ke akun Anda</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Masuk untuk mengakses dashboard error monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 p-3 rounded-md flex items-start">
                  <FiAlertCircle className="text-red-500 mt-0.5 mr-2" />
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <FiLogIn className="mr-2 h-4 w-4" />
                    Masuk
                  </>
                )}
              </Button>
              <div className="text-center text-sm text-gray-600">
                Belum memiliki akun?{' '}
                <Link href="/register" className="text-blue-600 hover:underline">
                  Daftar sekarang
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 
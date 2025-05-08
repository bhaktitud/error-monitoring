'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiLogIn, FiAlertCircle } from 'react-icons/fi';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError('');

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
        setError(err.message);
      } else {
        setError('Email atau password salah. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FiAlertCircle, FiCheck, FiMail } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [needVerification, setNeedVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await AuthAPI.forgotPassword(email);
      
      if (response.success) {
        setIsSuccess(true);
      }
    } catch (err: Error | unknown) {
      console.error('Error requesting password reset:', err);
      
      if (err instanceof Error && err.message.includes('belum diverifikasi')) {
        setNeedVerification(true);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      await AuthAPI.resendVerification(email);
      setIsSuccess(true);
      setNeedVerification(false);
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengirim ulang email verifikasi';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Tampilan sukses
  if (isSuccess) {
    return (
      <div className="flex min-h-screen bg-muted items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg shadow-sm border border-border text-center">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <FiCheck className="text-primary text-xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Email Terkirim</h2>
            <p className="text-muted-foreground mb-6">
              Instruksi untuk reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam Anda.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Kembali ke Halaman Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-lg shadow-sm border border-border">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <FiMail className="text-primary text-xl" />
            </div>
            <h1 className="text-xl font-semibold">Lupa Password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Masukkan email Anda dan kami akan mengirimkan instruksi untuk reset password.
            </p>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 flex items-start">
              <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {needVerification ? (
            <>
              <div className="bg-warning/10 text-warning-foreground text-sm p-3 rounded-md mb-4">
                <p>Email Anda belum diverifikasi. Anda perlu memverifikasi email sebelum dapat mereset password.</p>
              </div>
              <Button
                onClick={handleResendVerification}
                className="w-full mb-3"
                disabled={isLoading}
              >
                {isLoading ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
              </Button>
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Kembali ke Login
                </Link>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full mb-3"
                disabled={isLoading}
              >
                {isLoading ? 'Mengirim...' : 'Kirim Instruksi Reset Password'}
              </Button>
              
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 
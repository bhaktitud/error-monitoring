'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiAlertCircle, FiCheck, FiLoader } from 'react-icons/fi';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Token verifikasi tidak ditemukan');
        return;
      }

      try {
        // Buat URL API untuk verifikasi email
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`;
        
        // Gunakan standar fetch API tanpa opsi redirect
        const response = await fetch(apiUrl);
        
        // Parse respons JSON
        const data = await response.json().catch(() => ({}));
        
        if (response.ok && data.success) {
          // Verifikasi berhasil
          setStatus('success');
          setTimeout(() => {
            router.push(data.redirectUrl || '/verify-success');
          }, 2000);
        } else {
          // Verifikasi gagal
          setStatus('error');
          setErrorMessage(data.error || 'Gagal memverifikasi email');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setErrorMessage('Terjadi kesalahan saat memverifikasi email');
      }
    };

    verifyEmail();
  }, [token, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen bg-muted items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg shadow-sm border border-border text-center">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <FiLoader className="text-primary text-xl animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Memverifikasi Email Anda</h2>
            <p className="text-muted-foreground">
              Mohon tunggu sementara kami memverifikasi email Anda...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex min-h-screen bg-muted items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg shadow-sm border border-border text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
              <FiAlertCircle className="text-destructive text-xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Verifikasi Gagal</h2>
            <p className="text-muted-foreground mb-6">
              {errorMessage || 'Terjadi kesalahan saat memverifikasi email Anda.'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                Kembali ke Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state (sebentar sebelum redirect ke verify-success)
  return (
    <div className="flex min-h-screen bg-muted items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-lg shadow-sm border border-border text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <FiCheck className="text-primary text-xl" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Email Berhasil Diverifikasi!</h2>
          <p className="text-muted-foreground">
            Kami sedang mengalihkan Anda ke halaman berikutnya...
          </p>
        </div>
      </div>
    </div>
  );
} 
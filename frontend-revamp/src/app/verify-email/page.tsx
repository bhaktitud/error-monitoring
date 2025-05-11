'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiAlertCircle, FiCheck, FiChevronLeft } from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import PageTransition from '@/components/ui/page-transition';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mengambil token dari URL
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      verifyEmail(tokenParam);
    } else {
      setError('Token verifikasi tidak valid atau telah kedaluwarsa.');
    }
  }, [searchParams]);

  // Fungsi untuk verifikasi email
  const verifyEmail = async (token: string) => {
    setIsVerifying(true);
    setError('');

    try {
      await AuthAPI.verifyEmail(token);
      setSuccess(true);
      
      // Redirect ke halaman login setelah beberapa detik
      setTimeout(() => {
        router.push('/login');
      }, 5000); // 5 detik agar pesan bisa dibaca
    } catch (err) {
      console.error('Error verifying email:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal verifikasi email. Token mungkin sudah kedaluwarsa.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-[#0B2447] via-[#19376D] to-[#576CBC]">
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
              <FiChevronLeft className="mr-2" /> Kembali
            </Button>
          </Link>
        </div>
        <div className="absolute top-4 right-4">
          <ThemeSwitcher />
        </div>
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary-foreground mb-2">LogRaven</h1>
            <p className="text-primary-foreground/80">Verifikasi Email Anda</p>
          </div>

          <div className="bg-card/95 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-primary-foreground/10 text-center">
            {isVerifying ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <p className="text-lg font-medium">Memverifikasi email Anda...</p>
                <p className="text-muted-foreground mt-2">Mohon tunggu sebentar</p>
              </div>
            ) : success ? (
              <>
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <FiCheck className="text-primary text-xl" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Email Berhasil Diverifikasi!</h2>
                <p className="text-muted-foreground mb-6">
                  Akun Anda telah berhasil diaktifkan. Anda dapat login dan menggunakan semua fitur LogRaven.
                </p>
                <Button onClick={() => router.push('/login')} className="w-full">
                  Masuk Sekarang
                </Button>
              </>
            ) : (
              <>
                {error && (
                  <div className="bg-destructive/20 p-4 rounded-md flex items-start mb-6">
                    <FiAlertCircle className="text-destructive mt-0.5 mr-2" />
                    <div>
                      <p className="text-destructive font-medium">Verifikasi Gagal</p>
                      <p className="text-destructive text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}
                <p className="mb-6 text-muted-foreground">
                  Jika Anda mengalami masalah, silakan kembali ke halaman login dan gunakan opsi &quot;Kirim Ulang Email Verifikasi&quot;.
                </p>
                <div className="flex flex-col space-y-3">
                  <Link href="/login" className="w-full">
                    <Button className="w-full">
                      Kembali ke Login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
} 
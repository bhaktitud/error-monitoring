'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiAlertCircle, FiCheck, FiChevronLeft } from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import PageTransition from '@/components/ui/page-transition';
import { ThemeSwitcher } from '@/components/theme-switcher';
import Footer from '@/components/ui/footer';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mengambil parameter dari URL
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Token reset password tidak valid atau telah kedaluwarsa.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Semua field wajib diisi');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password tidak sama dengan konfirmasi password');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    if (!token) {
      setError('Token reset password tidak valid.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await AuthAPI.resetPassword(token, password);
      setSuccess(true);
      
      // Redirect ke halaman login setelah beberapa detik
      setTimeout(() => {
        router.push('/login');
      }, 5000); // 5 detik agar pesan bisa dibaca
    } catch (err) {
      console.error('Error during password reset:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal mengatur ulang password. Token mungkin sudah kedaluwarsa.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen">
          <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-[#0B2447] via-[#19376D] to-[#576CBC]">
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
              <div className="bg-card/95 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-primary-foreground/10 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <FiCheck className="text-primary text-xl" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Password Berhasil Diubah!</h2>
                <p className="text-muted-foreground mb-6">
                  Password akun Anda telah berhasil diubah. Anda akan diarahkan ke halaman login sebentar lagi.
                </p>
                <Button onClick={() => router.push('/login')} className="w-full">
                  Masuk Sekarang
                </Button>
              </div>
            </motion.div>
          </div>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-[#0B2447] via-[#19376D] to-[#576CBC]">
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
              <p className="text-primary-foreground/80">Atur Ulang Password Anda</p>
            </div>

            <Card className="border border-primary-foreground/10 shadow-lg backdrop-blur-sm bg-card/95">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Reset Password</CardTitle>
                  <CardDescription>
                    Buat password baru untuk akun Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!token && (
                    <div className="bg-destructive/20 p-3 rounded-md flex items-start">
                      <FiAlertCircle className="text-destructive mt-0.5 mr-2" />
                      <span className="text-destructive text-sm">Token reset password tidak valid atau telah kedaluwarsa.</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-destructive/20 p-3 rounded-md flex items-start">
                      <FiAlertCircle className="text-destructive mt-0.5 mr-2" />
                      <span className="text-destructive text-sm">{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1" htmlFor="password">
                      Password Baru
                    </label>
                    <input
                      id="password"
                      type="password"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      disabled={isSubmitting || !token}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1" htmlFor="confirm-password">
                      Konfirmasi Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Masukkan password lagi"
                      disabled={isSubmitting || !token}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting || !token}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      'Simpan Password Baru'
                    )}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    <Link href="/login" className="text-primary hover:underline">
                      Kembali ke login
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
} 
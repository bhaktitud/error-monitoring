'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiLogIn, FiAlertCircle, FiCheck, FiChevronLeft } from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';
import { login } from '@/lib/auth';
import { useCookies } from 'next-client-cookies';
import { motion } from 'framer-motion';
import PageTransition from '@/components/ui/page-transition';
import Footer from '@/components/ui/footer';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cookies = useCookies();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needVerification, setNeedVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Mengambil parameter dari URL jika ada
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

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
      
      // Cek apakah ada invitation yang perlu diproses
      const inviteParamsStr = sessionStorage.getItem('inviteParams');
      if (inviteParamsStr) {
        // Ambil data invite dari sessionStorage
        const inviteParams = JSON.parse(inviteParamsStr);
        
        // Hapus data invite dari sessionStorage
        sessionStorage.removeItem('inviteParams');
        
        // Redirect ke halaman invite untuk menyelesaikan proses
        router.push(`/invite?token=${inviteParams.token}&projectId=${inviteParams.projectId}&email=${encodeURIComponent(inviteParams.email)}`);
      } else {
        // Redirect ke halaman projects setelah berhasil login
        router.push('/projects');
      }
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
              <Card className="border border-primary-foreground/10 shadow-lg backdrop-blur-sm bg-card/95">
                <CardHeader>
                  <CardTitle>Verifikasi Email</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Email Anda belum diverifikasi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-accent p-4 rounded-md border border-accent">
                      <div className="flex">
                        <FiAlertCircle className="text-accent-foreground mr-2 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-accent-foreground text-sm">
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
                        <div className="bg-success/10 p-4 rounded-md border border-success mb-3">
                          <div className="flex">
                            <FiCheck className="text-success mr-2 mt-1 flex-shrink-0" />
                            <p className="text-success-foreground text-sm">
                              Email verifikasi telah dikirim. Silakan cek inbox Anda.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {resendStatus === 'error' && (
                        <div className="bg-destructive/20 p-4 rounded-md border border-destructive mb-3">
                          <div className="flex">
                            <FiAlertCircle className="text-destructive mr-2 mt-1 flex-shrink-0" />
                            <p className="text-destructive text-sm">
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
              <p className="text-primary-foreground/80">Masuk ke akun Anda</p>
            </div>

            <Card className="border border-primary-foreground/10 shadow-lg backdrop-blur-sm bg-card/95">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Masuk untuk mengakses dashboard LogRaven
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="bg-destructive/20 p-3 rounded-md flex items-start">
                      <FiAlertCircle className="text-destructive mt-0.5 mr-2" />
                      <span className="text-destructive text-sm">{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1" htmlFor="password">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-primary hover:underline"
                    >
                      Lupa Password?
                    </Link>
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
                        <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <FiLogIn className="mr-2" /> Login
                      </>
                    )}
                  </Button>
                  
                  <div className="text-center text-sm">
                    Belum punya akun?{' '}
                    <Link href="/register" className="text-primary hover:underline">
                      Daftar
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
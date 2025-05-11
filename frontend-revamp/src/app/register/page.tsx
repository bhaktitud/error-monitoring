'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiUserPlus, FiAlertCircle, FiCheck, FiChevronLeft } from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import PageTransition from '@/components/ui/page-transition';
import Footer from '@/components/ui/footer';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isInvitationRegister, setIsInvitationRegister] = useState(false);

  // Mengambil parameter dari URL jika ada
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const inviteTokenParam = searchParams.get('inviteToken');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (inviteTokenParam) {
      setInviteToken(inviteTokenParam);
      setIsInvitationRegister(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
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

    setIsSubmitting(true);
    setError('');

    try {
      // Memanggil API register dengan inviteToken jika ada
      await AuthAPI.register(email, password, inviteToken);
      
      setSuccess(true);
      
      // Jika ada inviteToken, redirect ke halaman project setelah beberapa detik
      if (isInvitationRegister) {
        setTimeout(() => {
          router.push('/projects');
        }, 5000);
      } else {
        // Redirect ke halaman login setelah beberapa detik
        setTimeout(() => {
          router.push('/login');
        }, 5000); // Ubah jadi 5 detik agar pesan bisa dibaca
      }
    } catch (err) {
      console.error('Error during registration:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal mendaftar. Email mungkin sudah terdaftar atau terjadi kesalahan.');
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
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <FiChevronLeft className="mr-2" /> Kembali
                </Button>
              </Link>
            </div>
            <motion.div 
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="bg-card/95 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/10 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <FiCheck className="text-primary text-xl" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Pendaftaran Berhasil!</h2>
                <p className="text-muted-foreground mb-4">
                  Akun Anda telah berhasil dibuat. Kami telah mengirimkan email verifikasi ke alamat <strong>{email}</strong>.
                </p>
                {isInvitationRegister ? (
                  <>
                    <p className="text-muted-foreground mb-6">
                      Anda telah ditambahkan ke project. Silakan verifikasi email Anda untuk mengakses semua fitur.
                    </p>
                    <Button onClick={() => router.push('/projects')} className="w-full">
                      Lihat Project
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-6">
                      Silakan cek inbox Anda dan klik tautan verifikasi untuk mengaktifkan akun Anda.
                    </p>
                    <Button onClick={() => router.push('/login')} className="w-full">
                      Masuk Sekarang
                    </Button>
                  </>
                )}
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
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <FiChevronLeft className="mr-2" /> Kembali
              </Button>
            </Link>
          </div>
          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">LogRaven</h1>
              <p className="text-white/80">
                {isInvitationRegister ? 'Buat akun untuk bergabung ke project' : 'Buat akun baru'}
              </p>
            </div>

            <Card className="border border-white/10 shadow-lg backdrop-blur-sm bg-card/95">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>
                    {isInvitationRegister ? 'Registrasi Undangan' : 'Registrasi'}
                  </CardTitle>
                  <CardDescription>
                    {isInvitationRegister 
                      ? 'Lengkapi data berikut untuk menerima undangan project'
                      : 'Daftar untuk menggunakan layanan LogRaven'
                    }
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
                      disabled={isSubmitting || isInvitationRegister} // Disable jika dari undangan
                      required
                    />
                    {isInvitationRegister && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Email tidak dapat diubah karena terkait dengan undangan
                      </p>
                    )}
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
                      placeholder="Minimal 8 karakter"
                      disabled={isSubmitting}
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
                        <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="mr-2" /> Daftar
                      </>
                    )}
                  </Button>
                  
                  <div className="text-center text-sm">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-primary hover:underline">
                      Login
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
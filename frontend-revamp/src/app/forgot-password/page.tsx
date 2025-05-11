'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiArrowRight, FiAlertCircle, FiCheck, FiChevronLeft } from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import PageTransition from '@/components/ui/page-transition';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Memanggil API reset password
      await AuthAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Error requesting password reset:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal mengirim email reset password. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-[#0B2447] via-[#19376D] to-[#576CBC]">
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
              <h2 className="text-xl font-semibold mb-2">Email Terkirim!</h2>
              <p className="text-muted-foreground mb-6">
                Kami telah mengirimkan instruksi reset password ke alamat <strong>{email}</strong>. 
                Silakan cek inbox Anda dan ikuti petunjuk untuk mengatur ulang password Anda.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Jika Anda tidak menerima email dalam beberapa menit, periksa folder spam atau coba kirim ulang.
              </p>
              <div className="flex flex-col space-y-3">
                <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
                  Kirim Ulang Email
                </Button>
                <Link href="/login" className="w-full">
                  <Button className="w-full">
                    Kembali ke Login
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-[#0B2447] via-[#19376D] to-[#576CBC]">
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
            <p className="text-white/80">Reset Password Akun Anda</p>
          </div>

          <Card className="border border-white/10 shadow-lg backdrop-blur-sm bg-card/95">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Lupa Password?</CardTitle>
                <CardDescription>
                  Masukkan email Anda untuk menerima tautan reset password
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
                    placeholder="Masukkan email terdaftar"
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
                      Kirim Tautan Reset <FiArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Ingat password Anda?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Kembali ke login
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
} 
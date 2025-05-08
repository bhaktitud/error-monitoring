'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiUserPlus, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Memanggil API register
      await AuthAPI.register(email, password);
      
      setSuccess(true);
      
      // Redirect ke halaman login setelah beberapa detik
      setTimeout(() => {
        router.push('/login');
      }, 5000); // Ubah jadi 5 detik agar pesan bisa dibaca
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
      <div className="flex min-h-screen bg-muted items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-lg shadow-sm border border-border text-center">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <FiCheck className="text-primary text-xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Pendaftaran Berhasil!</h2>
            <p className="text-muted-foreground mb-4">
              Akun Anda telah berhasil dibuat. Kami telah mengirimkan email verifikasi ke alamat <strong>{email}</strong>.
            </p>
            <p className="text-muted-foreground mb-6">
              Silakan cek inbox Anda dan klik tautan verifikasi untuk mengaktifkan akun Anda.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Masuk Sekarang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Monitor</h1>
          <p className="text-muted-foreground">Buat akun baru</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Registrasi</CardTitle>
              <CardDescription>
                Daftar untuk menggunakan layanan error monitoring
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
                    <FiUserPlus className="mr-2 h-4 w-4" />
                    Daftar
                  </>
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Sudah memiliki akun?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Masuk sekarang
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 
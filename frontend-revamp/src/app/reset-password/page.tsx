'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FiAlertCircle, FiCheck, FiLock } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthAPI } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token reset password tidak ditemukan. Silakan minta reset password lagi.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token reset password tidak ditemukan. Silakan minta reset password lagi.');
      return;
    }
    
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Password baru dan konfirmasi password wajib diisi');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Password tidak sama dengan konfirmasi password');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await AuthAPI.resetPassword(token, newPassword);
      
      if (response.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.';
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
            <h2 className="text-xl font-semibold mb-2">Password Berhasil Diubah</h2>
            <p className="text-muted-foreground mb-6">
              Password Anda telah berhasil diubah. Anda sekarang dapat masuk dengan password baru Anda.
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
        <div className="bg-card p-8 rounded-lg shadow-sm border border-border">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <FiLock className="text-primary text-xl" />
            </div>
            <h1 className="text-xl font-semibold">Reset Password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Masukkan password baru Anda
            </p>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 flex items-start">
              <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="new-password">
                Password Baru
              </label>
              <input
                id="new-password"
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="confirm-password">
                Konfirmasi Password
              </label>
              <input
                id="confirm-password"
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan password baru lagi"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full mb-3"
              disabled={isLoading || !token}
            >
              {isLoading ? 'Memproses...' : 'Ubah Password'}
            </Button>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Kembali ke Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
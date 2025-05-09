'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiLock, FiEye, FiEyeOff, FiSave, FiArrowLeft } from 'react-icons/fi';
import { AuthAPI } from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Validate password
  const validatePassword = (): boolean => {
    // Reset error
    setError(null);
    
    // Check if passwords are empty
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Semua kolom harus diisi');
      return false;
    }
    
    // Check if new password and confirm password match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok');
      return false;
    }
    
    // Check if new password is strong enough (minimal 8 karakter)
    if (formData.newPassword.length < 8) {
      setError('Password baru harus minimal 8 karakter');
      return false;
    }
    
    return true;
  };
  
  // Save new password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validatePassword()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await AuthAPI.updatePassword(
        formData.currentPassword,
        formData.newPassword
      );
      
      setSuccess('Password berhasil diperbarui!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Gagal memperbarui password. Pastikan password saat ini benar.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="flex items-center mb-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/account/profile')}
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Profil
          </Button>
          </div>
          <h1 className="text-2xl font-bold mb-2">Ubah Password</h1>
          <p className="text-muted-foreground">Perbarui password akun Anda</p>
        </div>
        
        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive p-4 mb-6 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-primary/20 border border-primary text-primary p-4 mb-6 rounded-md">
            {success}
          </div>
        )}
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-muted-foreground" />
                  </div>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="pl-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-muted-foreground" />
                  </div>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="pl-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Password minimal 8 karakter
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-muted-foreground" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></span>
                      Memperbarui...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      Simpan Password Baru
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
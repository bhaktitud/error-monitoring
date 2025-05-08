'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FiUser, FiMail, FiPhone, FiGlobe, FiGithub, FiFileText, FiMessageSquare, FiUpload, FiSave, FiArrowLeft } from 'react-icons/fi';
import { AuthAPI, UserProfile } from '@/lib/api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    phoneNumber: '',
    avatar: '',
    timezone: 'Asia/Jakarta',
    language: 'id',
    jobTitle: '',
    department: '',
    githubUsername: '',
    notificationPreferences: {
      email: true,
      inApp: true,
      sms: false
    }
  });
  
  // Load user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await AuthAPI.getCurrentUser();
        setProfile({
          ...profile,
          ...userData
        });
        if (userData.avatar) {
          setAvatarPreview(userData.avatar);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Gagal memuat data profil. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle notification preference changes
  const handleNotificationChange = (type: 'email' | 'inApp' | 'sms', checked: boolean) => {
    setProfile(prev => {
      const updatedPreferences = {
        ...prev.notificationPreferences,
        [type]: checked
      };
      
      // Pastikan semua nilai yang diperlukan ada
      const preferences = {
        email: updatedPreferences.email ?? true,
        inApp: updatedPreferences.inApp ?? true,
        sms: updatedPreferences.sms ?? false
      };
      
      return {
        ...prev,
        notificationPreferences: preferences
      };
    });
  };
  
  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      
      // Preview avatar
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setAvatarPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Save profile changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Upload avatar jika ada
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        const result = await AuthAPI.uploadAvatar(formData);
        
        // Update profile dengan URL avatar baru
        if (result.avatarUrl) {
          setProfile(prev => ({ ...prev, avatar: result.avatarUrl }));
        }
      }
      
      // Update profil user
      await AuthAPI.updateProfile({
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        timezone: profile.timezone,
        language: profile.language,
        jobTitle: profile.jobTitle,
        department: profile.department,
        githubUsername: profile.githubUsername,
        notificationPreferences: profile.notificationPreferences
      });
      
      toast.success('Profil berhasil disimpan!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };
  
  // Get user initials for avatar fallback
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/projects')}
            className="mb-4"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-2">Profil Pengguna</h1>
        <p className="text-muted-foreground">Kelola informasi profil dan preferensi akun Anda</p>
      </div>
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 mb-6 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Avatar & Info Dasar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Foto Profil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="mb-4">
                <Avatar className="h-24 w-24">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt={profile.name || profile.email} />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.name, profile.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="mb-4 text-center">
                <h3 className="font-medium">{profile.name || 'Nama belum diatur'}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {profile.jobTitle && <p className="text-sm text-muted-foreground">{profile.jobTitle}</p>}
              </div>
              
              <label className="w-full">
                <span className="sr-only">Pilih avatar</span>
                <div className="flex items-center justify-center w-full border-2 border-dashed border-input rounded-md p-3 hover:border-primary cursor-pointer">
                  <FiUpload className="mr-2" />
                  <span className="text-sm">Pilih Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </label>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Info Akun</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <FiMail className="mr-2" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p>{profile.email}</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    onClick={async () => {
                      try {
                        setError(null);
                        const result = await AuthAPI.sendTestEmail();
                        toast.success(result.message || 'Email test berhasil dikirim!');
                      } catch (err) {
                        console.error('Error sending test email:', err);
                        setError('Gagal mengirim email test. Silakan coba lagi.');
                      }
                    }}
                  >
                    <FiMail className="mr-2 h-4 w-4" />
                    Kirim Email Test
                  </Button>
                </div>
                
                <div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    <FiFileText className="mr-2" />
                    <span className="text-sm">Tanggal Bergabung</span>
                  </div>
                  <p>{profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('id-ID') : 'Tidak tersedia'}</p>
                </div>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/account/password')}
                >
                  Ubah Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Kolom Kanan: Form Profil */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="text-muted-foreground" />
                      </div>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Nama lengkap Anda"
                        value={profile.name || ''}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumber">Nomor Telepon</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="text-muted-foreground" />
                      </div>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="+62 xxx xxx xxxx"
                        value={profile.phoneNumber || ''}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="jobTitle">Jabatan</Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      placeholder="Jabatan/posisi Anda"
                      value={profile.jobTitle || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="department">Departemen/Tim</Label>
                    <Input
                      id="department"
                      name="department"
                      placeholder="Departemen/tim Anda"
                      value={profile.department || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="githubUsername">Username GitHub</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiGithub className="text-muted-foreground" />
                      </div>
                      <Input
                        id="githubUsername"
                        name="githubUsername"
                        placeholder="username"
                        value={profile.githubUsername || ''}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-input">
                  <div>
                    <Label htmlFor="timezone">Zona Waktu</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiGlobe className="text-muted-foreground" />
                      </div>
                      <select
                        id="timezone"
                        name="timezone"
                        value={profile.timezone || 'Asia/Jakarta'}
                        onChange={handleChange}
                        className="pl-10 w-full p-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                      >
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                        <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="language">Bahasa</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMessageSquare className="text-muted-foreground" />
                      </div>
                      <select
                        id="language"
                        name="language"
                        value={profile.language || 'id'}
                        onChange={handleChange}
                        className="pl-10 w-full p-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-input">
                  <h3 className="font-medium mb-3">Preferensi Notifikasi</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notify-email" className="font-normal">Notifikasi Email</Label>
                        <p className="text-sm text-muted-foreground">Terima notifikasi melalui email</p>
                      </div>
                      <Switch
                        id="notify-email"
                        checked={profile.notificationPreferences?.email ?? true}
                        onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notify-inapp" className="font-normal">Notifikasi Aplikasi</Label>
                        <p className="text-sm text-muted-foreground">Terima notifikasi dalam aplikasi</p>
                      </div>
                      <Switch
                        id="notify-inapp"
                        checked={profile.notificationPreferences?.inApp ?? true}
                        onCheckedChange={(checked) => handleNotificationChange('inApp', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notify-sms" className="font-normal">Notifikasi SMS</Label>
                        <p className="text-sm text-muted-foreground">Terima notifikasi melalui SMS</p>
                      </div>
                      <Switch
                        id="notify-sms"
                        checked={profile.notificationPreferences?.sms ?? false}
                        onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/projects')}
                    className="mr-2"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
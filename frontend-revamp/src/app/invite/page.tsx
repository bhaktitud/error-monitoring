'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { BASE_API_URL } from '@/lib/constants';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [needRegister, setNeedRegister] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  const token = searchParams.get('token');
  const projectId = searchParams.get('projectId');
  const email = searchParams.get('email');

  // Cek status login
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      setIsLoggedIn(!!session);
    };
    
    checkSession();
  }, []);

  // Validasi parameter
  useEffect(() => {
    if (!token || !projectId || !email) {
      setError('Parameter undangan tidak lengkap.');
      setLoading(false);
      return;
    }

    // Jika sudah login, coba terima undangan
    if (isLoggedIn) {
      acceptInvitation();
    } else {
      setLoading(false);
    }
  }, [token, projectId, email, isLoggedIn]);

  // Fungsi untuk menerima undangan
  const acceptInvitation = async () => {
    setLoading(true);
    
    try {
      // Dapatkan token autentikasi
      const authToken = await getSession();
      
      const response = await fetch(`${BASE_API_URL}/projects/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify({ token, projectId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needRegister) {
          setNeedRegister(true);
        } else if (data.alreadyMember) {
          setAlreadyMember(true);
          setProjectName(data.projectName);
        } else {
          setError(data.error || 'Terjadi kesalahan saat menerima undangan.');
        }
      } else {
        setSuccess(data.message);
        setProjectName(data.projectName);
        setRole(data.role);
      }
    } catch (err) {
      console.error('Error saat menerima undangan:', err);
      setError('Terjadi kesalahan saat menghubungi server.');
    }
    
    setLoading(false);
  };

  // Handle login & menerima undangan
  const handleLoginAndAccept = () => {
    // Simpan parameter invite dalam sessionStorage untuk digunakan setelah login
    sessionStorage.setItem('inviteParams', JSON.stringify({ token, projectId, email }));
    router.push(`/login?redirect=/invite&email=${encodeURIComponent(email as string)}`);
  };

  // Handle register & menerima undangan
  const handleRegisterAndAccept = () => {
    router.push(`/register?inviteToken=${token}&email=${encodeURIComponent(email as string)}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Memproses Undangan</CardTitle>
            <CardDescription>Mohon tunggu, undangan sedang diproses...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Undangan Tidak Valid</CardTitle>
            <CardDescription>Terjadi kesalahan saat memproses undangan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Gagal</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (needRegister) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Buat Akun untuk Menerima Undangan</CardTitle>
            <CardDescription>
              Anda perlu membuat akun dengan email <strong>{email}</strong> untuk bergabung dengan project ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <AlertTitle>Perlu Registrasi</AlertTitle>
              <AlertDescription>
                Anda belum memiliki akun dengan email tersebut. Silakan registrasi untuk melanjutkan.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="default" onClick={handleRegisterAndAccept} className="w-full">
              Buat Akun Baru
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sudah Menjadi Anggota</CardTitle>
            <CardDescription>
              Anda sudah menjadi anggota project {projectName || 'ini'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200 mb-4">
              <CheckCircledIcon className="h-4 w-4" />
              <AlertTitle>Informasi</AlertTitle>
              <AlertDescription>
                Anda sudah terdaftar sebagai anggota project {projectName || 'ini'}.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button asChild variant="default" className="w-full">
              <Link href="/projects">Lihat Projects</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Undangan Diterima</CardTitle>
            <CardDescription>
              Selamat! Anda telah berhasil bergabung dengan project {projectName || 'ini'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200 mb-4">
              <CheckCircledIcon className="h-4 w-4" />
              <AlertTitle>Berhasil</AlertTitle>
              <AlertDescription>
                {success} sebagai <strong>{role}</strong>.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button asChild variant="outline" className="w-1/2">
              <Link href="/">Ke Beranda</Link>
            </Button>
            <Button asChild variant="default" className="w-1/2">
              <Link href="/projects">Lihat Projects</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Undangan Project</CardTitle>
          <CardDescription>
            Anda diundang untuk bergabung ke project dengan email {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <AlertTitle>Masuk untuk Melanjutkan</AlertTitle>
            <AlertDescription>
              Anda perlu masuk ke akun dengan email {email} untuk menerima undangan ini.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="default" onClick={handleLoginAndAccept} className="w-full">
            Masuk & Terima Undangan
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
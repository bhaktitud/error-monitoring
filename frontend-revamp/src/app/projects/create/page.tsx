'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiArrowLeft, FiAlertCircle, FiCheck } from 'react-icons/fi';
import { ProjectsAPI } from '@/lib/api';

export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Nama proyek wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Memanggil API untuk membuat proyek baru
      const newProject = await ProjectsAPI.createProject(name);
      setSuccess(true);
      
      // Redirect ke halaman proyek setelah 1.5 detik
      setTimeout(() => {
        router.push(`/projects/${newProject.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating project:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal membuat proyek. Silakan coba lagi nanti.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
          className="mr-4"
        >
          <FiArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Buat Proyek Baru</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Informasi Proyek</CardTitle>
              <CardDescription>
                Masukkan informasi untuk proyek monitoring error baru Anda
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 p-3 rounded-md flex items-start">
                  <FiAlertCircle className="text-red-500 mt-0.5 mr-2" />
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 p-3 rounded-md flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2" />
                  <span className="text-green-600 text-sm">Proyek berhasil dibuat! Anda akan dialihkan dalam beberapa detik.</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nama Proyek</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama proyek"
                  disabled={isSubmitting || success}
                />
                <p className="text-sm text-gray-500">
                  Berikan nama yang deskriptif untuk proyek Anda, misalnya &quot;Website Frontend&quot; atau &quot;Mobile API&quot;
                </p>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                type="submit"
                disabled={isSubmitting || success}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Memproses...
                  </>
                ) : success ? (
                  <>
                    <FiCheck className="mr-2 h-4 w-4" />
                    Berhasil Dibuat
                  </>
                ) : (
                  'Buat Proyek'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
} 
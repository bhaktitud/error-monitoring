'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiArrowLeft, FiCopy, FiCode, FiSettings, FiAlertCircle, FiSend } from 'react-icons/fi';
import { EventsAPI, ProjectsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  dsn: string;
  createdAt: string;
}

export default function SettingsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testErrorStatus, setTestErrorStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const projectData = await ProjectsAPI.getProject(projectId);
        setProject(projectData);
        setError(null);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Gagal memuat data proyek. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const copyDSN = () => {
    if (project?.dsn) {
      navigator.clipboard.writeText(project.dsn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteProject = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus proyek ini? Tindakan ini tidak dapat dibatalkan dan semua data terkait proyek ini akan dihapus.'
    );
    
    if (confirmed) {
      // Di aplikasi nyata, ini akan diganti dengan pemanggilan API
      // untuk menghapus proyek
      alert('Proyek berhasil dihapus (simulasi)');
      router.push('/projects');
    }
  };

  // Fungsi untuk mengirim test error
  const sendTestError = async () => {
    if (!project?.dsn) return;
    
    setTestErrorStatus('sending');
    
    try {
      await EventsAPI.sendEvent(project.dsn, {
        errorType: 'TestError',
        message: 'Ini adalah error tes dari UI settings',
        stacktrace: 'Error: Ini adalah error tes\n    at SettingsPage (/src/app/projects/[id]/settings/page.tsx:45)',
        userAgent: navigator.userAgent,
        statusCode: 418,
        tags: { source: 'settings_test', version: '1.0.0' }
      });
      
      setTestErrorStatus('success');
      setTimeout(() => setTestErrorStatus('idle'), 3000);
    } catch (err) {
      console.error('Error sending test error:', err);
      setTestErrorStatus('error');
      setTimeout(() => setTestErrorStatus('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Memuat pengaturan proyek...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center p-12">
          <FiAlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Proyek tidak ditemukan</h2>
          <p className="mb-4">Proyek yang Anda cari tidak dapat ditemukan.</p>
          <Button onClick={() => router.push('/projects')}>
            Kembali ke Daftar Proyek
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mr-4"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive p-4 mb-6 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Informasi Proyek */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiSettings className="mr-2 h-5 w-5" />
                Informasi Proyek
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nama Proyek
                  </label>
                  <div className="text-lg">{project.name}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    ID Proyek
                  </label>
                  <div className="text-sm font-mono bg-muted p-2 rounded border">{project.id}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    DSN (Data Source Name)
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyDSN}
                      className="ml-2"
                    >
                      <FiCopy className="h-3 w-3 mr-1" />
                      {copied ? 'Disalin!' : 'Salin'}
                    </Button>
                  </label>
                  <div className="text-sm font-mono bg-muted p-2 rounded border overflow-auto">
                    {project.dsn}
                  </div>
                </div>
                
                <div>
                  <Button 
                    variant="outline"
                    className="flex items-center"
                    onClick={sendTestError}
                    disabled={testErrorStatus === 'sending'}
                  >
                    <FiSend className="mr-2 h-4 w-4" />
                    {testErrorStatus === 'idle' && 'Kirim Error Tes'}
                    {testErrorStatus === 'sending' && 'Mengirim...'}
                    {testErrorStatus === 'success' && 'Berhasil Terkirim!'}
                    {testErrorStatus === 'error' && 'Gagal Mengirim'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ini akan mengirim event error tes ke proyek Anda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Panduan Integrasi */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiCode className="mr-2 h-5 w-5" />
                Panduan Integrasi
              </h2>
              
              <div className="space-y-4">
                <p>
                  Untuk mulai melacak error dalam aplikasi Anda, ikuti panduan integrasi berikut:
                </p>
                
                <div className="bg-muted p-4 rounded-md border">
                  <h3 className="font-semibold mb-2">1. Instalasi SDK</h3>
                  <div className="bg-background text-foreground p-3 rounded font-mono text-sm mb-2 overflow-x-auto relative group">
                    <button 
                      className="absolute top-2 right-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText('npm install @error-monitor/sdk');
                        toast.success('Kode disalin!');
                      }}
                    >
                      <FiCopy size={14} />
                    </button>
                    <pre className="whitespace-pre">npm install @error-monitor/sdk</pre>
                  </div>
                  
                  <h3 className="font-semibold mb-2 mt-4">2. Konfigurasi SDK</h3>
                  <div className="bg-background text-foreground p-3 rounded font-mono text-sm mb-2 overflow-x-auto relative group">
                    <button 
                      className="absolute top-2 right-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(`import { init } from '@error-monitor/sdk';

// Inisialisasi SDK dengan DSN proyek Anda
init({
  dsn: '${project.dsn}',
  environment: process.env.NODE_ENV,
  release: '1.0.0',
  // Opsi tambahan
  beforeSend: (event) => {
    // Filter atau modifikasi event sebelum dikirim
    return event;
  }
});`);
                        toast.success('Kode disalin!');
                      }}
                    >
                      <FiCopy size={14} />
                    </button>
                    <pre className="whitespace-pre">{`import { init } from '@error-monitor/sdk';

// Inisialisasi SDK dengan DSN proyek Anda
init({
  dsn: '${project.dsn}',
  environment: process.env.NODE_ENV,
  release: '1.0.0',
  // Opsi tambahan
  beforeSend: (event) => {
    // Filter atau modifikasi event sebelum dikirim
    return event;
  }
});`}</pre>
                  </div>
                  
                  <div className="bg-background text-foreground p-3 rounded font-mono text-sm mb-2 overflow-x-auto relative group mt-4">
                    <button 
                      className="absolute top-2 right-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(`// Contoh penggunaan dalam aplikasi
import { captureException } from '@error-monitor/sdk';

try {
  // Kode aplikasi Anda
  throw new Error('Terjadi kesalahan');
} catch (error) {
  // Tangkap dan kirim error
  captureException(error, {
    tags: {
      section: 'checkout',
      userId: '123'
    }
  });
}`);
                        toast.success('Kode disalin!');
                      }}
                    >
                      <FiCopy size={14} />
                    </button>
                    <pre className="whitespace-pre">{`// Contoh penggunaan dalam aplikasi
import { captureException } from '@error-monitor/sdk';

try {
  // Kode aplikasi Anda
  throw new Error('Terjadi kesalahan');
} catch (error) {
  // Tangkap dan kirim error
  captureException(error, {
    tags: {
      section: 'checkout',
      userId: '123'
    }
  });
}`}</pre>
                  </div>
                  
                  <div className="bg-background text-foreground p-3 rounded font-mono text-sm mb-2 overflow-x-auto relative group mt-4">
                    <button 
                      className="absolute top-2 right-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(`// Contoh penggunaan sebagai middleware
import { withErrorMonitoring } from '@error-monitor/sdk';

// Middleware untuk Express.js
const errorMiddleware = withErrorMonitoring((req, res, next) => {
  try {
    // Logika middleware Anda
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware untuk Next.js API Routes
export default withErrorMonitoring(async function handler(req, res) {
  // Handler API Anda
  const data = await fetchData();
  res.status(200).json(data);
});

// Middleware untuk Next.js App Router
export const middleware = withErrorMonitoring(async (request) => {
  // Logika middleware Anda
  const response = NextResponse.next();
  return response;
});`);
                        toast.success('Kode disalin!');
                      }}
                    >
                      <FiCopy size={14} />
                    </button>
                    <pre className="whitespace-pre">{`// Contoh penggunaan sebagai middleware
import { withErrorMonitoring } from '@error-monitor/sdk';

// Middleware untuk Express.js
const errorMiddleware = withErrorMonitoring((req, res, next) => {
  try {
    // Logika middleware Anda
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware untuk Next.js API Routes
export default withErrorMonitoring(async function handler(req, res) {
  // Handler API Anda
  const data = await fetchData();
  res.status(200).json(data);
});

// Middleware untuk Next.js App Router
export const middleware = withErrorMonitoring(async (request) => {
  // Logika middleware Anda
  const response = NextResponse.next();
  return response;
});`}</pre>
                  </div>
                  
                  <h3 className="font-semibold mb-2 mt-4">3. Dokumentasi</h3>
                  <div className="bg-background text-foreground p-3 rounded font-mono text-sm overflow-x-auto">
                    <p className="text-sm text-muted-foreground">
                      Untuk dokumentasi lengkap dan panduan implementasi, silakan kunjungi:
                    </p>
                    <a 
                      href="https://docs.error-monitor.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline mt-2 inline-block"
                    >
                      docs.error-monitor.com
                    </a>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mt-4">
                  Jika Anda membutuhkan bantuan tambahan, tim support kami siap membantu Anda.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 text-destructive flex items-center">
                <FiAlertCircle className="mr-2 h-5 w-5" />
                Danger Zone
              </h2>
              
              <div className="p-4 border border-destructive rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Hapus Proyek</h3>
                    <p className="text-sm text-muted-foreground">
                      Tindakan ini tidak dapat dibatalkan. Semua data terkait proyek ini akan dihapus secara permanen.
                    </p>
                  </div>
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteProject}
                  >
                    Hapus Proyek
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 
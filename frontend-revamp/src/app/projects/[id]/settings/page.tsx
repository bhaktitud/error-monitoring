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
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Memuat pengaturan proyek...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center p-12">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
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
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
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
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nama Proyek
                  </label>
                  <div className="text-lg">{project.name}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    ID Proyek
                  </label>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded border">{project.id}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center">
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
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded border overflow-auto">
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
                  <p className="text-xs text-gray-500 mt-1">
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
                
                <div className="bg-gray-50 p-4 rounded-md border">
                  <h3 className="font-semibold mb-2">1. Instalasi SDK</h3>
                  <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm mb-2 overflow-x-auto relative group">
                    <button 
                      className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm mb-2 overflow-x-auto relative group">
                    <button 
                      className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(`import { init } from '@error-monitor/sdk';

init({
  dsn: '${project.dsn}'
});`);
                        toast.success('Kode disalin!');
                      }}
                    >
                      <FiCopy size={14} />
                    </button>
                    <pre className="whitespace-pre">{`import { init } from '@error-monitor/sdk';

init({
  dsn: '${project.dsn}'
});`}</pre>
                  </div>
                  
                  <h3 className="font-semibold mb-2 mt-4">3. Tangkap Error</h3>
                  <div className="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto relative group">
                    <button 
                      className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(`import { captureException } from '@error-monitor/sdk';

try {
  // Kode Anda
} catch (error) {
  captureException(error);
}`);
                        toast.success('Kode disalin!');
                      }}
                    >
                      <FiCopy size={14} />
                    </button>
                    <pre className="whitespace-pre">{`import { captureException } from '@error-monitor/sdk';

try {
  // Kode Anda
} catch (error) {
  captureException(error);
}`}</pre>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  Untuk dokumentasi lebih lengkap dan opsi konfigurasi lanjutan, kunjungi dokumentasi API kami.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600 flex items-center">
                <FiAlertCircle className="mr-2 h-5 w-5" />
                Danger Zone
              </h2>
              
              <div className="p-4 border border-red-300 rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Hapus Proyek</h3>
                    <p className="text-sm text-gray-600">
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
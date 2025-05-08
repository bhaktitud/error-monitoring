'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiPlus, FiActivity, FiCopy } from 'react-icons/fi';
import { ProjectsAPI } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  dsn: string;
  createdAt: string;
}

// Fungsi untuk memformat tanggal dari API
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    // Ambil data projects dari API
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await ProjectsAPI.getProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Gagal memuat data proyek. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleCreateProject = () => {
    // Navigasi ke halaman buat proyek
    router.push('/projects/create');
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleCopyDSN = (dsn: string) => {
    navigator.clipboard.writeText(dsn);
    setCopySuccess('DSN berhasil disalin');
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Proyek</h1>
        <Button onClick={handleCreateProject}>
          <FiPlus className="mr-2 h-4 w-4" />
          Buat Proyek Baru
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/20 border border-destructive text-destructive p-4 mb-6 rounded-md">
          {error}
        </div>
      )}

      {copySuccess && (
        <div className="bg-primary/20 border border-primary text-primary p-4 mb-6 rounded-md">
          {copySuccess}
        </div>
      )}

      {loading ? (
        <div className="text-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Memuat proyek...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-lg border border-dashed border-border">
          <h3 className="font-medium text-lg mb-2">Belum ada proyek</h3>
          <p className="text-muted-foreground mb-4">Mulai dengan membuat proyek baru untuk memantau error aplikasi Anda.</p>
          <Button onClick={handleCreateProject}>
            <FiPlus className="mr-2 h-4 w-4" />
            Buat Proyek Baru
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleProjectClick(project.id)}
            >
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>
                  Dibuat pada {formatDate(project.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">DSN:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{project.dsn}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyDSN(project.dsn);
                    }}
                  >
                    <FiCopy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectClick(project.id);
                  }}
                >
                  <FiActivity className="mr-2 h-4 w-4" />
                  Lihat Error
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
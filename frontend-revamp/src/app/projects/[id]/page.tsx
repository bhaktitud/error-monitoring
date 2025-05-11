'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorCard } from '@/components/ui/error-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FiSettings, FiExternalLink, FiCopy, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { ProjectsAPI, GroupsAPI, EventsAPI } from '@/lib/api';

interface ErrorGroup {
  id: string;
  errorType: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status: 'open' | 'resolved' | 'ignored';
  assignedTo?: string;
  statusCode?: number;
}

interface Project {
  id: string;
  name: string;
  dsn: string;
  createdAt?: string;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [errorGroups, setErrorGroups] = useState<ErrorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingErrorGroups, setLoadingErrorGroups] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventsUsage, setEventsUsage] = useState<{ totalEvents: number; quota: number; percent: number } | null>(null);

  // Fungsi untuk menyalin DSN ke clipboard
  const copyDSN = () => {
    if (project?.dsn) {
      navigator.clipboard.writeText(project.dsn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectData, groupsData, usageData] = await Promise.all([
          ProjectsAPI.getProject(projectId),
          GroupsAPI.getGroups(projectId),
          EventsAPI.getEventsUsage(projectId)
        ]);
        
        setProject(projectData);
        const typedGroups = groupsData.map(group => ({
          ...group,
          status: group.status as 'open' | 'resolved' | 'ignored'
        }));
        setErrorGroups(typedGroups);
        setEventsUsage(usageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
        setLoadingErrorGroups(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Memuat proyek...</p>
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
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/projects`)}
              className="mr-4"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              {/* Kembali */}
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          </div>
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/settings`)}>
            <FiSettings className="mr-2 h-4 w-4" />
            Pengaturan Proyek
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">DSN (Data Source Name)</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={copyDSN}>
                    <FiCopy className="mr-1 h-4 w-4" />
                    {copied ? 'Disalin!' : 'Salin'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${projectId}/sdk-setup`)}>
                    <FiExternalLink className="mr-1 h-4 w-4" />
                    Setup Guide
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-3 rounded font-mono text-sm border">{project.dsn}</div>
            </CardContent>
          </Card>

          {eventsUsage && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Kuota Events Bulanan</h3>
                <ProgressBar 
                  percent={eventsUsage.percent} 
                  total={eventsUsage.totalEvents} 
                  quota={eventsUsage.quota} 
                />
              </CardContent>
            </Card>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-4">Error Terbaru</h2>
        
        {loadingErrorGroups ? (
          <div className="text-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Memuat error groups...</p>
          </div>
        ) : errorGroups.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-lg border border-dashed border-border">
            <FiAlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Belum ada error yang dilaporkan</h3>
            <p className="text-muted-foreground mb-4">Error akan muncul disini setelah aplikasi Anda mengirimkan error melalui SDK.</p>
            <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/sdk-setup`)}>
              Lihat Panduan Integrasi
            </Button>
          </div>
        ) : (
          <div>
            {errorGroups.map((errorGroup) => (
              <ErrorCard
                key={errorGroup.id}
                id={errorGroup.id}
                errorType={errorGroup.errorType}
                message={errorGroup.message}
                count={errorGroup.count}
                firstSeen={errorGroup.firstSeen}
                lastSeen={errorGroup.lastSeen}
                status={errorGroup.status}
                assignedTo={errorGroup.assignedTo}
                statusCode={errorGroup.statusCode}
                onClick={() => router.push(`/projects/${projectId}/groups/${errorGroup.id}`)}
              />
            ))}
            <div className="mt-4 text-center">
              <Button 
                variant="outline"
                onClick={() => router.push(`/projects/${projectId}/groups`)}
              >
                Lihat Semua Error Groups
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
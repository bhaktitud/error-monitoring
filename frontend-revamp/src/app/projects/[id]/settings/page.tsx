'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FiArrowLeft, FiSave, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { useProjectsStore } from '@/lib/store';
import type { Project } from '@/lib/store/projects';

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { 
    currentProject,
    isLoading,
    error: storeError,
    fetchProject,
    updateProject,
    deleteProject,
    clearError
  } = useProjectsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchProject(projectId);
  }, [projectId, fetchProject]);

  const handleSaveSettings = async () => {
    if (!currentProject) return;
    
    try {
      setIsSaving(true);
      clearError();
      
      const updates: Partial<Project> = {
        name: currentProject.name,
        description: currentProject.description,
        apiKey: currentProject.apiKey
      };
      
      await updateProject(projectId, updates);
      
      setSuccess('Pengaturan project berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving project settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    
    try {
      setIsDeleting(true);
      clearError();
      
      await deleteProject(projectId);
      router.push('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject) return;
    updateProject(projectId, { name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentProject) return;
    updateProject(projectId, { description: e.target.value });
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject) return;
    updateProject(projectId, { apiKey: e.target.value });
  };

  const handleGenerateApiKey = () => {
    if (!currentProject) return;
    const newKey = Math.random().toString(36).substring(2) + Date.now().toString(36);
    updateProject(projectId, { apiKey: newKey });
  };

  if (isLoading) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Memuat pengaturan project...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentProject) {
    return (
      <DashboardLayout projectId={projectId}>
        <div className="text-center p-12">
          <FiAlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Gagal memuat project</h2>
          <p className="mb-4">Terjadi kesalahan saat memuat pengaturan project.</p>
          <Button onClick={() => router.push('/projects')}>
            Kembali ke Daftar Project
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectId={projectId}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/projects/${projectId}`)}
              className="mr-4"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </div>
          
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving || isLoading}
          >
            <FiSave className="mr-2 h-4 w-4" />
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>

        {storeError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
            {storeError}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 mb-6 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Project Settings */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Pengaturan Project</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name" className="text-base mb-1 block">
                    Nama Project
                  </Label>
                  <Input 
                    id="project-name"
                    value={currentProject.name}
                    onChange={handleNameChange}
                    placeholder="Masukkan nama project"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project-description" className="text-base mb-1 block">
                    Deskripsi
                  </Label>
                  <Textarea 
                    id="project-description"
                    value={currentProject.description || ''}
                    onChange={handleDescriptionChange}
                    placeholder="Masukkan deskripsi project"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="api-key" className="text-base mb-1 block">
                    API Key
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="api-key"
                      value={currentProject.apiKey}
                      onChange={handleApiKeyChange}
                      placeholder="Masukkan API key"
                      className="font-mono"
                    />
                    <Button 
                      variant="outline"
                      onClick={handleGenerateApiKey}
                    >
                      Generate Baru
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    API key digunakan untuk mengautentikasi request dari aplikasi Anda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Zona Berbahaya</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Hapus Project</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tindakan ini tidak dapat dibatalkan. Semua data project akan dihapus secara permanen.
                  </p>
                  
                  {!showDeleteConfirm ? (
                    <Button 
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <FiTrash2 className="mr-2 h-4 w-4" />
                      Hapus Project
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-red-600">
                        Apakah Anda yakin ingin menghapus project ini?
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          variant="destructive"
                          onClick={handleDeleteProject}
                          disabled={isDeleting}
                        >
                          <FiTrash2 className="mr-2 h-4 w-4" />
                          {isDeleting ? 'Menghapus...' : 'Ya, Hapus Project'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectAPI } from '@/lib/api/services/project';
import type { Project } from '@/lib/api/services/types';

interface UseProjectOptions {
  initialProject?: Project;
  projectId?: string;
  autoFetch?: boolean;
}

/**
 * Hook untuk mengelola project
 */
export function useProject({
  initialProject,
  projectId,
  autoFetch = true,
}: UseProjectOptions = {}) {
  const [project, setProject] = useState<Project | null>(initialProject || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fungsi untuk mendapatkan data project
  const fetchProject = useCallback(async (id: string) => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await ProjectAPI.getProject(id);
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fungsi untuk membuat project baru
  const createProject = useCallback(async (data: {
    name: string;
    description?: string;
    environment?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newProject = await ProjectAPI.createProject(data);
      setProject(newProject);
      
      // Navigasi ke halaman project baru
      router.push(`/projects/${newProject.id}`);
      
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fungsi untuk mengupdate project
  const updateProject = useCallback(async (id: string, data: {
    name?: string;
    description?: string;
    environment?: string;
    isActive?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = await ProjectAPI.updateProject(id, data);
      setProject(updatedProject);
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fungsi untuk regenerate API key
  const regenerateApiKey = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { apiKey } = await ProjectAPI.regenerateApiKey(id);
      setProject((prev: Project | null) => prev ? { ...prev, apiKey } : null);
      return apiKey;
    } catch (err) {
      console.error('Error regenerating API key:', err);
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch project saat komponen dimount jika projectId diberikan dan autoFetch true
  useEffect(() => {
    if (projectId && autoFetch) {
      fetchProject(projectId);
    }
  }, [projectId, autoFetch, fetchProject]);

  return {
    project,
    isLoading,
    error,
    fetchProject,
    createProject,
    updateProject,
    regenerateApiKey,
  };
} 
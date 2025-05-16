import { apiRequest } from '../core';
import type { Project } from './types';

/**
 * Project API endpoints
 */
export const ProjectAPI = {
  // Ambil project berdasarkan ID
  getProject: async (projectId: string) => {
    return apiRequest<Project>(`/projects/${projectId}`);
  },
  
  // Ambil daftar semua project
  getProjects: async () => {
    return apiRequest<Project[]>('/projects');
  },
  
  // Buat project baru
  createProject: async (data: {
    name: string;
    description?: string;
    environment?: string;
  }) => {
    return apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // Update project yang sudah ada
  updateProject: async (projectId: string, data: {
    name?: string;
    description?: string;
    environment?: string;
    isActive?: boolean;
  }) => {
    return apiRequest<Project>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  
  // Generate ulang API key untuk project
  regenerateApiKey: async (projectId: string) => {
    return apiRequest<{apiKey: string}>(`/projects/${projectId}/regenerate-key`, {
      method: 'POST'
    });
  },
  
  // Hapus project
  deleteProject: async (projectId: string) => {
    return apiRequest<{success: boolean}>(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }
}; 
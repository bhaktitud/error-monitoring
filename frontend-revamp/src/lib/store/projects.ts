import { create } from 'zustand';
import { ProjectsAPI } from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
  };
}

interface ProjectInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  inviter: {
    email: string;
    name: string;
  };
}

export interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: { name: string; description?: string }) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const projects = await ProjectsAPI.getProjects();
      set({ projects, isLoading: false });
    } catch (err) {
      console.error('Error fetching projects:', err);
      set({ error: 'Gagal memuat daftar project', isLoading: false });
    }
  },

  fetchProject: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const project = await ProjectsAPI.getProject(id);
      set({ currentProject: project, isLoading: false });
    } catch (err) {
      console.error('Error fetching project:', err);
      set({ error: 'Gagal memuat data project', isLoading: false });
    }
  },

  createProject: async (data: { name: string; description?: string }) => {
    try {
      set({ isLoading: true, error: null });
      const project = await ProjectsAPI.createProject(data);
      set(state => ({ 
        projects: [...state.projects, project],
        isLoading: false 
      }));
      return project;
    } catch (err) {
      console.error('Error creating project:', err);
      set({ error: 'Gagal membuat project baru', isLoading: false });
      throw err;
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    try {
      set({ isLoading: true, error: null });
      await ProjectsAPI.updateProject(id, data);
      
      // Update local state
      set(state => {
        const updatedProjects = state.projects.map(p => 
          p.id === id ? { ...p, ...data } : p
        );
        const updatedCurrentProject = state.currentProject?.id === id 
          ? { ...state.currentProject, ...data }
          : state.currentProject;
        
        return { 
          projects: updatedProjects,
          currentProject: updatedCurrentProject,
          isLoading: false 
        };
      });
    } catch (err) {
      console.error('Error updating project:', err);
      set({ error: 'Gagal mengupdate project', isLoading: false });
      throw err;
    }
  },

  deleteProject: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await ProjectsAPI.deleteProject(id);
      
      // Update local state
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false
      }));
    } catch (err) {
      console.error('Error deleting project:', err);
      set({ error: 'Gagal menghapus project', isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null })
})); 
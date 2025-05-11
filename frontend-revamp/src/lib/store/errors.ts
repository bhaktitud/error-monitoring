import { create } from 'zustand';
import { GroupsAPI, EventsAPI } from '@/lib/api';

interface UserContext {
  userId?: string;
  [key: string]: unknown;
}

interface Tags {
  version?: string;
  [key: string]: unknown;
}

interface Event {
  id: string;
  errorType: string;
  message: string;
  timestamp: string;
  stacktrace: string;
  userAgent: string;
  statusCode: number;
  userContext: UserContext;
  tags: Tags;
}

export interface ErrorGroup {
  id: string;
  projectId: string;
  name: string;
  message: string;
  status: 'open' | 'resolved' | 'ignored';
  level: 'error' | 'warning' | 'info';
  count: number;
  lastSeen: string;
  firstSeen: string;
  createdAt: string;
  updatedAt: string;
  errorType?: string;
  statusCode?: number;
  assignedTo?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    user: {
      id: string;
      email: string;
    };
  };
}

interface ErrorsState {
  groups: ErrorGroup[];
  currentGroup: ErrorGroup | null;
  events: Event[];
  comments: Comment[];
  eventsUsage: {
    totalEvents: number;
    quota: number;
    percent: number;
  } | null;
  isLoading: boolean;
  loadingEvents: boolean;
  loadingComments: boolean;
  error: string | null;
  fetchGroups: (projectId: string) => Promise<void>;
  fetchGroup: (projectId: string, groupId: string) => Promise<void>;
  fetchEvents: (groupId: string) => Promise<void>;
  fetchComments: (groupId: string) => Promise<void>;
  fetchEventsUsage: (projectId: string) => Promise<void>;
  changeGroupStatus: (groupId: string, status: 'open' | 'resolved' | 'ignored') => Promise<void>;
  assignGroup: (groupId: string, memberId: string | null) => Promise<void>;
  addComment: (groupId: string, content: string) => Promise<void>;
  clearError: () => void;
}

export const useErrorsStore = create<ErrorsState>((set) => ({
  groups: [],
  currentGroup: null,
  events: [],
  comments: [],
  eventsUsage: null,
  isLoading: false,
  loadingEvents: false,
  loadingComments: false,
  error: null,

  fetchGroups: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await GroupsAPI.getGroups(projectId);
      const groups = response.map(group => ({
        ...group,
        projectId,
        name: group.errorType || 'Unknown Error',
        level: (group.statusCode >= 500 ? 'error' : group.statusCode >= 400 ? 'warning' : 'info') as 'error' | 'warning' | 'info',
        createdAt: group.firstSeen,
        updatedAt: group.lastSeen,
        status: group.status as 'open' | 'resolved' | 'ignored'
      }));
      set({ groups, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch error groups', isLoading: false });
    }
  },

  fetchGroup: async (projectId: string, groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await GroupsAPI.getGroups(projectId);
      const group = response.find(g => g.id === groupId);
      
      if (!group) {
        throw new Error('Error group tidak ditemukan');
      }
      
      const updatedGroup = {
        ...group,
        projectId,
        name: group.errorType || 'Unknown Error',
        level: (group.statusCode >= 500 ? 'error' : group.statusCode >= 400 ? 'warning' : 'info') as 'error' | 'warning' | 'info',
        createdAt: group.firstSeen,
        updatedAt: group.lastSeen,
        status: group.status as 'open' | 'resolved' | 'ignored'
      };
      set({ currentGroup: updatedGroup, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch error group', isLoading: false });
    }
  },

  fetchEvents: async (groupId: string) => {
    try {
      set({ loadingEvents: true, error: null });
      const events = await GroupsAPI.getGroupEvents(groupId);
      set({ events });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal mengambil daftar event',
        events: []
      });
      throw error;
    } finally {
      set({ loadingEvents: false });
    }
  },

  fetchComments: async (groupId: string) => {
    try {
      set({ loadingComments: true, error: null });
      const comments = await GroupsAPI.getComments(groupId);
      set({ comments });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal mengambil komentar',
        comments: []
      });
      throw error;
    } finally {
      set({ loadingComments: false });
    }
  },

  fetchEventsUsage: async (projectId: string) => {
    try {
      set({ isLoading: true, error: null });
      const usage = await EventsAPI.getEventsUsage(projectId);
      set({ eventsUsage: usage });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal mengambil penggunaan events',
        eventsUsage: null
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  changeGroupStatus: async (groupId: string, status: 'open' | 'resolved' | 'ignored') => {
    try {
      set({ isLoading: true, error: null });
      const updatedGroup = await GroupsAPI.changeGroupStatus(groupId, status);
      set(state => ({
        ...state,
        groups: state.groups.map(group => 
          group.id === groupId ? { ...group, status: updatedGroup.status as 'open' | 'resolved' | 'ignored' } : group
        ),
        currentGroup: state.currentGroup?.id === groupId 
          ? { ...state.currentGroup, status: updatedGroup.status as 'open' | 'resolved' | 'ignored' }
          : state.currentGroup
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal mengubah status error'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  assignGroup: async (groupId: string, memberId: string | null) => {
    try {
      set({ isLoading: true, error: null });
      const updatedGroup = await GroupsAPI.assignGroup(groupId, memberId);
      set(state => ({
        ...state,
        groups: state.groups.map(group => 
          group.id === groupId ? { ...group, assignedTo: updatedGroup.assignedTo } : group
        ),
        currentGroup: state.currentGroup?.id === groupId 
          ? { ...state.currentGroup, assignedTo: updatedGroup.assignedTo }
          : state.currentGroup
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal menugaskan error'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addComment: async (groupId: string, content: string) => {
    try {
      set({ isLoading: true, error: null });
      const comment = await GroupsAPI.addComment(groupId, content);
      set(state => ({
        ...state,
        comments: [...state.comments, comment]
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal menambahkan komentar'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
})); 
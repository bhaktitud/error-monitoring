import { create } from 'zustand';
import { NotificationAPI } from '@/lib/api';

interface NotificationSettings {
  email: boolean;
  slack: boolean;
  slackWebhookUrl?: string;
  notifyOnNewError: boolean;
  notifyOnResolvedError: boolean;
  minimumErrorLevel: 'info' | 'warning' | 'error' | 'fatal';
}

interface NotificationsState {
  settings: NotificationSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: (projectId: string) => Promise<void>;
  updateSettings: (projectId: string, settings: Partial<NotificationSettings>) => Promise<void>;
  testNotification: (projectId: string, type: 'email' | 'slack') => Promise<void>;
  clearError: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async (projectId: string) => {
    try {
      set({ isLoading: true, error: null });
      const settings = await NotificationAPI.getNotificationSettings(projectId);
      set({ settings });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal mengambil pengaturan notifikasi',
        settings: null
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (projectId: string, newSettings: Partial<NotificationSettings>) => {
    try {
      set({ isLoading: true, error: null });
      await NotificationAPI.updateNotificationSettings(projectId, newSettings);
      set(state => ({
        ...state,
        settings: state.settings ? { ...state.settings, ...newSettings } : null
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal memperbarui pengaturan notifikasi'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  testNotification: async (projectId: string, type: 'email' | 'slack') => {
    try {
      set({ isLoading: true, error: null });
      await NotificationAPI.testNotification(projectId, type);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Gagal mengirim notifikasi test'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
})); 
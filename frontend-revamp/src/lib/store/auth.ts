import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { AuthAPI, UserProfile } from '@/lib/api';
import { logout as authLogout } from '@/lib/auth';
import { createClientCookiesClient } from 'next-client-cookies/server';

// Extend UserProfile dengan properti tambahan yang dibutuhkan
interface User extends Omit<UserProfile, 'plan'> {
  role: string;
  features: Record<string, boolean | number>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

// Type untuk state yang akan di-persist
type PersistedState = {
  token: string | null;
  isAuthenticated: boolean;
};

type AuthPersist = (
  config: StateCreator<AuthState>,
  options: PersistOptions<AuthState, PersistedState>
) => StateCreator<AuthState>;

export const useAuthStore = create<AuthState>()(
  (persist as AuthPersist)(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const { token } = await AuthAPI.login(email, password);
          set({ token, isAuthenticated: true });
          await get().fetchUser();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Terjadi kesalahan saat login',
            isAuthenticated: false 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          error: null 
        });

        // Hapus token dari localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
        }

        // Panggil endpoint logout di backend
        try {
          AuthAPI.logout().catch(err => console.error('Error during logout API call:', err));
        } catch (error) {
          console.error('Error during logout:', error);
        }
      },

      fetchUser: async () => {
        try {
          set({ isLoading: true, error: null });
          const userProfile = await AuthAPI.getCurrentUser();
          // Transform UserProfile ke User dengan menambahkan properti yang dibutuhkan
          const user: User = {
            ...userProfile,
            role: userProfile.plan?.name === 'pro' ? 'admin' : 'user',
            features: userProfile.plan?.features || {}
          };
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Gagal mengambil data user',
            isAuthenticated: false,
            user: null 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthState): PersistedState => ({ 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
); 
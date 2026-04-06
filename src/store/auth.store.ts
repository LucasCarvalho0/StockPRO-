import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { getTurnoAtual, Turno } from '@/lib/shifts';

interface AuthState {
  user: (Pick<User, 'id' | 'nome' | 'matricula' | 'email' | 'role'> & { shift: Turno }) | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: Pick<User, 'id' | 'nome' | 'matricula' | 'email' | 'role'>, token: string) => void;
  clearAuth: () => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setAuth: (userData, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('stockpro_token', token);
          document.cookie = `stockpro_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
        const shift = getTurnoAtual();
        set({ 
          user: { ...userData, shift }, 
          token, 
          isAuthenticated: true 
        });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('stockpro_token');
          localStorage.removeItem('stockpro-auth');
          document.cookie = 'stockpro_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { 
      name: 'stockpro-auth', 
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) 
    },
  ),
);

import { create } from 'zustand';
import { authService } from './authService';
import type { User, LoginCredentials } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initialize: () => void;
  refreshUserMenus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // No limpiar redirectAfterLogin aquí, lo manejará LoginPage
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('redirectAfterLogin');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  initialize: () => {
    const user = authService.getStoredUser();
    const token = authService.getAccessToken();
    
    if (user && token) {
      set({
        user,
        token,
        isAuthenticated: true,
      });
    }
  },

  refreshUserMenus: async () => {
    const token = authService.getAccessToken();
    const currentUser = authService.getStoredUser();
    
    if (!token || !currentUser) {
      return;
    }

    try {
      // Re-autenticar para obtener los menús actualizados
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Actualizar solo los menús del usuario
        const updatedUser = {
          ...currentUser,
          menus: userData.menus || currentUser.menus,
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        set({
          user: updatedUser,
        });
      }
    } catch (error) {
      console.error('Error al refrescar menús:', error);
    }
  },
}));

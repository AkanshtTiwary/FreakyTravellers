/**
 * Auth Store
 * Global state management for authentication using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => {
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('token', token);
          } else {
            localStorage.removeItem('token');
          }
        }
        set({ token, isAuthenticated: !!token });
      },

      login: (user, token) => {
        console.log('AuthStore login called with:', { user, token });
        set({ user, token, isAuthenticated: true });
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          console.log('Saved to localStorage:', { token, user });
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...userData };
        set({ user: updatedUser });
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const value = localStorage.getItem(name);
          console.log('Zustand getItem:', name, value ? 'found' : 'not found');
          return value;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          const preview = typeof value === 'string' ? value.substring(0, 100) : JSON.stringify(value).substring(0, 100);
          console.log('Zustand setItem:', name, preview);
          localStorage.setItem(name, typeof value === 'string' ? value : JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          console.log('Zustand removeItem:', name);
          localStorage.removeItem(name);
        },
      },
    }
  )
);

export default useAuthStore;

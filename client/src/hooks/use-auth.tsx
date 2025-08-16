import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  companyName?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          console.log('Login attempt');
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
          }

          const data = await response.json();
          console.log('Login successful:', data.user);
          set({ 
            user: data.user,
            isLoading: false 
          });
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include cookies for sessions
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
          }

          const data = await response.json();
          set({ 
            user: data.user,
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // Include cookies for sessions
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null });
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          console.log('Checking auth - iframe context:', window !== window.parent);
          console.log('Current origin:', window.location.origin);
          console.log('Cookies available:', document.cookie ? 'yes' : 'no');

          const response = await fetch('/api/auth/user', {
            credentials: 'include',
          });

          console.log('Auth response status:', response.status);
          console.log('Auth response headers:', Object.fromEntries(response.headers.entries()));

          if (response.ok) {
            const user = await response.json();
            console.log('Auth check successful:', user);
            set({ user, isLoading: false });
          } else {
            const errorText = await response.text();
            console.log('Auth check failed:', response.status, errorText);
            set({ user: null, isLoading: false });
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({ user: null, isLoading: false });
        }
      },
    }),
    {
      name: 'ablp-auth',
    }
  )
);

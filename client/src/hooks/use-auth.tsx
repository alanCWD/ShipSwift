import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  companyName?: string;
  profileImageUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    role?: string;
  }) => Promise<void>;
  loginWithApp: () => void;
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
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: data.user, isLoading: false });
          } else {
            const errorData = await response.json();
            set({ isLoading: false });
            throw new Error(errorData.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(userData),
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: data.user, isLoading: false });
          } else {
            const errorData = await response.json();
            set({ isLoading: false });
            throw new Error(errorData.message || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithApp: () => {
        // Redirect to App OIDC login
        window.location.href = '/api/login';
      },

      logout: async () => {
        try {
          // Use the new OIDC logout endpoint which handles both local and IdP logout
          window.location.href = '/api/logout';
        } catch (error) {
          console.error('Logout error:', error);
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

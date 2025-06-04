import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { queryClient } from './queryClient';
import { useLocation } from 'wouter';
import { apiRequest } from './queryClient';
import {
  saveUser,
  getUser,
  clearUser,
  saveToken,
  getToken,
  clearToken
} from '../offlineStorage';

import type { User } from '@shared/schema';

interface AuthUser extends Omit<User, 'password'> {
  // This extends the User type but makes password optional for the frontend
  password?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Try to verify token with backend
          try {
            const response = await apiRequest('GET', '/api/auth/me');
            if (response.ok) {
              const { user } = await response.json();
              await saveUser(user);
              await saveToken(token);
              const now = new Date();
              const userWithDefaults = {
                ...user,
                createdAt: user.createdAt ? new Date(user.createdAt) : now,
                updatedAt: user.updatedAt ? new Date(user.updatedAt) : now,
              };
              setUser(userWithDefaults);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            // If offline, try loading from IndexedDB
            if (!navigator.onLine) {
              const cachedUser = await getUser();
              const cachedToken = await getToken();
              if (cachedUser && cachedToken) {
                setUser(cachedUser);
                localStorage.setItem('token', cachedToken);
                setIsLoading(false);
                return;
              }
            }
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Try online login first
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const { user, token } = await response.json();

      if (!response.ok) {
        throw new Error(user?.message || 'Login failed');
      }

      localStorage.setItem('token', token);
      await saveToken(token);
      await saveUser(user);

      // Ensure all required fields are present
      const now = new Date();
      const userWithDefaults = {
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt) : now,
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : now,
      };
      setUser(userWithDefaults);
      setLocation('/');
    } catch (err) {
      // If offline, attempt offline login
      if (!navigator.onLine) {
        const cachedUser = await getUser();
        const cachedToken = await getToken();
        if (cachedUser && cachedToken) {
          setUser(cachedUser);
          localStorage.setItem('token', cachedToken);
          setLocation('/');
          return;
        } else {
          setError('No cached credentials available for offline login.');
          throw new Error('No cached credentials available for offline login.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during login');
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest('POST', '/api/auth/register', { username, password });
      const { user, token } = await response.json();

      if (!response.ok) {
        throw new Error(user?.message || 'Registration failed');
      }

      localStorage.setItem('token', token);
      await saveToken(token);
      await saveUser(user);

      // Ensure all required fields are present
      const now = new Date();
      const userWithDefaults = {
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt) : now,
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : now,
      };
      setUser(userWithDefaults);
      setLocation('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    clearToken();
    clearUser();
    setUser(null);
    queryClient.removeQueries({ queryKey: ["/api/recipes"] });
    setLocation('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

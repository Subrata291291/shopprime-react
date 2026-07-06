import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = 'shopprime_user';
const TOKEN_KEY = 'shopprime_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await api.login(username, password);
      if (result) {
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        localStorage.setItem(TOKEN_KEY, result.token);
        setUser(result.user);
        toast.success('Logged in successfully');
        return true;
      }
      toast.error('Login failed. Please check your credentials.');
      return false;
    } catch {
      toast.error('Login failed. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const result = await api.register(username, email, password);
      if (result) {
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        localStorage.setItem(TOKEN_KEY, result.token);
        setUser(result.user);
        toast.success('Account created successfully');
        return true;
      }
      toast.error('Registration failed. Please try again.');
      return false;
    } catch {
      toast.error('Registration failed. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

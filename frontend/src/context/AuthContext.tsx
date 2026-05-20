"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearAuth, setToken, AuthResponse } from '@/lib/api';

interface AuthUser {
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: Record<string, string>) => Promise<AuthResponse>;
  register: (userDetails: Record<string, string>) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Read from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setTokenState(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear corrupted storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: Record<string, string>) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      if (res.token) {
        setTokenState(res.token);
        setToken(res.token);
        
        const userData: AuthUser = {
          name: res.name,
          email: res.email,
          role: res.role,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect based on role
        if (res.role === 'ADMIN') router.push('/admin');
        else if (res.role === 'TEACHER') router.push('/teacher');
        else if (res.role === 'STUDENT') router.push('/student');
      }
      return res;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userDetails: Record<string, string>) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(userDetails);
      if (res.token) {
        setTokenState(res.token);
        setToken(res.token);

        const userData: AuthUser = {
          name: res.name,
          email: res.email,
          role: res.role,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect based on role
        if (res.role === 'ADMIN') router.push('/admin');
        else if (res.role === 'TEACHER') router.push('/teacher');
        else if (res.role === 'STUDENT') router.push('/student');
      }
      return res;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setTokenState(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

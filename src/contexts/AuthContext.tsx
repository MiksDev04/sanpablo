import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getUsers } from '../data/storage';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  refreshUser: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('sanpablo_user');
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = useCallback((email: string, _password: string): User | null => {
    const found = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && found.status === 'approved') {
      setUser(found);
      localStorage.setItem('sanpablo_user', JSON.stringify(found));
      return found;
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('sanpablo_user');
  }, []);

  const refreshUser = useCallback(() => {
    const stored = localStorage.getItem('sanpablo_user');
    if (stored) {
      try { setUser(JSON.parse(stored) as User); } catch { /* ignore */ }
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      refreshUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

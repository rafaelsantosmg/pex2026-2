import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type Role, type SessionUser } from './api';

const TOKEN_KEY = 'pex.token';

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function homeFor(role: Role) {
  if (role === 'STUDENT') return '/estudante';
  if (role === 'COMPANY') return '/empresa';
  return '/admin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api<SessionUser>('/api/auth/me')
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const result = await api<{ accessToken: string; user: SessionUser }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem(TOKEN_KEY, result.accessToken);
        setUser(result.user);
        return result.user;
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return context;
}

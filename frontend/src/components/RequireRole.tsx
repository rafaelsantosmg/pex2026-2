import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { homeFor, useAuth } from '../auth';
import type { Role } from '../api';

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="screen-status">Carregando sessão…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

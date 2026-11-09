import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role } from '../api';
import { useAuth } from '../auth';

const roleLabel: Record<Role, string> = {
  STUDENT: 'Área do estudante',
  COMPANY: 'Área da empresa',
  ADMIN: 'Área do administrador',
};

export function Shell({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.student?.name ?? user?.company?.name ?? 'Administração';

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span>Nexo</span>
          <small>Gestão de estágios</small>
        </div>
        <div className="who">
          <span>{name}</span>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sair
          </button>
        </div>
      </header>
      <main className="content">
        <p className="eyebrow">{user ? roleLabel[user.role] : ''}</p>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
        {children}
      </main>
    </div>
  );
}

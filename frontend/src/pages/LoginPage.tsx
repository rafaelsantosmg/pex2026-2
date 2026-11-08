import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api';
import { homeFor, useAuth } from '../auth';

const demos = [
  { label: 'Estudante', email: 'ana.lima@pex.local' },
  { label: 'Empresa', email: 'contato@oficinanorte.local' },
  { label: 'Administrador', email: 'admin@pex.local' },
];

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p className="screen-status">Carregando sessão…</p>;
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const session = await login(email, password);
      navigate(homeFor(session.role));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível entrar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <section className="login-aside">
        <p className="eyebrow">Protótipo acadêmico</p>
        <h1>PEX</h1>
        <p className="aside-copy">
          Plataforma integrada de gestão de estágios. Três acessos, um mesmo cadastro.
        </p>
        <ol>
          <li>
            <strong>Estudante </strong>
            consulta vagas e acompanha as próprias candidaturas.
          </li>
          <li>
            <strong>Empresa </strong>
            publica vagas e vê quem se candidatou.
          </li>
          <li>
            <strong>Administrador </strong>
            acompanha instituições, empresas e estudantes.
          </li>
        </ol>
      </section>
      <section className="login-panel">
        <form onSubmit={onSubmit}>
          <h2>Entrar</h2>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <div className="demos">
          <p>Contas fictícias, senha pex12345</p>
          <div>
            {demos.map((demo) => (
              <button
                key={demo.email}
                type="button"
                className="ghost"
                onClick={() => {
                  setEmail(demo.email);
                  setPassword('pex12345');
                  setError('');
                }}
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

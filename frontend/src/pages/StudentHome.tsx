import { useCallback, useEffect, useState } from 'react';
import { ApiError, api, type ApplicationItem, type ApplicationStatus, type Vacancy } from '../api';
import { useAuth } from '../auth';
import { Shell } from '../components/Shell';
import { StatusPill } from '../components/StatusPill';
import { Timeline } from '../components/Timeline';

const cancellable: ApplicationStatus[] = ['ENVIADA', 'EM_ANALISE', 'ENTREVISTA'];

export function StudentHome() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const [openVacancies, ownApplications] = await Promise.all([
      api<Vacancy[]>('/api/vacancies'),
      api<ApplicationItem[]>('/api/applications'),
    ]);
    setVacancies(openVacancies);
    setApplications(ownApplications);
  }, []);

  useEffect(() => {
    load().catch(() => setError('Não foi possível carregar vagas e candidaturas.'));
  }, [load]);

  async function apply(vacancyId: string) {
    setBusy(vacancyId);
    setError('');
    try {
      await api('/api/applications', { method: 'POST', body: JSON.stringify({ vacancyId }) });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível candidatar-se.');
    } finally {
      setBusy('');
    }
  }

  async function cancel(applicationId: string) {
    setBusy(applicationId);
    setError('');
    try {
      await api(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELADA', note: 'Candidatura cancelada pelo estudante' }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível cancelar a candidatura.');
    } finally {
      setBusy('');
    }
  }

  const student = user?.student;

  return (
    <Shell
      title={student?.name ?? 'Estudante'}
      lede="Vagas abertas e o andamento das candidaturas enviadas por você."
    >
      {student ? (
        <section className="card profile">
          <p>
            {student.course}, {student.semester}º semestre
          </p>
          <p>
            {student.institution.name} · {student.institution.city}
          </p>
        </section>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <section>
        <h2>Vagas abertas</h2>
        {vacancies.length === 0 ? <p className="empty">Nenhuma vaga aberta no momento.</p> : null}
        <ul className="stack">
          {vacancies.map((vacancy) => {
            const existing = applications.find((application) => application.vacancy.id === vacancy.id);
            return (
              <li key={vacancy.id} className="card">
                <div className="card-head">
                  <h3>{vacancy.title}</h3>
                  <StatusPill status={vacancy.status} />
                </div>
                <p>{vacancy.description}</p>
                <p className="meta">
                  {vacancy.company.name} · {vacancy.openings} {vacancy.openings === 1 ? 'vaga' : 'vagas'}
                </p>
                <div className="actions">
                  {existing ? (
                    <p className="meta">
                      {existing.status === 'CANCELADA' ? 'Candidatura cancelada' : 'Candidatura enviada'}
                    </p>
                  ) : (
                    <button type="button" disabled={busy === vacancy.id} onClick={() => apply(vacancy.id)}>
                      {busy === vacancy.id ? 'Enviando…' : 'Candidatar-se'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h2>Minhas candidaturas</h2>
        {applications.length === 0 ? <p className="empty">Você ainda não se candidatou.</p> : null}
        <ul className="stack">
          {applications.map((application) => (
            <li key={application.id} className="card">
              <div className="card-head">
                <h3>{application.vacancy.title}</h3>
                <StatusPill status={application.status} />
              </div>
              <p className="meta">{application.vacancy.company.name}</p>
              <Timeline events={application.events} />
              {cancellable.includes(application.status) ? (
                <div className="actions">
                  <button
                    type="button"
                    className="ghost"
                    disabled={busy === application.id}
                    onClick={() => cancel(application.id)}
                  >
                    {busy === application.id ? 'Cancelando…' : 'Cancelar candidatura'}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

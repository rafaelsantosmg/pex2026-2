import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, api, type ApplicationItem, type ApplicationStatus, type Vacancy } from '../api';
import { useAuth } from '../auth';
import { Shell } from '../components/Shell';
import { StatusPill } from '../components/StatusPill';
import { Timeline } from '../components/Timeline';

const nextStages: { value: ApplicationStatus; label: string }[] = [
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'ENTREVISTA', label: 'Entrevista' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'REPROVADA', label: 'Reprovada' },
];

const openStatuses: ApplicationStatus[] = ['ENVIADA', 'EM_ANALISE', 'ENTREVISTA'];

export function CompanyHome() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [openings, setOpenings] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const [ownVacancies, received] = await Promise.all([
      api<Vacancy[]>('/api/vacancies'),
      api<ApplicationItem[]>('/api/applications'),
    ]);
    setVacancies(ownVacancies);
    setApplications(received);
  }, []);

  useEffect(() => {
    load().catch(() => setError('Não foi possível carregar as vagas da empresa.'));
  }, [load]);

  async function publish(event: FormEvent) {
    event.preventDefault();
    setPublishing(true);
    setError('');
    try {
      await api('/api/vacancies', {
        method: 'POST',
        body: JSON.stringify({ title, description, openings }),
      });
      setTitle('');
      setDescription('');
      setOpenings(1);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível publicar a vaga.');
    } finally {
      setPublishing(false);
    }
  }

  async function setVacancyStatus(vacancy: Vacancy) {
    setBusy(vacancy.id);
    setError('');
    try {
      await api(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: vacancy.status === 'ABERTA' ? 'ENCERRADA' : 'ABERTA' }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível atualizar a vaga.');
    } finally {
      setBusy('');
    }
  }

  const company = user?.company;

  return (
    <Shell title={company?.name ?? 'Empresa'} lede="Publique vagas e atualize o andamento de cada candidatura.">
      {company ? (
        <section className="card profile">
          <p>{company.segment}</p>
        </section>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <form className="card form-grid" onSubmit={publish}>
        <h2>Publicar vaga</h2>
        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={120} />
        </label>
        <label>
          Descrição
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            minLength={10}
            maxLength={2000}
          />
        </label>
        <label>
          Número de vagas
          <input
            type="number"
            min={1}
            max={99}
            value={openings}
            onChange={(event) => setOpenings(Number(event.target.value))}
            required
          />
        </label>
        <button type="submit" disabled={publishing}>
          {publishing ? 'Publicando…' : 'Publicar vaga'}
        </button>
      </form>
      <section>
        <h2>Vagas publicadas</h2>
        {vacancies.length === 0 ? <p className="empty">Nenhuma vaga publicada.</p> : null}
        <ul className="stack">
          {vacancies.map((vacancy) => (
            <li key={vacancy.id} className="card">
              <div className="card-head">
                <h3>{vacancy.title}</h3>
                <StatusPill status={vacancy.status} />
              </div>
              <p>{vacancy.description}</p>
              <p className="meta">
                {vacancy.openings} {vacancy.openings === 1 ? 'vaga' : 'vagas'}
              </p>
              <div className="actions">
                <button type="button" className="ghost" disabled={busy === vacancy.id} onClick={() => setVacancyStatus(vacancy)}>
                  {busy === vacancy.id ? 'Salvando…' : vacancy.status === 'ABERTA' ? 'Encerrar vaga' : 'Reabrir vaga'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Candidaturas recebidas</h2>
        {applications.length === 0 ? <p className="empty">Nenhuma candidatura recebida.</p> : null}
        <ul className="stack">
          {applications.map((application) => (
            <ApplicationCard
              key={`${application.id}-${application.status}`}
              application={application}
              busy={busy === application.id}
              onUpdate={async (status, note) => {
                setBusy(application.id);
                setError('');
                try {
                  await api(`/api/applications/${application.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status, note }),
                  });
                  await load();
                } catch (caught) {
                  setError(caught instanceof ApiError ? caught.message : 'Não foi possível atualizar o andamento.');
                } finally {
                  setBusy('');
                }
              }}
            />
          ))}
        </ul>
      </section>
    </Shell>
  );
}

function ApplicationCard({
  application,
  busy,
  onUpdate,
}: {
  application: ApplicationItem;
  busy: boolean;
  onUpdate: (status: ApplicationStatus, note: string) => Promise<void>;
}) {
  const choices = nextStages.filter((stage) => stage.value !== application.status);
  const [status, setStatus] = useState<ApplicationStatus>(choices[0]?.value ?? 'EM_ANALISE');
  const [note, setNote] = useState('');
  const canUpdate = openStatuses.includes(application.status) && choices.length > 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onUpdate(status, note);
    setNote('');
  }

  return (
    <li className="card">
      <div className="card-head">
        <h3>{application.student.name}</h3>
        <StatusPill status={application.status} />
      </div>
      <p className="meta">
        {application.vacancy.title} · {application.student.course}, {application.student.semester}º semestre
      </p>
      <Timeline events={application.events} />
      {canUpdate ? (
        <form className="status-form" onSubmit={submit}>
          <label>
            Novo estágio
            <select value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)}>
              {choices.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Observação
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder="Opcional"
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Salvando…' : 'Atualizar andamento'}
          </button>
        </form>
      ) : null}
    </li>
  );
}

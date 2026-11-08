import { useEffect, useState } from 'react';
import { api, type ApplicationItem, type Company, type Institution, type Student } from '../api';
import { Shell } from '../components/Shell';
import { StatusPill } from '../components/StatusPill';
import { Timeline } from '../components/Timeline';

export function AdminHome() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Institution[]>('/api/institutions'),
      api<Company[]>('/api/companies'),
      api<Student[]>('/api/students'),
      api<ApplicationItem[]>('/api/applications'),
    ])
      .then(([institutionRows, companyRows, studentRows, applicationRows]) => {
        setInstitutions(institutionRows);
        setCompanies(companyRows);
        setStudents(studentRows);
        setApplications(applicationRows);
      })
      .catch(() => setError('Não foi possível carregar o painel administrativo.'));
  }, []);

  return (
    <Shell title="Visão geral" lede="Cadastros da plataforma e candidaturas em andamento. Dados fictícios.">
      {error ? <p className="form-error">{error}</p> : null}
      <div className="stats">
        <article>
          <strong>{institutions.length}</strong>
          <span>Instituições</span>
        </article>
        <article>
          <strong>{companies.length}</strong>
          <span>Empresas</span>
        </article>
        <article>
          <strong>{students.length}</strong>
          <span>Estudantes</span>
        </article>
        <article>
          <strong>{applications.length}</strong>
          <span>Candidaturas</span>
        </article>
      </div>
      <div className="columns">
        <section>
          <h2>Instituições</h2>
          <ul className="stack">
            {institutions.map((institution) => (
              <li key={institution.id} className="card">
                <h3>{institution.name}</h3>
                <p className="meta">
                  {institution.city} · {institution._count.students}{' '}
                  {institution._count.students === 1 ? 'estudante' : 'estudantes'}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Empresas</h2>
          <ul className="stack">
            {companies.map((company) => (
              <li key={company.id} className="card">
                <h3>{company.name}</h3>
                <p className="meta">
                  {company.segment} · {company._count.vacancies}{' '}
                  {company._count.vacancies === 1 ? 'vaga' : 'vagas'}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Estudantes</h2>
          <ul className="stack">
            {students.map((student) => (
              <li key={student.id} className="card">
                <h3>{student.name}</h3>
                <p className="meta">
                  {student.course}, {student.semester}º semestre
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section>
        <h2>Candidaturas</h2>
        <ul className="stack">
          {applications.map((application) => (
            <li key={application.id} className="card">
              <div className="card-head">
                <h3>
                  {application.student.name} · {application.vacancy.title}
                </h3>
                <StatusPill status={application.status} />
              </div>
              <p className="meta">{application.vacancy.company.name}</p>
              <Timeline events={application.events} />
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

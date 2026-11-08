export type Role = 'STUDENT' | 'COMPANY' | 'ADMIN';

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  student: {
    id: string;
    name: string;
    course: string;
    semester: number;
    institution: { id: string; name: string; city: string };
  } | null;
  company: { id: string; name: string; segment: string } | null;
};

export type Vacancy = {
  id: string;
  title: string;
  description: string;
  status: 'ABERTA' | 'ENCERRADA';
  openings: number;
  company: { id: string; name: string; segment: string };
};

export type ApplicationStatus =
  | 'ENVIADA'
  | 'EM_ANALISE'
  | 'ENTREVISTA'
  | 'APROVADA'
  | 'REPROVADA'
  | 'CANCELADA';

export type ApplicationItem = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  student: { id: string; name: string; course: string; semester: number };
  vacancy: { id: string; title: string; company: { id: string; name: string } };
  events: { id: string; status: ApplicationStatus; note: string | null; createdAt: string }[];
};

export type Institution = {
  id: string;
  name: string;
  city: string;
  _count: { students: number };
};

export type Company = {
  id: string;
  name: string;
  segment: string;
  user: { email: string };
  _count: { vacancies: number };
};

export type Student = {
  id: string;
  name: string;
  course: string;
  semester: number;
  user: { email: string };
  institution: { id: string; name: string; city: string };
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pex.token');
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    let message = 'Não foi possível concluir a operação';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(' ');
    } catch {
      /* resposta sem JSON */
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

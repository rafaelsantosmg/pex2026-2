# Nexo — tecnologias, banco de dados e API

Documento do protótipo acadêmico **PEX — Plataforma Integrada de Gestão de Estágios** (2026/2). Na interface o produto aparece com o nome fictício **Nexo**. O repositório, os pacotes e os e-mails de demonstração continuam com o identificador `pex`.

O sistema é um monólito modular: uma interface web, uma API e um banco relacional. Há três perfis — estudante, empresa e administrador. Os dados são fictícios. A integração com WhatsApp fica fora deste escopo.

## Arquitetura

```text
Navegador (React)
        |
        |  /api/...
        v
API NestJS (prefixo /api, porta 3000)
        |
        |  Prisma
        v
PostgreSQL
```

Em desenvolvimento, o Vite (porta 5173) encaminha `/api` para `http://localhost:3000`. Em produção, a Vercel faz o mesmo encaminhamento para a API no Render. O detalhe de cada plataforma está na seção Publicação. O navegador fala sempre com a origem da interface, então a chamada não depende de CORS entre domínios.

A API segue camadas por módulo: **controller** recebe a requisição, **service** aplica a regra de negócio, **Prisma** lê e grava o banco. Cada área de domínio tem a própria pasta em `backend/src`: `auth`, `institutions`, `companies`, `students`, `vacancies` e `applications`.

## Tecnologias

| Camada | Tecnologia | Papel no projeto |
|---|---|---|
| Interface | React 19 + TypeScript | Telas de login, estudante, empresa e administrador |
| Rotas da interface | React Router 7 | `/login`, `/estudante`, `/empresa`, `/admin` |
| Empacotamento | Vite 7 | Servidor de desenvolvimento e build estático |
| API | NestJS 11 (Express) | HTTP, módulos, guards e validação |
| Linguagem da API | TypeScript 5.9 | Tipos compartilhados entre serviço e Prisma |
| Acesso a dados | Prisma 6 | Schema, migração e consultas |
| Banco | PostgreSQL 16 | Dados relacionais |
| Banco local | Docker Compose (`postgres:16-alpine`) | Sobe o Postgres em `localhost:5432` (usuário, senha e banco `pex`) |
| Autenticação | JWT (8 horas) + Passport | Sessão sem guardar senha no cliente |
| Senha | bcrypt | Hash no cadastro e na comparação do login |
| Validação | class-validator | Corpo da requisição conferido antes do serviço |
| Configuração | `@nestjs/config` | `DATABASE_URL`, `JWT_SECRET` e `PORT` |

O Postgres local sobe com `docker compose up -d`. A API escuta a porta definida em `PORT` ou, na falta dela, a 3000. O prefixo global de todas as rotas é `/api`.

## Publicação

O código fica no GitHub, no repositório público [rafaelsantosmg/pex2026-2](https://github.com/rafaelsantosmg/pex2026-2). Cada plataforma publica uma parte do sistema. Nenhuma delas guarda segredo no repositório: `DATABASE_URL` e `JWT_SECRET` existem só no painel do Render.

| Parte | Plataforma | Endereço |
|---|---|---|
| Interface | Vercel | https://pex2026-2.vercel.app |
| API | Render (Web Service) | https://pex2026-2.onrender.com |
| Banco | Neon (PostgreSQL) | conexão usada só pela API |
| Código | GitHub | https://github.com/rafaelsantosmg/pex2026-2 |

**Vercel.** Publica a pasta `frontend`. O preset é Vite: o build gera a pasta `dist` e a Vercel serve esses arquivos. O arquivo `frontend/vercel.json` reescreve `/api/:path*` para `https://pex2026-2.onrender.com/api/:path*`. Assim, a tela em `pex2026-2.vercel.app` chama `/api/auth/login` no próprio domínio, e a Vercel entrega a requisição ao Render.

**Render.** Publica a pasta `backend`, na região Oregon. O build instala as dependências, gera o cliente do Prisma, compila o Nest e aplica as migrações:

```bash
npm install && npx prisma generate && npm run build && npx prisma migrate deploy
```

O processo de produção é `node dist/main.js`. O painel guarda `DATABASE_URL` (string direta do Neon, sem o host `-pooler`, com `schema=public`) e um `JWT_SECRET` próprio desse ambiente. O seed não roda a cada publicação: ele apaga e recria os dados, então só é executado de propósito.

**Neon.** Hospeda o PostgreSQL que a API de produção usa. O banco local do Docker Compose continua separado e serve só para desenvolvimento. A região do Neon neste projeto é `us-east-2`.

No plano gratuito o Render adormece a API depois de um tempo sem acesso. A primeira chamada depois disso pode demorar até o serviço acordar. A rota `GET /api/health` confirma que a API e o banco responderam.

## Estrutura do banco

O modelo está em `backend/prisma/schema.prisma`. A migração inicial está em `backend/prisma/migrations/20261108170000_init`. O Prisma cria uma tabela por modelo, com o mesmo nome do modelo (`User`, `Institution`, `Student`, `Company`, `Vacancy`, `Application`, `ApplicationEvent`).

Identificadores são UUID. Toda entidade principal guarda `createdAt` e `updatedAt`. O histórico da candidatura guarda só `createdAt`.

### Relacionamentos

```text
Institution 1 ── N Student
User        1 ── 0..1 Student
User        1 ── 0..1 Company
Company     1 ── N Vacancy
Student     1 ── N Application
Vacancy     1 ── N Application
Application 1 ── N ApplicationEvent
```

Um usuário é estudante ou empresa, nunca os dois: `Student.userId` e `Company.userId` são únicos. O administrador existe só em `User`, com papel `ADMIN`, sem ficha de estudante nem de empresa.

Um estudante só pode se candidatar uma vez à mesma vaga. Isso está garantido pela restrição única `(studentId, vacancyId)` em `Application`.

### Enumerações

**Role** — papel do usuário.

| Valor | Quem é |
|---|---|
| `STUDENT` | Estudante |
| `COMPANY` | Empresa |
| `ADMIN` | Administrador |

**VacancyStatus** — situação da vaga. O padrão na criação é `ABERTA`.

| Valor | Significado |
|---|---|
| `ABERTA` | Aceita candidatura |
| `ENCERRADA` | Recusa candidatura nova |

**ApplicationStatus** — estágio da candidatura. O padrão na criação é `ENVIADA`.

| Valor | Quem define |
|---|---|
| `ENVIADA` | Sistema, no momento da candidatura |
| `EM_ANALISE` | Empresa |
| `ENTREVISTA` | Empresa |
| `APROVADA` | Empresa |
| `REPROVADA` | Empresa |
| `CANCELADA` | Estudante, enquanto a candidatura ainda está aberta |

### Tabelas

**User** — conta de acesso.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | UUID | Chave primária |
| `email` | texto | Único |
| `passwordHash` | texto | Nunca sai nas respostas da API |
| `role` | Role | `STUDENT`, `COMPANY` ou `ADMIN` |

**Institution** — instituição de ensino.

| Coluna | Tipo |
|---|---|
| `id` | UUID |
| `name` | texto |
| `city` | texto |

**Student** — ficha do estudante, ligada a um usuário e a uma instituição.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `name` | texto | |
| `course` | texto | |
| `semester` | inteiro | |
| `userId` | UUID | Único, referência a `User` |
| `institutionId` | UUID | Referência a `Institution` |

**Company** — ficha da empresa, ligada a um usuário.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `name` | texto | |
| `segment` | texto | Ramo de atuação |
| `userId` | UUID | Único, referência a `User` |

**Vacancy** — vaga publicada por uma empresa.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `title` | texto | 3 a 120 caracteres na API |
| `description` | texto | 10 a 2000 caracteres na API |
| `status` | VacancyStatus | Padrão `ABERTA` |
| `openings` | inteiro | 1 a 99 na API |
| `companyId` | UUID | Referência a `Company` |

**Application** — candidatura de um estudante a uma vaga.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `status` | ApplicationStatus | Padrão `ENVIADA` |
| `studentId` | UUID | Referência a `Student` |
| `vacancyId` | UUID | Referência a `Vacancy` |

**ApplicationEvent** — cada mudança de estágio. A candidatura nasce já com um evento `ENVIADA` e a observação "Candidatura registrada".

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `status` | ApplicationStatus | Estágio registrado naquele momento |
| `note` | texto | Opcional, até 500 caracteres na API |
| `applicationId` | UUID | Referência a `Application` |

### Dados de demonstração

O seed (`backend/prisma/seed.ts`) apaga e recria os registros. A senha de todas as contas é `pex12345`.

| E-mail | Papel |
|---|---|
| `admin@pex.local` | Administrador |
| `ana.lima@pex.local` | Estudante, ADS, 4º semestre |
| `bruno.costa@pex.local` | Estudante, ADS, 2º semestre |
| `contato@oficinanorte.local` | Empresa Oficina Norte, Tecnologia |

A instituição é o Centro Universitário Carlos Drummond de Andrade, em São Paulo. A empresa começa com as vagas "Desenvolvedor júnior" (2 vagas) e "Suporte de TI" (1 vaga). Ana já está candidata a "Desenvolvedor júnior", no estágio `ENVIADA`.

## API

Base local: `http://localhost:3000/api`.

Toda rota, exceto `GET /api/health` e `POST /api/auth/login`, exige o cabeçalho:

```http
Authorization: Bearer <accessToken>
```

O token é um JWT com `sub` (id do usuário), `email` e `role`, válido por 8 horas. O cliente guarda o token em `localStorage` na chave `pex.token`.

Um perfil sem permissão para a rota recebe **403** com a mensagem "Acesso não autorizado para este perfil". Token ausente, inválido ou expirado recebe **401** ("Sessão inválida ou expirada"). Corpo inválido recebe **400** com as mensagens do validador.

### Saúde

| Método | Rota | Auth | Resposta |
|---|---|---|---|
| `GET` | `/api/health` | não | `{ "status": "ok" }` se o banco responder a `SELECT 1` |

### Autenticação

**POST `/api/auth/login`**

```json
{ "email": "ana.lima@pex.local", "password": "pex12345" }
```

Resposta **200**:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "<uuid>",
    "email": "ana.lima@pex.local",
    "role": "STUDENT",
    "student": {
      "id": "<uuid>",
      "name": "Ana Lima",
      "course": "Análise e Desenvolvimento de Sistemas",
      "semester": 4,
      "institution": { "id": "<uuid>", "name": "...", "city": "São Paulo" }
    },
    "company": null
  }
}
```

E-mail ou senha incorretos: **401** "E-mail ou senha inválidos". O hash da senha não entra na resposta.

**GET `/api/auth/me`** — devolve o mesmo objeto `user` do login, a partir do token.

### Consultas do administrador

As três rotas abaixo aceitam só o papel `ADMIN`.

| Método | Rota | Conteúdo |
|---|---|---|
| `GET` | `/api/institutions` | Instituições, com a contagem de estudantes |
| `GET` | `/api/companies` | Empresas, e-mail da conta e contagem de vagas |
| `GET` | `/api/students` | Estudantes, e-mail, curso, semestre e instituição |

### Vagas

Todas exigem sessão. A lista muda conforme o papel:

- **Empresa** vê só as próprias vagas, abertas e encerradas.
- **Estudante** vê só vagas `ABERTA`.
- **Administrador** vê todas.

Cada item traz `id`, `title`, `description`, `status`, `openings` e a empresa (`id`, `name`, `segment`).

| Método | Rota | Papel | Corpo |
|---|---|---|---|
| `GET` | `/api/vacancies` | qualquer sessão | — |
| `POST` | `/api/vacancies` | `COMPANY` | `title`, `description`, `openings` |
| `PATCH` | `/api/vacancies/:id` | `COMPANY` | `{ "status": "ABERTA" \| "ENCERRADA" }` |

A empresa só altera vaga dela. Vaga de outra empresa responde **404** "Vaga não encontrada". A vaga nasce `ABERTA`.

### Candidaturas

A lista também depende do papel:

- **Estudante** vê só as próprias.
- **Empresa** vê as candidaturas das próprias vagas.
- **Administrador** vê todas.

Cada item traz o estágio atual, o estudante (`id`, `name`, `course`, `semester`), a vaga (`id`, `title` e nome da empresa) e a lista `events` em ordem cronológica (`id`, `status`, `note`, `createdAt`).

| Método | Rota | Papel | Corpo |
|---|---|---|---|
| `GET` | `/api/applications` | qualquer sessão | — |
| `POST` | `/api/applications` | `STUDENT` | `{ "vacancyId": "<uuid>" }` |
| `PATCH` | `/api/applications/:id` | `STUDENT` ou `COMPANY` | `{ "status": "...", "note": "opcional" }` |

Regras da criação:

- A vaga precisa existir e estar `ABERTA`. Vaga encerrada: **400**. Vaga inexistente: **404**.
- Segunda candidatura do mesmo estudante à mesma vaga: **409** "Você já se candidatou a esta vaga".
- O registro nasce em `ENVIADA`, com o primeiro evento no histórico.

Regras da atualização:

- O estudante só pode enviar `CANCELADA`, e só enquanto o estágio atual for `ENVIADA`, `EM_ANALISE` ou `ENTREVISTA`.
- A empresa pode enviar `EM_ANALISE`, `ENTREVISTA`, `APROVADA` ou `REPROVADA`, e só enquanto a candidatura ainda estiver em um desses três estágios abertos. A empresa não define `CANCELADA`.
- O administrador não altera estágio.
- Candidatura de outro usuário responde **404**, para não revelar que o registro existe.
- Repetir o estágio atual responde **400**.
- Cada alteração grava um `ApplicationEvent` com o novo estágio e a observação, quando houver.

## O que a API ainda não faz

O administrador consulta instituições, empresas, estudantes e candidaturas. O cadastro desses registros hoje vem do seed. A API não expõe criação, edição nem exclusão de instituição, empresa ou estudante.

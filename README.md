# PEX — Plataforma integrada de gestão de estágios

Protótipo local com três perfis (estudante, empresa e administrador), API em camadas e PostgreSQL. A integração com WhatsApp fica fora deste escopo.

## Subir o ambiente

```bash
docker compose up -d
npm install --prefix backend
npm install --prefix frontend
npm run db:setup
```

Em dois terminais:

```bash
npm run dev:api
npm run dev:web
```

A interface fica em http://localhost:5173 e a API em http://localhost:3000/api.

## Contas fictícias

A senha de todas é `pex12345`.

| Perfil | E-mail |
|---|---|
| Estudante | ana.lima@pex.local |
| Estudante | bruno.costa@pex.local |
| Empresa | contato@oficinanorte.local |
| Administrador | admin@pex.local |

`npm run db:setup` recria os dados fictícios a partir do seed. O segredo JWT em `backend/.env` vale só para desenvolvimento local.

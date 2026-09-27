# Inscrições

Cadastro de inscrições com Postgres (Netlify Database) e login de admin.

## Rotas

- `/` — formulário público de inscrição
- `/admin` — login do administrador
- `/inscritos` — lista de inscritos (requer login)
- `/logout` — encerra a sessão de admin

## Desenvolvimento local

```bash
npm install
netlify dev --port 8889
```

## Variáveis de ambiente

- `ADMIN_PASSWORD` — senha do painel de administração
- `SESSION_SECRET` — chave usada para assinar o cookie de sessão do admin

Ambas são configuradas como variáveis de ambiente do site no Netlify (não ficam no repositório).

## Banco de dados

O esquema fica em `db/schema.ts` (Drizzle ORM). Ao alterar o esquema, gere uma nova migração com:

```bash
npm run db:generate
```

As migrações em `netlify/database/migrations/` são aplicadas automaticamente pelo Netlify a cada deploy.

# Database — Drizzle ORM + PostgreSQL

## Stack

- **Drizzle ORM** (`drizzle-orm/node-postgres`)
- **PostgreSQL** via `pg`
- **Casing**: `snake_case` automatico (configurado no `drizzle()`)

## Arquitetura

```
src/db/
  index.ts    — instancia do Drizzle (singleton)
  schema.ts   — tabelas, enums, indexes
  queries.ts  — funcoes de query reutilizaveis
  seed.ts     — script de seed com dados falsos (faker + nanoid)
```

## Schema

### Tabelas

| Tabela        | Campos principais                                              |
|---------------|----------------------------------------------------------------|
| `roasts`      | id (text PK), code, language, lineCount, score, verdict, quote, roastMode, createdAt |
| `roastIssues` | id (serial PK), roastId (FK), severity (enum), title, description, order |
| `roastDiffs`  | id (serial PK), roastId (FK), type (enum), code, order        |

### Enums

- `severityEnum`: `"critical"`, `"warning"`, `"good"`
- `diffTypeEnum`: `"added"`, `"removed"`, `"context"`

### Convencoes

1. **IDs de roast**: `text` (nanoid de 12 chars no seed, UUID em producao)
2. **IDs de issues/diffs**: `serial` (auto-increment)
3. **Foreign keys**: cascade on delete
4. **Ordering**: campo `order` (integer) para manter sequencia de issues e diffs
5. **Casing**: use camelCase no TypeScript — Drizzle converte para snake_case automaticamente

## Queries

Funcoes exportadas de `queries.ts`. Cada uma e uma funcao async que retorna dados tipados:

```tsx
// Uso em server components
import { getRoastById } from "@/db/queries";

const roast = await getRoastById(id);
if (!roast) notFound();
```

### Funcoes existentes

| Funcao                 | Retorno                          | Uso                    |
|------------------------|----------------------------------|------------------------|
| `getRoastById(id)`     | roast + issues + diffs ou null   | Pagina de resultado    |
| `getLeaderboard(limit)`| lista de roasts (code, score...) | Pagina de leaderboard  |
| `getLeaderboardPreview()` | top 3 roasts                  | Preview na home        |
| `getStats()`           | { total, avgScore }              | Contador na home       |
| `getRoastForOg(id)`    | score, verdict, quote...         | OG Image generation    |

## Seed

Executar com `npx tsx src/db/seed.ts`. Gera 100 roasts com:

- 10 linguagens diferentes
- Snippets de codigo realistas (codigo ruim de proposito)
- 3-4 issues por roast (mix de severities)
- Diffs com templates por linguagem
- Scores com distribuicao tendendo para notas baixas

## Regras

1. **Nunca importe `db` diretamente em client components** — use tRPC
2. **Queries novas** vao em `queries.ts` como funcoes exportadas
3. **Migrations**: use `drizzle-kit` para gerar e aplicar
4. **DATABASE_URL**: obrigatorio no `.env`

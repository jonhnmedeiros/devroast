# Drizzle ORM — Especificação de Implementação

## Contexto

O DevRoast é um app de code roasting onde o usuário cola código, recebe uma análise brutal com score, sugestões e ranking público. Atualmente todos os dados são estáticos (hardcoded nas pages). Esta spec define a camada de persistência com Drizzle ORM + PostgreSQL via Docker Compose.

---

## Stack da camada de dados

| Tecnologia | Uso |
|---|---|
| **PostgreSQL 17** | Banco de dados principal |
| **Docker Compose** | Subir o Postgres localmente |
| **Drizzle ORM** | Schema, queries, migrações |
| **drizzle-kit** | CLI de migrações |
| **@neondatabase/serverless** ou **postgres** (pg driver) | Driver de conexão |

---

## Docker Compose

Criar `docker-compose.yml` na raiz do projeto:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
      POSTGRES_DB: devroast
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Criar `.env` na raiz (já está no `.gitignore`):

```env
DATABASE_URL=postgresql://devroast:devroast@localhost:5432/devroast
```

---

## Estrutura de arquivos

```
src/
  db/
    index.ts          — Conexão e instância do Drizzle
    schema.ts         — Todas as tabelas e enums
drizzle.config.ts     — Configuração do drizzle-kit
docker-compose.yml    — PostgreSQL
```

---

## Enums

Derivados diretamente do design (Pencil) e dos componentes existentes.

### `severity`

Usado nas issues de análise. Corresponde 1:1 com o `variant` do componente `Badge` e `AnalysisCard`.

| Valor | Cor no design | Uso |
|---|---|---|
| `critical` | `$accent-red` | Problemas graves |
| `warning` | `$accent-amber` | Pontos de atenção |
| `good` | `$accent-green` | Práticas positivas |

```ts
export const severityEnum = pgEnum("severity", ["critical", "warning", "good"]);
```

### `diff_type`

Tipo de cada linha do diff de sugestões. Corresponde 1:1 com o `variant` do componente `DiffLine`.

| Valor | Cor no design | Uso |
|---|---|---|
| `added` | `#10B98115` (green bg) | Linha adicionada |
| `removed` | `#EF444415` (red bg) | Linha removida |
| `context` | transparente | Linha de contexto |

```ts
export const diffTypeEnum = pgEnum("diff_type", ["added", "removed", "context"]);
```

---

## Tabelas

### `roasts`

Tabela principal. Cada registro representa um submission + resultado de análise completo. Corresponde à tela **Screen 2 - Roast Results** do design e alimenta a **Screen 3 - Shame Leaderboard**.

| Coluna | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `id` | `text` (nanoid/cuid2) | NOT NULL | `gerar no app` | PK — usado na URL `/roast/[id]` |
| `code` | `text` | NOT NULL | — | Código original submetido |
| `language` | `text` | NOT NULL | — | Linguagem detectada (ex: `"javascript"`, `"typescript"`, `"sql"`) |
| `line_count` | `integer` | NOT NULL | — | Número de linhas do código |
| `score` | `real` | NOT NULL | — | Score geral de 0.0 a 10.0 (exibido no `ScoreRing`) |
| `verdict` | `text` | NOT NULL | — | Slug do veredicto (ex: `"needs_serious_help"`) — exibido no `Badge` do hero |
| `quote` | `text` | NOT NULL | — | Frase sarcástica de roast — o texto principal do resultado |
| `roast_mode` | `boolean` | NOT NULL | `true` | Se o roast mode estava ativo (sarcasmo máximo) |
| `created_at` | `timestamp` | NOT NULL | `now()` | Data de criação |

**Mapeamento no design:**

- `score` → Score Ring (`scoreNum`: "3.5", `scoreLabel`: "/10")
- `verdict` → Badge do hero (`roastBadge`: "verdict: needs_serious_help")
- `quote` → Texto principal (`roastTitle`: "this code looks like...")
- `language` + `line_count` → Metadata (`roastMeta`: "lang: javascript · 7 lines")
- `code` → Submitted Code Section (renderizado pelo `CodeBlock`)
- Leaderboard usa `score` para ordenação e `code`/`language`/`line_count` para exibição

```ts
export const roasts = pgTable("roasts", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  lineCount: integer("line_count").notNull(),
  score: real("score").notNull(),
  verdict: text("verdict").notNull(),
  quote: text("quote").notNull(),
  roastMode: boolean("roast_mode").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

---

### `roast_issues`

Issues de análise detalhada. Cada roast tem N issues. Corresponde às **Analysis Cards** (grid 2x2) na Screen 2.

| Coluna | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `id` | `serial` | NOT NULL | auto | PK |
| `roast_id` | `text` | NOT NULL | — | FK → `roasts.id` |
| `severity` | `severity` (enum) | NOT NULL | — | `critical` / `warning` / `good` |
| `title` | `text` | NOT NULL | — | Título curto do issue |
| `description` | `text` | NOT NULL | — | Descrição detalhada |
| `order` | `integer` | NOT NULL | `0` | Ordem de exibição no grid |

**Mapeamento no design:**

- `severity` → Dot color (`$accent-red`/`$accent-amber`/`$accent-green`) + Badge text
- `title` → `card1Title`: "using var instead of const/let"
- `description` → `card1Desc`: "var is function-scoped and leads to..."
- `order` → posição no grid (Row 1: issues 0-1, Row 2: issues 2-3)

```ts
export const roastIssues = pgTable("roast_issues", {
  id: serial("id").primaryKey(),
  roastId: text("roast_id").notNull().references(() => roasts.id, { onDelete: "cascade" }),
  severity: severityEnum("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull().default(0),
});
```

---

### `roast_diffs`

Linhas do diff de sugestão. Cada roast tem N linhas de diff. Corresponde à **Diff Section** na Screen 2.

| Coluna | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `id` | `serial` | NOT NULL | auto | PK |
| `roast_id` | `text` | NOT NULL | — | FK → `roasts.id` |
| `type` | `diff_type` (enum) | NOT NULL | — | `added` / `removed` / `context` |
| `code` | `text` | NOT NULL | — | Conteúdo da linha |
| `order` | `integer` | NOT NULL | `0` | Ordem sequencial das linhas |

**Mapeamento no design:**

- `type: "removed"` → bg `#EF444415`, prefix `−`
- `type: "added"` → bg `#10B98115`, prefix `+`
- `type: "context"` → bg transparente, sem prefix
- `code` → texto da linha (ex: `"  var total = 0;"`)
- `order` → sequência vertical no `diffBody`

```ts
export const roastDiffs = pgTable("roast_diffs", {
  id: serial("id").primaryKey(),
  roastId: text("roast_id").notNull().references(() => roasts.id, { onDelete: "cascade" }),
  type: diffTypeEnum("type").notNull(),
  code: text("code").notNull(),
  order: integer("order").notNull().default(0),
});
```

---

## Relacionamentos

```
roasts (1) ──→ (N) roast_issues
roasts (1) ──→ (N) roast_diffs
```

```ts
export const roastsRelations = relations(roasts, ({ many }) => ({
  issues: many(roastIssues),
  diffs: many(roastDiffs),
}));

export const roastIssuesRelations = relations(roastIssues, ({ one }) => ({
  roast: one(roasts, { fields: [roastIssues.roastId], references: [roasts.id] }),
}));

export const roastDiffsRelations = relations(roastDiffs, ({ one }) => ({
  roast: one(roasts, { fields: [roastDiffs.roastId], references: [roasts.id] }),
}));
```

---

## Índices

```ts
// Em roasts — leaderboard é ordenado por score ASC (piores primeiro)
// e filtrado por created_at para "recentes"
index("roasts_score_idx").on(roasts.score)
index("roasts_created_at_idx").on(roasts.createdAt)

// Em roast_issues — busca por roast_id
index("roast_issues_roast_id_idx").on(roastIssues.roastId)

// Em roast_diffs — busca por roast_id + ordenação
index("roast_diffs_roast_id_order_idx").on(roastDiffs.roastId, roastDiffs.order)
```

---

## Queries principais

### Criar um roast completo (após AI gerar resultado)

```ts
await db.transaction(async (tx) => {
  await tx.insert(roasts).values({ id, code, language, lineCount, score, verdict, quote, roastMode });
  await tx.insert(roastIssues).values(issues.map((issue, i) => ({ ...issue, roastId: id, order: i })));
  await tx.insert(roastDiffs).values(diffs.map((diff, i) => ({ ...diff, roastId: id, order: i })));
});
```

### Buscar roast por ID (página `/roast/[id]`)

```ts
const result = await db.query.roasts.findFirst({
  where: eq(roasts.id, id),
  with: {
    issues: { orderBy: [asc(roastIssues.order)] },
    diffs: { orderBy: [asc(roastDiffs.order)] },
  },
});
```

### Leaderboard — top N por menor score (página `/leaderboard`)

```ts
const entries = await db.query.roasts.findMany({
  orderBy: [asc(roasts.score), desc(roasts.createdAt)],
  limit: 50,
  columns: {
    id: true,
    code: true,
    language: true,
    lineCount: true,
    score: true,
  },
});
```

### Leaderboard preview — top 3 (home page)

```ts
const preview = await db.query.roasts.findMany({
  orderBy: [asc(roasts.score)],
  limit: 3,
  columns: {
    id: true,
    code: true,
    language: true,
    score: true,
  },
});
```

### Stats para o footer (total de submissions + avg score)

```ts
const stats = await db
  .select({
    count: count(),
    avgScore: avg(roasts.score),
  })
  .from(roasts);
```

### OG image — dados do roast para `/og?id=[id]`

```ts
const og = await db.query.roasts.findFirst({
  where: eq(roasts.id, id),
  columns: {
    score: true,
    verdict: true,
    language: true,
    lineCount: true,
    quote: true,
  },
});
```

---

## Configuração do Drizzle

`drizzle.config.ts` na raiz:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

`src/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });
```

---

## Dependências a instalar

```bash
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg
```

---

## Scripts no package.json

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## To-dos de implementação

- [ ] Criar `docker-compose.yml` na raiz com PostgreSQL 17
- [ ] Criar `.env` com `DATABASE_URL`
- [ ] Instalar dependências: `drizzle-orm`, `pg`, `drizzle-kit`, `@types/pg`
- [ ] Criar `src/db/schema.ts` com enums (`severity`, `diff_type`) e tabelas (`roasts`, `roast_issues`, `roast_diffs`)
- [ ] Criar `src/db/index.ts` com instância do Drizzle
- [ ] Criar `drizzle.config.ts` na raiz
- [ ] Adicionar scripts `db:generate`, `db:migrate`, `db:push`, `db:studio` no `package.json`
- [ ] Rodar `docker compose up -d` para subir o Postgres
- [ ] Rodar `pnpm db:push` para criar as tabelas
- [ ] Verificar com `pnpm db:studio` que as tabelas foram criadas
- [ ] Refatorar `/roast` para rota dinâmica `/roast/[id]` que busca dados do banco
- [ ] Refatorar `/leaderboard` para buscar dados do banco ordenados por score ASC
- [ ] Refatorar home page para buscar leaderboard preview (top 3) e stats do banco
- [ ] Refatorar `/og` route para aceitar `id` como param e buscar dados do banco
- [ ] Criar Server Action ou API route para receber submission de código e salvar no banco

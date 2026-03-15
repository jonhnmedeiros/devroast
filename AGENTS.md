# DevRoast — AGENTS.md

App de code roasting: o usuario cola codigo, recebe uma analise brutal com score, sugestoes e ranking publico.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript strict**
- **Tailwind CSS v4** — cores e tokens definidos via `@theme` em `globals.css`
- **tailwind-variants** (`tv()`) para variantes de componentes
- **tailwind-merge** (`twMerge`) para merge de classes em componentes sem `tv()`
- **@base-ui/react** para componentes com comportamento (switch, dialog, etc.)
- **shiki** (tema `vesper`) para syntax highlighting server-side
- **tRPC v11** + **TanStack React Query** para data fetching client-side
- **Drizzle ORM** com PostgreSQL para banco de dados
- **@number-flow/react** para animacoes numericas
- **Biome** para lint e formatting (tabs, double quotes, semicolons)
- **pnpm** como package manager

## Estrutura

```
src/
  app/            — Paginas e rotas (App Router) — ver AGENTS.md local
  app/_components/ — Componentes client-side especificos de paginas
  components/ui/  — Componentes reutilizaveis (ver AGENTS.md local)
  db/             — Drizzle schema, queries, seed (ver AGENTS.md local)
  trpc/           — tRPC setup, routers, client/server (ver AGENTS.md local)
specs/            — Specs de features (ver AGENTS.md local)
```

## Regras Globais

1. **Named exports apenas** — nunca `export default` em componentes (paginas usam default)
2. **Cores do `@theme`** geram utilities nativas: `bg-accent-green`, `text-text-primary` — nunca sintaxe arbitraria como bracket notation ou parentheses notation
3. **Cores nativas do Tailwind** direto: `text-white`, `bg-black` — sem custom vars
4. **`font-mono`** para JetBrains Mono; body usa system-ui (sem classe)
5. **Max-width**: conteudo usa `max-w-[1360px] mx-auto`; Navbar fica full-width
6. **Padroes de componentes** detalhados em `src/components/ui/AGENTS.md`
7. **Padroes de paginas** detalhados em `src/app/AGENTS.md`

## Padroes Rapidos

| Padrao | Quando usar |
|--------|-------------|
| `tv()` + `forwardRef` | Componentes atomicos com variantes (Button, Badge, DiffLine) |
| `twMerge` + `forwardRef` | Componentes sem variantes ou sub-componentes compostos |
| Composicao (`Object.assign`) | Componentes com 2+ sub-elementos (AnalysisCard, Navbar, LeaderboardRow) |
| `@base-ui/react` + `"use client"` | Componentes com estado interativo (Switch) |
| `async function` (sem forwardRef) | Server components com processamento async (CodeBlock) |

## Data Fetching

O projeto usa dois patterns de data fetching:

### Server-side (paginas SSR)

Queries diretas via Drizzle em paginas async server components:

```tsx
// src/app/leaderboard/page.tsx
export default async function LeaderboardPage() {
  const entries = await getLeaderboard();
  return <div>...</div>;
}
```

### Client-side (tRPC + React Query)

Para dados que precisam de animacao no load ou atualizacao em tempo real:

```tsx
// Server: prefetch no page.tsx (server component)
prefetch(trpc.leaderboard.stats.queryOptions());

// Client: consume no client component
const { data } = useQuery(trpc.leaderboard.stats.queryOptions());
```

### Hydration e NumberFlow

Ao usar `NumberFlow` com dados do servidor (prefetch + HydrateClient), o componente recebe o valor final direto do cache na hidratacao e nao anima. Para forcar a animacao 0 → N:

```tsx
const { data } = useQuery(trpc.leaderboard.stats.queryOptions());
const [animated, setAnimated] = useState({ total: 0, avgScore: 0 });

useEffect(() => {
  if (data) {
    setAnimated({ total: data.total, avgScore: data.avgScore });
  }
}, [data]);

// Use animated.total no NumberFlow, nao data.total
<NumberFlow value={animated.total} />
```

**Regra:** sempre que usar `NumberFlow` com dados pre-carregados (prefetch/SSR), use `useState(0)` + `useEffect` para garantir a animacao de incremento.

### Hydration e toLocaleString

`toLocaleString()` causa hydration mismatch porque servidor e cliente podem ter locales diferentes. Sempre passe o locale explicitamente:

```tsx
// ERRADO — mismatch entre server (pt-BR: "2.000") e client (en-US: "2,000")
{count.toLocaleString()}

// CORRETO — locale fixo, sem mismatch
{count.toLocaleString("en-US")}
```

## Design

- Design source: arquivo `.pen` (Pencil) com 4 telas + component library
- Telas: Home (input), Roast (resultado), Leaderboard (ranking), OG Image (social)
- Palette escura: fundo `#0a0a0a`, superficies `#0f0f0f`–`#1a1a1a`, acentos green/red/amber

## CodeBlock — Composicao de Headers

O `CodeBlock` e um componente puro de renderizacao de codigo (shiki). Ele **nao** tem header embutido. Para adicionar headers (bolinhas macOS, fileName, etc.), componha externamente:

### Com header macOS (bolinhas + fileName)

```tsx
<div className="flex flex-col overflow-hidden border border-border-primary bg-bg-input">
  <div className="flex items-center h-10 px-4 border-b border-border-primary gap-3 shrink-0">
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-full bg-red-500" />
      <span className="size-3 rounded-full bg-amber-500" />
      <span className="size-3 rounded-full bg-emerald-500" />
    </div>
    <div className="flex-1" />
    <span className="font-mono text-xs text-text-tertiary">calculate.js</span>
  </div>
  <CodeBlock code={code} lang="javascript" className="border-0" />
</div>
```

### Com line numbers (leaderboard)

```tsx
<CodeBlock code={code} lang="javascript" showLineNumbers className="h-[120px]" />
```

### Puro (sem header, sem line numbers)

```tsx
<CodeBlock code={code} lang="javascript" />
```

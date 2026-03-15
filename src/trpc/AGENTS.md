# tRPC — Padroes e Convencoes

## Stack

- **tRPC v11** com `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`
- **TanStack React Query v5** para cache e estado assíncrono
- **Zod v4** para validacao de inputs

## Arquitetura

```
src/trpc/
  init.ts          — createTRPCContext, createTRPCRouter, baseProcedure
  client.tsx       — TRPCReactProvider, useTRPC (client-side)
  server.tsx       — trpc proxy, prefetch, HydrateClient (server-side)
  query-client.ts  — makeQueryClient (shared entre server e client)
  routers/
    _app.ts        — appRouter (combina sub-routers)
    leaderboard.ts — leaderboardRouter (stats, etc.)
```

## Patterns

### Criar um novo router

1. Crie o arquivo em `src/trpc/routers/<nome>.ts`
2. Registre no `_app.ts`

```tsx
// src/trpc/routers/example.ts
import { baseProcedure, createTRPCRouter } from "../init";

export const exampleRouter = createTRPCRouter({
  myQuery: baseProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(someTable);
  }),
});

// src/trpc/routers/_app.ts
import { exampleRouter } from "./example";
export const appRouter = createTRPCRouter({
  example: exampleRouter,
});
```

### Context

O context inclui a instancia do Drizzle (`ctx.db`). Definido em `init.ts`:

```tsx
export const createTRPCContext = cache(async () => {
  return { db };
});
```

### Server-side: prefetch + HydrateClient

Para pre-carregar dados no servidor e hidratar no cliente:

```tsx
// page.tsx (server component)
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function Page() {
  prefetch(trpc.example.myQuery.queryOptions());

  return (
    <HydrateClient>
      <ClientComponent />
    </HydrateClient>
  );
}
```

### Client-side: useTRPC + useQuery

```tsx
// client component
"use client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

function ClientComponent() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.example.myQuery.queryOptions());
  // ...
}
```

## Regras

1. **Nunca importe `server.tsx` em client components** — ele usa `server-only`
2. **Nunca importe `client.tsx` em server components** — ele usa `"use client"`
3. **`queryOptions()`** e o padrao para criar opcoes de query — funciona tanto com `prefetch` (server) quanto com `useQuery` (client)
4. **staleTime padrao: 30s** — definido em `query-client.ts`
5. **TRPCReactProvider** fica no root layout (`src/app/layout.tsx`)
6. **API route** em `src/app/api/trpc/[trpc]/route.ts` — nao modifique a menos que necessario

## Hydration com NumberFlow

Quando dados pre-carregados via `prefetch` sao usados com `NumberFlow`, o componente ja recebe o valor final na hidratacao e **nao anima**. Para forcar a animacao 0 → N:

```tsx
const { data } = useQuery(trpc.leaderboard.stats.queryOptions());
const [animated, setAnimated] = useState({ total: 0, avgScore: 0 });

useEffect(() => {
  if (data) {
    setAnimated({ total: data.total, avgScore: data.avgScore });
  }
}, [data]);

<NumberFlow value={animated.total} />
```

**Regra:** sempre que usar `NumberFlow` com dados pre-carregados, use `useState(0)` + `useEffect`.

# tRPC — Especificacao de Implementacao

## Contexto

O DevRoast usa Next.js 16 App Router. Hoje as queries ao banco vivem em `src/db/queries.ts` e sao chamadas diretamente nos server components, enquanto a mutation de submit usa um server action em `src/app/actions.ts`. Isso funciona, mas acopla a camada de dados ao rendering e nao oferece cache client-side, revalidacao, nem loading states granulares.

Vamos adotar o **tRPC v11** com **TanStack React Query** como camada de API. A integracao segue o pattern de RSC da documentacao oficial: prefetch no server via `createTRPCOptionsProxy`, hydrate para o client via `HydrationBoundary`, consumo no client via `useTRPC` + hooks do React Query.

---

## Decisoes

| Decisao | Escolha | Motivo |
|---|---|---|
| Versao do tRPC | **v11** (`@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`) | Versao atual, suporte nativo a RSC via `createTRPCOptionsProxy` |
| Validacao | **zod** | Ja e a recomendacao padrao do tRPC, type-safe |
| Client transport | **`httpBatchLink`** | Agrupa requests no client; no server usa caller direto (zero HTTP) |
| Server-side | **`createTRPCOptionsProxy`** com router local | Chama procedures direto sem HTTP no server (zero-latency) |
| Data transformer | **Nenhum** (sem `superjson`) | Nossas queries retornam tipos primitivos (string, number, boolean). `createdAt` nao e exposto nos responses — nao precisa de Date serialization |
| Server Actions | **Substituidas por mutations** do tRPC | `submitRoast` vira `roast.submit` mutation. Unifica toda a camada de dados |

---

## Dependencias

```bash
pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only client-only
```

---

## Estrutura de arquivos

```
src/
  trpc/
    init.ts           — initTRPC, context factory, baseProcedure
    routers/
      _app.ts         — appRouter (merge de todos os sub-routers) + export type AppRouter
      roast.ts        — procedures de roast (getById, submit)
      leaderboard.ts  — procedures de leaderboard (list, preview, stats)
    query-client.ts   — factory de QueryClient com staleTime e dehydrate config
    client.tsx        — "use client" — TRPCProvider, useTRPC, TRPCReactProvider
    server.tsx        — "server-only" — trpc proxy, getQueryClient, prefetch helper, HydrateClient, caller
  app/
    api/trpc/[trpc]/
      route.ts        — fetch adapter (GET + POST)
    layout.tsx        — wrapa children com TRPCReactProvider
```

---

## Especificacao

### `src/trpc/init.ts`

Context factory e inicializacao do tRPC. O context recebe a instancia do `db` para as procedures usarem.

```ts
import { initTRPC } from "@trpc/server";
import { cache } from "react";
import { db } from "@/db";

export const createTRPCContext = cache(async () => {
  return { db };
});

const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

### `src/trpc/routers/roast.ts`

Migra `getRoastById` e `submitRoast` para procedures tRPC.

```ts
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { roasts, roastIssues, roastDiffs } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const roastRouter = createTRPCRouter({
  getById: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [roast] = await ctx.db
        .select()
        .from(roasts)
        .where(eq(roasts.id, input.id))
        .limit(1);

      if (!roast) return null;

      const issues = await ctx.db
        .select()
        .from(roastIssues)
        .where(eq(roastIssues.roastId, input.id))
        .orderBy(asc(roastIssues.order));

      const diffs = await ctx.db
        .select()
        .from(roastDiffs)
        .where(eq(roastDiffs.roastId, input.id))
        .orderBy(asc(roastDiffs.order));

      return { ...roast, issues, diffs };
    }),

  submit: baseProcedure
    .input(
      z.object({
        code: z.string().min(1).max(10000),
        roastMode: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = nanoid(12);
      // TODO: substituir generateMockRoast por chamada AI real
      const result = generateMockRoast(input.code, input.roastMode);

      await ctx.db.transaction(async (tx) => {
        await tx.insert(roasts).values({
          id,
          code: input.code,
          language: result.language,
          lineCount: result.lineCount,
          score: result.score,
          verdict: result.verdict,
          quote: result.quote,
          roastMode: input.roastMode,
        });

        await tx.insert(roastIssues).values(
          result.issues.map((issue, i) => ({
            roastId: id,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            order: i,
          })),
        );

        await tx.insert(roastDiffs).values(
          result.diffs.map((diff, i) => ({
            roastId: id,
            type: diff.type,
            code: diff.code,
            order: i,
          })),
        );
      });

      return { id };
    }),
});
```

A funcao `generateMockRoast` e movida de `src/app/actions.ts` para `src/trpc/routers/roast.ts` (ou um arquivo `src/trpc/routers/_mock.ts` separado).

### `src/trpc/routers/leaderboard.ts`

Migra `getLeaderboard`, `getLeaderboardPreview` e `getStats`.

```ts
import { z } from "zod";
import { asc, avg, count, desc } from "drizzle-orm";
import { roasts } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const leaderboardRouter = createTRPCRouter({
  list: baseProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: roasts.id,
          code: roasts.code,
          language: roasts.language,
          lineCount: roasts.lineCount,
          score: roasts.score,
        })
        .from(roasts)
        .orderBy(asc(roasts.score), desc(roasts.createdAt))
        .limit(input.limit);
    }),

  preview: baseProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: roasts.id,
        code: roasts.code,
        language: roasts.language,
        lineCount: roasts.lineCount,
        score: roasts.score,
      })
      .from(roasts)
      .orderBy(asc(roasts.score))
      .limit(3);
  }),

  stats: baseProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({
        total: count(),
        avgScore: avg(roasts.score),
      })
      .from(roasts);

    if (!result) return { total: 0, avgScore: 0 };

    return {
      total: result.total,
      avgScore: result.avgScore ? Number.parseFloat(result.avgScore) : 0,
    };
  }),
});
```

### `src/trpc/routers/_app.ts`

```ts
import { createTRPCRouter } from "../init";
import { leaderboardRouter } from "./leaderboard";
import { roastRouter } from "./roast";

export const appRouter = createTRPCRouter({
  roast: roastRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
```

### `src/trpc/query-client.ts`

```ts
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}
```

### `src/trpc/client.tsx`

```tsx
"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

export function TRPCReactProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getUrl(),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

### `src/trpc/server.tsx`

```tsx
import "server-only";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCQueryOptions } from "@trpc/tanstack-react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// Caller direto para server components que precisam do dado inline (sem cache)
export const caller = appRouter.createCaller(createTRPCContext);

// Helpers para prefetch + hydration
export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(queryOptions);
}
```

### `src/app/api/trpc/[trpc]/route.ts`

```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

### `src/app/layout.tsx` — adicionar provider

```tsx
import { TRPCReactProvider } from "@/trpc/client";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jetbrainsMono.variable}>
      <body className="min-h-screen bg-bg-page flex flex-col">
        <TRPCReactProvider>
          <Navbar.Root>
            <Navbar.Logo />
            <Navbar.Spacer />
            <Navbar.Link href="/leaderboard">leaderboard</Navbar.Link>
          </Navbar.Root>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
```

---

## Patterns de uso

### Server component com prefetch (streaming)

Prefetch sem `await` — o server inicia a query e faz stream do resultado para o client. O client component consome via `useQuery` e recebe o dado assim que chegar.

```tsx
// src/app/leaderboard/page.tsx (server component)
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { LeaderboardEntries } from "./_components/leaderboard-entries";

export default async function LeaderboardPage() {
  prefetch(trpc.leaderboard.list.queryOptions({ limit: 50 }));
  prefetch(trpc.leaderboard.stats.queryOptions());

  return (
    <HydrateClient>
      <LeaderboardEntries />
    </HydrateClient>
  );
}
```

```tsx
// src/app/leaderboard/_components/leaderboard-entries.tsx (client component)
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function LeaderboardEntries() {
  const trpc = useTRPC();
  const { data: entries } = useQuery(trpc.leaderboard.list.queryOptions({ limit: 50 }));
  const { data: stats } = useQuery(trpc.leaderboard.stats.queryOptions());
  // ...render
}
```

### Server component com caller direto (sem cache/hydration)

Para server components que nao precisam hidratar dados para o client — por exemplo, a rota de OG image.

```tsx
// src/app/og/route.tsx
import { caller } from "@/trpc/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  const roast = await caller.roast.getById({ id });
  if (!roast) return new Response("Not found", { status: 404 });
  // ... gerar ImageResponse
}
```

### Client component com mutation

```tsx
"use client";

import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";

export function CodeInputSection() {
  const trpc = useTRPC();
  const router = useRouter();
  const submit = useMutation(trpc.roast.submit.mutationOptions());

  function handleSubmit() {
    submit.mutate(
      { code, roastMode },
      {
        onSuccess: ({ id }) => router.push(`/roast/${id}`),
      },
    );
  }
  // ...
}
```

---

## Migracoes por pagina

| Pagina | Antes | Depois |
|---|---|---|
| `/` (home) | `getLeaderboardPreview()` + `getStats()` direto no server component | `prefetch` + `HydrateClient` no server; `useQuery` no client component |
| `/leaderboard` | Dados estaticos hardcoded | `prefetch` + `HydrateClient` no server; `useQuery` no client |
| `/roast/[id]` | Dados estaticos hardcoded | `prefetch` + `HydrateClient` no server; `useQuery` no client |
| `/og` | `getRoastForOg()` direto | `caller.roast.getById()` via server caller |
| `_components/code-input-section.tsx` | Server action `submitRoast()` | `useMutation(trpc.roast.submit.mutationOptions())` |

---

## Arquivos removidos apos migracao

- `src/db/queries.ts` — logica migrada para procedures tRPC
- `src/app/actions.ts` — mutation migrada para `roast.submit`

O `src/db/index.ts` e `src/db/schema.ts` continuam existindo — o tRPC context importa `db` de `src/db/index.ts`.

---

## TODOs de implementacao

- [ ] Instalar dependencias: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query`, `zod`, `server-only`, `client-only`
- [ ] Criar `src/trpc/init.ts` com context factory e baseProcedure
- [ ] Criar `src/trpc/routers/roast.ts` com `getById` query e `submit` mutation
- [ ] Criar `src/trpc/routers/leaderboard.ts` com `list`, `preview` e `stats` queries
- [ ] Criar `src/trpc/routers/_app.ts` com appRouter e export do `AppRouter` type
- [ ] Criar `src/trpc/query-client.ts` com factory de QueryClient
- [ ] Criar `src/trpc/client.tsx` com TRPCReactProvider e useTRPC
- [ ] Criar `src/trpc/server.tsx` com proxy, caller, prefetch helper e HydrateClient
- [ ] Criar `src/app/api/trpc/[trpc]/route.ts` com fetch adapter
- [ ] Adicionar `TRPCReactProvider` no `src/app/layout.tsx`
- [ ] Migrar `/roast/[id]` para usar prefetch + client component com useQuery
- [ ] Migrar `/leaderboard` para usar prefetch + client component com useQuery
- [ ] Migrar `/` (home) para usar prefetch + client components com useQuery
- [ ] Migrar `code-input-section.tsx` para usar `useMutation` ao inves de server action
- [ ] Migrar `/og` route para usar `caller.roast.getById`
- [ ] Remover `src/db/queries.ts` e `src/app/actions.ts`
- [ ] Verificar build (`pnpm build`) sem erros
- [ ] Testar navegacao completa: home → submit → roast result → leaderboard

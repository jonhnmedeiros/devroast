# Paginas e Rotas — App Router

## Estrutura

```
src/app/
  layout.tsx             — Root layout (Navbar, TRPCReactProvider, fonts)
  globals.css            — @theme tokens (cores, spacing, radius, fonts)
  page.tsx               — Home (code input, stats, leaderboard preview)
  actions.ts             — Server actions (submitRoast)
  _components/           — Client components especificos de paginas
    code-input-section.tsx  — CodeEditor + Switch + Button (home)
    stats-counter.tsx       — NumberFlow com tRPC (home)
  leaderboard/
    page.tsx              — Shame Leaderboard (SSR, dados estaticos)
  roast/[id]/
    page.tsx              — Roast Results (dados estaticos, recebe UUID)
  og/
    route.tsx             — OG Image generation (Satori)
  components/
    page.tsx              — Component showcase/library
  api/trpc/[trpc]/
    route.ts              — tRPC API handler
```

## Convencoes de Paginas

### Layout

- **Root layout** (`layout.tsx`): Navbar + `TRPCReactProvider` envolvendo `{children}`
- **Navbar** e full-width, conteudo das paginas usa `max-w-[1360px] mx-auto`
- **Padding padrao**: `px-20 py-10` para conteudo principal
- **Gap entre secoes**: `gap-xl` (40px) — usar o spacing token, nao valor numerico

### Server Components (padrao)

Paginas sao server components por padrao. Podem ser `async` para buscar dados:

```tsx
export default async function PageName() {
  const data = await getDataFromDb();
  return <main>...</main>;
}
```

### Client Components (`_components/`)

Partes interativas sao extraidas para `_components/` com `"use client"`:

```tsx
// _components/my-interactive-part.tsx
"use client";
function MyInteractivePart() { ... }
export { MyInteractivePart };
```

### Dados Estaticos

Paginas que ainda nao tem integracao com banco usam dados estaticos inline:

```tsx
const STATIC_DATA = {
  score: 3.5,
  verdict: "needs_serious_help",
  // ...
};

export default async function Page({ params }) {
  await params; // consumir params mesmo que nao use ainda
  const data = STATIC_DATA;
  // ...
}
```

**Regra:** mesmo com dados estaticos, a pagina deve aceitar os parametros dinamicos corretos (ex: `[id]`) para que a rota funcione quando integrar com banco.

### Paginas com Prefetch (tRPC)

Para paginas que pre-carregam dados no servidor e hidratam no cliente:

```tsx
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function Page() {
  prefetch(trpc.example.query.queryOptions());

  return (
    <HydrateClient>
      <main>
        <ClientComponent />
      </main>
    </HydrateClient>
  );
}
```

## Secoes de Pagina — Pattern

Secoes usam o pattern de titulo com prompt:

```tsx
function SectionTitle({ prompt, title }: { prompt: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm font-bold text-accent-green">{prompt}</span>
      <span className="font-mono text-sm font-bold text-text-primary">{title}</span>
    </div>
  );
}

// Uso
<SectionTitle prompt="//" title="your_submission" />
```

Separadores entre secoes:

```tsx
function Divider() {
  return <div className="h-px w-full bg-border-primary" />;
}
```

## Hydration — Armadilhas

### toLocaleString

`toLocaleString()` sem locale causa hydration mismatch (server pt-BR vs client en-US). Sempre passe locale:

```tsx
// ERRADO
{count.toLocaleString()}

// CORRETO
{count.toLocaleString("en-US")}
```

### NumberFlow com prefetch

NumberFlow nao anima se recebe valor final na hidratacao. Use `useState(0)` + `useEffect`:

```tsx
const [animated, setAnimated] = useState(0);
useEffect(() => { if (data) setAnimated(data.value); }, [data]);
<NumberFlow value={animated} />
```

### Suspense vs NumberFlow

**Nao use Suspense/Skeleton** para componentes com NumberFlow. O NumberFlow ja tem seu proprio loading state visual (comeca em 0 e anima ate o valor). Suspense impede essa animacao porque o componente so monta depois que os dados ja estao disponiveis.

# OG Image com Takumi — Design Spec

## Objetivo

Gerar imagens OpenGraph dinâmicas para roasts compartilháveis. Quando um usuário compartilha um link `/roast/{id}` no Twitter, Discord ou Slack, o embed mostra uma preview visual com o score, verdict e quote.

## Decisões Técnicas

| Item | Decisão |
|------|---------|
| Biblioteca | `@takumi-rs/image-response` |
| Fonte | Geist Mono (built-in do Takumi, sem necessidade de carregar) |
| Formato | PNG |
| Dimensões | 1200x630 |
| Cache | `max-age=31536000, immutable` |
| Rota | `/og?id={roastId}` |

## Arquitetura

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `next.config.ts` | Adicionar `serverExternalPackages: ["@takumi-rs/core"]` |
| `src/app/og/route.tsx` | Migrar de `next/og` para Takumi, usar `tw` props |
| `src/app/roast/[id]/page.tsx` | Adicionar `generateMetadata()` |

### Dependência

```bash
pnpm add @takumi-rs/image-response
```

## Route Handler `/og`

### Fluxo

1. Recebe `id` via query param (`/og?id=abc123`)
2. Se `id` não fornecido, retorna 400 Bad Request
3. Busca roast via `getRoastForOg(id)` (query já existe)
4. Se não encontrar, retorna 404
5. Renderiza imagem com Takumi

**Nota:** Remover o modo de preview com query params (`?score=&verdict=&...`) do código atual. Apenas IDs reais são suportados.

### Layout Visual

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      > devroast                             │
│                                                             │
│                        3.5/10                               │
│                                                             │
│                  ● needs_serious_help                       │
│                                                             │
│               lang: javascript · 7 lines                    │
│                                                             │
│    "this code was written during a power outage..."         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cores Dinâmicas

Score determina a cor do número e do verdict (alinhado com `verdictVariant()` em `page.tsx`):

| Condição | Cor |
|----------|-----|
| `score < 4` | `#ef4444` (vermelho/critical) |
| `score < 7` | `#f59e0b` (amarelo/warning) |
| `score >= 7` | `#10b981` (verde/good) |

**Nota:** Usar `<` (não `<=`) para consistência com a lógica existente na página de roast.

### Estilização

Usar `tw` prop do Takumi ao invés de objetos `style`:

```tsx
<div tw="flex flex-col items-center justify-center w-full h-full bg-[#0a0a0a] p-16 gap-7">
  {/* Logo */}
  <div tw="flex items-center gap-2">
    <span tw="text-2xl font-bold text-[#10b981]">{">"}</span>
    <span tw="text-xl font-medium text-white">devroast</span>
  </div>
  
  {/* Score - exibir com 1 casa decimal */}
  <div tw="flex items-baseline gap-1">
    <span tw="text-[160px] font-black leading-none" style={{ color: scoreColor }}>
      {score.toFixed(1)}
    </span>
    <span tw="text-6xl text-gray-600 leading-none">/10</span>
  </div>
  
  {/* Verdict */}
  <div tw="flex items-center gap-2">
    <div tw="w-3 h-3 rounded-full" style={{ backgroundColor: scoreColor }} />
    <span tw="text-xl" style={{ color: scoreColor }}>{verdict}</span>
  </div>
  
  {/* Lang info */}
  <span tw="text-base text-gray-600">
    lang: {lang} · {lines} lines
  </span>
  
  {/* Quote - truncar se muito longa */}
  <span tw="text-2xl text-white text-center leading-relaxed max-w-[90%]">
    "{quote.length > 120 ? quote.slice(0, 117) + "..." : quote}"
  </span>
</div>
```

### Response

```tsx
return new ImageResponse(jsx, {
  width: 1200,
  height: 630,
  format: "png",
  headers: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
});
```

## Metadata na Página de Roast

### `generateMetadata()`

Adicionar em `src/app/roast/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const roast = await getRoastForOg(id);

  if (!roast) {
    return { title: "Roast not found" };
  }

  const title = `Score ${roast.score}/10 — DevRoast`;
  const description = roast.quote;
  const ogImage = `/og?id=${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
```

### Resultado no Embed

Quando compartilhado em redes sociais:

- **Título:** "Score 3.5/10 — DevRoast"
- **Descrição:** A quote do roast
- **Imagem:** Preview visual com score grande, verdict e quote

## Configuração Next.js

Adicionar em `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["@takumi-rs/core"],
};
```

## Cache

A imagem é cacheada por 1 ano (`max-age=31536000`) com `immutable` porque:

1. O roast nunca muda depois de criado
2. O ID é único e determinístico
3. Evita re-renderização desnecessária

## Verificação

Após implementação:

1. Acessar `/og?id={id}` diretamente e verificar imagem
2. Usar [Twitter Card Validator](https://cards-dev.twitter.com/validator) com URL `/roast/{id}`
3. Compartilhar link no Discord e verificar embed

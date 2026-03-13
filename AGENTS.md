# DevRoast — AGENTS.md

App de code roasting: o usuario cola codigo, recebe uma analise brutal com score, sugestoes e ranking publico.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript strict**
- **Tailwind CSS v4** — cores e tokens definidos via `@theme` em `globals.css`
- **tailwind-variants** (`tv()`) para variantes de componentes
- **tailwind-merge** (`twMerge`) para merge de classes em componentes sem `tv()`
- **@base-ui/react** para componentes com comportamento (switch, dialog, etc.)
- **shiki** (tema `vesper`) para syntax highlighting server-side
- **Biome** para lint e formatting (tabs, double quotes, semicolons)
- **pnpm** como package manager

## Estrutura

```
src/
  app/           — Paginas e rotas (App Router)
  components/ui/ — Componentes reutilizaveis (ver AGENTS.md local)
```

## Regras Globais

1. **Named exports apenas** — nunca `export default` em componentes (paginas usam default)
2. **Cores do `@theme`** geram utilities nativas: `bg-accent-green`, `text-text-primary` — nunca sintaxe arbitraria como bracket notation ou parentheses notation
3. **Cores nativas do Tailwind** direto: `text-white`, `bg-black` — sem custom vars
4. **`font-mono`** para JetBrains Mono; body usa system-ui (sem classe)
5. **Max-width**: conteudo usa `max-w-[1360px] mx-auto`; Navbar fica full-width
6. **Dados estaticos** — sem API por enquanto
7. **Padroes de componentes** detalhados em `src/components/ui/AGENTS.md`

## Padroes Rapidos

| Padrao | Quando usar |
|--------|-------------|
| `tv()` + `forwardRef` | Componentes atomicos com variantes (Button, Badge, DiffLine) |
| `twMerge` + `forwardRef` | Componentes sem variantes ou sub-componentes compostos |
| Composicao (`Object.assign`) | Componentes com 2+ sub-elementos (AnalysisCard, Navbar, LeaderboardRow) |
| `@base-ui/react` + `"use client"` | Componentes com estado interativo (Switch) |
| `async function` (sem forwardRef) | Server components com processamento async (CodeBlock) |

## Design

- Design source: arquivo `.pen` (Pencil) com 4 telas + component library
- Telas: Home (input), Roast (resultado), Leaderboard (ranking), OG Image (social)
- Palette escura: fundo `#0a0a0a`, superficies `#0f0f0f`–`#1a1a1a`, acentos green/red/amber

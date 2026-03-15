# Padroes de Criacao de Componentes UI

## Stack

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript (strict)
- **Estilizacao**: Tailwind CSS v4
- **Variantes**: `tailwind-variants` (`tv()`)
- **Linting/Formatting**: Biome

## Regras Gerais

1. **Named exports apenas** — nunca use `export default`.
2. **Exporte o componente, a funcao `tv()` e o type das props** — permite reuso da funcao de variantes fora do componente.
3. **Estenda props nativas do elemento HTML** — use `ComponentProps<"elemento">` do React.
4. **Use `forwardRef`** — todos componentes interativos devem encaminhar a ref.
5. **Merge de classes com `twMerge`** — componentes que usam `tv()` passam `className` direto no `tv()` (que faz merge internamente). Componentes que **nao** usam `tv()` devem usar `twMerge` do `tailwind-merge` para unir classes base com `className`. Nunca use `.filter(Boolean).join(" ")` ou template literals para unir classes.

## Cores do Projeto (Tailwind @theme)

Todas as cores do projeto sao definidas diretamente na diretiva `@theme` do Tailwind v4 como `--color-*`. Isso gera utilities nativas do Tailwind que podem ser usadas diretamente — sem sintaxe arbitraria de parentheses ou brackets.

```
CORRETO - utilities nativas geradas pelo @theme:
  bg-accent-green
  text-text-primary
  border-border-primary
  bg-bg-page

ERRADO - nunca use sintaxe arbitraria com parentheses ou bracket notation
```

### Cores nativas do Tailwind vs cores do projeto

Quando uma cor ja existe como utility nativa do Tailwind (ex: `white`, `black`, cores da paleta padrao), use a classe canonica diretamente:

```
CORRETO - cores nativas do Tailwind:
  text-white
  bg-black
  text-red-500
  bg-gray-500

CORRETO - cores customizadas do projeto (definidas no @theme):
  bg-accent-green
  text-text-primary
  border-border-primary
  bg-bg-surface

ERRADO - nunca use bracket notation ou parentheses notation com var() ou --color-* em classes Tailwind
```

**Regra:** se a cor faz parte do Tailwind default (`white`, `black`, `red-500`, etc.), use a utility direta. Se e uma cor customizada do projeto, use o nome curto gerado pelo `@theme` (ex: `bg-accent-green`, `text-bg-page`).

**Nota sobre SVG inline styles:** para propriedades CSS inline (ex: `stroke`, `fill` em SVGs), use `var(--color-accent-red)` — a variavel CSS completa com prefixo `--color-`.

### Mapa de cores customizadas

| Categoria   | Classe Tailwind          | CSS Variable                | Valor             |
|-------------|--------------------------|-----------------------------|--------------------|
| Background  | `bg-bg-page`             | `--color-bg-page`           | `#0a0a0a`          |
| Background  | `bg-bg-surface`          | `--color-bg-surface`        | `#0f0f0f`          |
| Background  | `bg-bg-elevated`         | `--color-bg-elevated`       | `#1a1a1a`          |
| Background  | `bg-bg-input`            | `--color-bg-input`          | `#111111`          |
| Text        | `text-text-primary`      | `--color-text-primary`      | `#fafafa`          |
| Text        | `text-text-secondary`    | `--color-text-secondary`    | `#6b7280`          |
| Text        | `text-text-tertiary`     | `--color-text-tertiary`     | `#4b5563`          |
| Border      | `border-border-primary`  | `--color-border-primary`    | `#2a2a2a`          |
| Border      | `border-border-secondary`| `--color-border-secondary`  | `#252525`          |
| Border      | `border-border-focus`    | `--color-border-focus`      | `#10b981`          |
| Accent      | `text-accent-green`      | `--color-accent-green`      | `#10b981`          |
| Accent      | `text-accent-red`        | `--color-accent-red`        | `#ef4444`          |
| Accent      | `text-accent-amber`      | `--color-accent-amber`      | `#f59e0b`          |
| Accent      | `text-accent-cyan`       | `--color-accent-cyan`       | `#06b6d4`          |
| Diff        | `bg-diff-removed-bg`     | `--color-diff-removed-bg`   | `#1a0a0a`          |
| Diff        | `bg-diff-added-bg`       | `--color-diff-added-bg`     | `#0a1a0f`          |

### Fontes

O projeto usa duas font stacks configuradas via `--default-font-family` e `--font-mono` do Tailwind v4:

- **Sans (padrao do body)**: `system-ui, -apple-system, sans-serif` — configurado via `--default-font-family` no `@theme`. Nao precisa de classe, e a fonte padrao do documento.
- **Mono**: `"JetBrains Mono", ui-monospace, monospace` — use `font-mono` para aplicar.

```
// CORRETO - fonte padrao do sistema (sem classe, herda do body)
<p>Texto normal</p>

// CORRETO - monospace
<code class="font-mono">codigo</code>

// ERRADO - nao existem essas classes
<p class="font-primary">...</p>
<p class="font-sans">...</p>  // desnecessario, ja e o padrao
```

### Spacing

Definidos no `@theme`, usaveis como utilities nativas:

- `gap-xs` (4px) | `gap-sm` (8px) | `gap-md` (16px) | `gap-lg` (24px) | `gap-xl` (40px)
- Mesmo padrao para `p-*`, `m-*`, etc.

### Radius

- `rounded-none` (0px) | `rounded-m` (16px) | `rounded-pill` (999px)

## Estrutura de um Componente

```tsx
import { type ComponentProps, forwardRef } from "react";
import { type VariantProps, tv } from "tailwind-variants";

// 1. Defina as variantes com tv()
const myComponent = tv({
	base: [
		// classes base que se aplicam a todas variantes
	],
	variants: {
		variant: {
			primary: [
				// cores do projeto — use utilities diretas
				"bg-accent-green",
				"text-bg-page",
			],
			secondary: [
				"bg-transparent",
				"border border-border-primary",
			],
		},
		size: {
			default: "px-6 py-2.5",
			sm: "px-4 py-2",
		},
	},
	defaultVariants: {
		variant: "primary",
		size: "default",
	},
});

// 2. Extraia os types das variantes
type MyComponentVariants = VariantProps<typeof myComponent>;

// 3. Estenda as props nativas do elemento HTML
type MyComponentProps = ComponentProps<"div"> & MyComponentVariants;

// 4. Use forwardRef e passe className pelo tv()
const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={myComponent({ variant, size, className })}
				{...props}
			/>
		);
	},
);

MyComponent.displayName = "MyComponent";

// 5. Named exports: componente, funcao tv e type
export { MyComponent, myComponent, type MyComponentProps };
```

### Componentes sem `tv()` — use `twMerge`

Para componentes que nao usam `tailwind-variants` (ex: wrappers simples, componentes compostos), use `twMerge` para unir classes base com `className`:

```tsx
import { type ComponentProps, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type CardProps = ComponentProps<"div">;

const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={twMerge(
					"flex flex-col gap-3 p-5 border border-border-primary",
					className,
				)}
				{...props}
			/>
		);
	},
);

export { Card, type CardProps };
```

**Nunca use** `.filter(Boolean).join(" ")` ou template literals para unir classes. Sempre `tv()` ou `twMerge()`.

## Composicao de Componentes

Componentes com **estrutura interna composta** (titulo, descricao, slots, etc.) devem usar o **pattern de composicao** ao inves de props individuais. Isso da ao consumidor controle total sobre o que renderizar dentro de cada slot.

### Quando usar composicao

- Componente tem **2+ sub-elementos distintos** (ex: titulo + descricao, logo + links)
- Consumidor pode querer **customizar ou omitir** partes internas
- Sub-elementos tem **estilos consistentes** que devem ser reutilizaveis

### Quando NAO usar composicao

- Componente e **atomico** (Button, Badge) — use `children` diretamente
- Logica interna e **derivada de uma prop** (DiffLine calcula prefixo/cores a partir de `variant`)
- Componente e **async server** (CodeBlock) — props de dados sao necessarias para processamento server-side

### Estrutura

Cada sub-componente e um `forwardRef` com `ComponentProps<"elemento">` e `twMerge` para merge de classes. Os sub-componentes sao agrupados via `Object.assign`:

```tsx
import { type ComponentProps, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type MyCardRootProps = ComponentProps<"div">;

const MyCardRoot = forwardRef<HTMLDivElement, MyCardRootProps>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={twMerge("flex flex-col gap-3 p-5 border border-border-primary", className)}
			{...props}
		/>
	),
);
MyCardRoot.displayName = "MyCard.Root";

type MyCardTitleProps = ComponentProps<"p">;

const MyCardTitle = forwardRef<HTMLParagraphElement, MyCardTitleProps>(
	({ className, ...props }, ref) => (
		<p
			ref={ref}
			className={twMerge("font-mono text-[13px] text-text-primary", className)}
			{...props}
		/>
	),
);
MyCardTitle.displayName = "MyCard.Title";

// Agrupe via Object.assign
const MyCard = Object.assign(MyCardRoot, {
	Root: MyCardRoot,
	Title: MyCardTitle,
});

// Exporte tudo: namespace, sub-componentes individuais e types
export {
	MyCard,
	MyCardRoot,
	MyCardTitle,
	type MyCardRootProps,
	type MyCardTitleProps,
};
```

### Uso

```tsx
<MyCard.Root>
	<Badge variant="critical">critical</Badge>
	<MyCard.Title>using var instead of const/let</MyCard.Title>
</MyCard.Root>
```

### Componentes com composicao no projeto

| Componente       | Sub-componentes                              |
|------------------|----------------------------------------------|
| `AnalysisCard`   | `Root`, `Title`, `Description`               |
| `Navbar`         | `Root`, `Logo`, `Spacer`, `Link`             |
| `LeaderboardRow` | `Root`, `Rank`, `Score`, `Code`, `Language`  |

### Regras

1. **`Object.assign`** para agrupar sub-componentes no namespace — permite `Component.Sub` syntax
2. **Exporte sub-componentes individualmente tambem** — permite imports diretos quando necessario
3. **Cada sub-componente tem `forwardRef`** e `twMerge` para `className`
4. **`displayName`** segue o padrao `"Component.Sub"` (ex: `"AnalysisCard.Title"`)
5. **Nao acople sub-componentes** — cada um deve funcionar independentemente

## Componentes com Comportamento (@base-ui/react)

Componentes que possuem **comportamento interativo** (toggle, switch, dialog, tooltip, etc.) devem usar primitivos do **@base-ui/react** como base. Isso garante acessibilidade, gerenciamento de estado e keyboard navigation corretos.

### Regras

1. **Use `@base-ui/react` para qualquer componente com estado interativo** — nunca reimplemente logica de toggle, dialog, popover, etc.
2. **Importe do subpath especifico** — ex: `import { Switch } from "@base-ui/react/switch"`.
3. **Extraia os tipos de props do primitivo** — use `ComponentProps<typeof Primitive.Root>` para inferir os tipos corretos.
4. **Estilize via `data-*` attributes** — base-ui expoe `data-checked`, `data-unchecked`, `data-disabled`, etc. Use Tailwind `data-[checked]:` ou `group-data-[checked]:` para estilizar.
5. **Nao use `forwardRef`** — base-ui gerencia refs internamente. O componente wrapper deve ser uma funcao simples.
6. **Marque como `"use client"`** — componentes com estado interativo precisam rodar no cliente.

### Exemplo: Switch

```tsx
"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";

type SwitchRootProps = ComponentProps<typeof BaseSwitch.Root>;

type SwitchProps = {
	checked?: SwitchRootProps["checked"];
	onCheckedChange?: SwitchRootProps["onCheckedChange"];
	label?: string;
	className?: string;
};

function Switch({ className, label, checked, ...props }: SwitchProps) {
	return (
		<BaseSwitch.Root
			checked={checked}
			aria-label={label}
			className={["group inline-flex items-center gap-3", className]
				.filter(Boolean)
				.join(" ")}
			{...props}
		>
			<span className="inline-flex items-center w-10 h-[22px] rounded-full p-[3px] bg-border-primary group-data-[checked]:bg-accent-green">
				<BaseSwitch.Thumb className="size-4 rounded-full bg-gray-500 group-data-[checked]:bg-bg-page" />
			</span>
			{label && (
				<span className="text-text-secondary group-data-[checked]:text-accent-green">
					{label}
				</span>
			)}
		</BaseSwitch.Root>
	);
}

export { Switch, type SwitchProps };
```

### Padrao de estilizacao: `group` + `group-data-[*]`

O `Switch.Root` recebe os `data-*` attributes do base-ui. Para estilizar elementos filhos baseado no estado do root, coloque `group` no Root e use `group-data-[checked]:` nos filhos:

```
Root:     className="group ..."           -> recebe data-checked/data-unchecked
Thumb:    className="group-data-[checked]:bg-accent-green"
Label:    className="group-data-[checked]:text-accent-green"
```

## Componentes Server-Side (Async)

Componentes que dependem de operacoes assincronas (ex: syntax highlighting) devem ser **async server components**. Nao use `"use client"`, nao use `forwardRef`.

### Regras

1. **Funcao `async`** — o componente e uma funcao async que retorna JSX.
2. **Sem `"use client"`** — roda exclusivamente no servidor.
3. **Sem `forwardRef`** — nao faz sentido em server components.
4. **Use `dangerouslySetInnerHTML` para HTML confiavel** — suppress Biome com comentario inline dentro do JSX element:
   ```tsx
   <div
     // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates trusted HTML server-side
     dangerouslySetInnerHTML={{ __html: html }}
   />
   ```
5. **Em paginas `"use client"`**, nao e possivel importar diretamente — extraia a parte interativa para um client component separado e mantenha o server component no page (server component).

### Exemplo: CodeBlock (shiki)

```tsx
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { twMerge } from "tailwind-merge";

type CodeBlockProps = {
	code: string;
	lang: BundledLanguage;
	showLineNumbers?: boolean;
	className?: string;
};

async function CodeBlock({ code, lang, showLineNumbers, className }: CodeBlockProps) {
	const html = await codeToHtml(code, { lang, theme: "vesper" });
	const lineCount = showLineNumbers ? code.split("\n").length : 0;

	return (
		<div className={twMerge("flex overflow-hidden bg-bg-input border border-border-primary", className)}>
			{showLineNumbers && (
				<div className="flex flex-col items-end py-3.5 px-2.5 border-r border-border-primary shrink-0 bg-bg-surface select-none">
					{Array.from({ length: lineCount }, (_, i) => (
						<span key={`ln-${i + 1}`} className="font-mono text-xs leading-relaxed text-text-tertiary">
							{i + 1}
						</span>
					))}
				</div>
			)}
			<div
				className={twMerge(
					"flex-1 overflow-x-auto [&_pre]:!bg-transparent [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed [&_code]:font-mono",
					showLineNumbers ? "[&_pre]:py-3.5 [&_pre]:px-4 [&_pre]:!m-0" : "[&_pre]:p-4",
				)}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates trusted HTML server-side
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</div>
	);
}

export { CodeBlock, type CodeBlockProps };
```

**shiki**: Use `codeToHtml(code, { lang, theme: "vesper" })`. O tema `vesper` e bundled. Retorna HTML string.

**CodeBlock nao tem header embutido.** Headers (bolinhas macOS, fileName) sao compostos externamente. Ver exemplos no `AGENTS.md` raiz, secao "CodeBlock — Composicao de Headers".

## Componentes Client-Side com Highlighting (CodeEditor)

Componentes que precisam de syntax highlighting interativo no cliente usam o pattern **textarea transparente + shiki overlay** (inspirado no ray-so). Isso combina input nativo do browser com highlighting do shiki.

### Pattern: textarea + shiki overlay

1. **textarea transparente** — captura input, selecao, undo/redo nativo
2. **div overlay** — renderiza HTML do shiki via `dangerouslySetInnerHTML`
3. **Scroll sync** — textarea e overlay sincronizam scroll via `onScroll` handler
4. **Texto invisivel no textarea** — `text-transparent` com `caret-text-primary` mostra apenas o cursor

### Shiki client-side

- Usa `shiki/bundle/full` (dynamic import) para suportar todas as linguagens
- Singleton via `createHighlighter()` — inicializado uma vez, reutilizado
- Tema `vesper` (mesmo do CodeBlock server-side)
- Highlight com debounce (~150ms) para nao travar digitacao

### Deteccao de linguagem

- `highlight.js` core + subset de 15 linguagens (apenas para deteccao, nunca renderiza)
- `hljs.highlightAuto(code, languageSubset)` no paste e apos debounce
- Dropdown de linguagem com `@base-ui/react/select` para override manual
- Se usuario selecionar manualmente, auto-detect e desabilitado

### Exemplo: CodeEditor

```tsx
"use client";

// Shiki para highlighting (bundle/full via dynamic import)
// highlight.js apenas para deteccao de linguagem
// @base-ui/react/select para dropdown de linguagem

type CodeEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  placeholder?: string;
  className?: string;
};

// Uso:
<CodeEditor value={code} onChange={setCode} />
```

### Comportamentos implementados

- **Tab**: insere 2 espacos (nao muda foco)
- **Shift+Tab**: remove indent (ate 2 espacos)
- **Paste**: detecta linguagem imediatamente
- **Digitacao**: highlight atualizado com debounce
- **Dropdown**: override manual de linguagem, opcao "Auto-detect" para voltar

## Checklist

- [ ] Named export (nunca default)
- [ ] Props estendem elemento HTML nativo (`ComponentProps<"...">`)
- [ ] `forwardRef` implementado (exceto: base-ui wrappers e async server components)
- [ ] Cores do projeto usadas como utilities nativas (`bg-accent-green`, nunca sintaxe arbitraria)
- [ ] Cores nativas do Tailwind usadas diretamente (`text-white`, `bg-gray-500`)
- [ ] `className` passado como prop do `tv()` (sem `twMerge`)
- [ ] Variantes exportadas junto com componente
- [ ] `font-mono` para monospace, sem classe para sans (herda do body)
- [ ] Componente documentado na pagina `/components`
- [ ] Componentes com comportamento usam `@base-ui/react` primitivos
- [ ] Componentes async (server) nao tem `"use client"` nem `forwardRef`

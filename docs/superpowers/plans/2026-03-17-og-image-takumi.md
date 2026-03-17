# OG Image com Takumi — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar geração de OG images para Takumi e adicionar metadados dinâmicos na página de roast.

**Architecture:** Route handler `/og` renderiza imagem com Takumi usando Geist Mono built-in. Página de roast exporta `generateMetadata()` com og:image apontando para `/og?id={id}`.

**Tech Stack:** Next.js 16, @takumi-rs/image-response, Tailwind (tw prop)

**Spec:** `docs/superpowers/specs/2026-03-17-og-image-takumi-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `next.config.ts` | Modify | Adicionar `serverExternalPackages` |
| `src/app/og/route.tsx` | Modify | Migrar de `next/og` para Takumi |
| `src/app/roast/[id]/page.tsx` | Modify | Adicionar `generateMetadata()` |

---

## Task 1: Install @takumi-rs/image-response

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
pnpm add @takumi-rs/image-response
```

- [ ] **Step 2: Verify installation**

Run: `pnpm list @takumi-rs/image-response`
Expected: `@takumi-rs/image-response` version listed

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @takumi-rs/image-response dependency"
```

---

## Task 2: Configure Next.js for Takumi

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add serverExternalPackages**

Replace the contents of `next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	serverExternalPackages: ["@takumi-rs/core"],
};

export default nextConfig;
```

- [ ] **Step 2: Verify config syntax**

Run: `pnpm exec tsc --noEmit next.config.ts 2>&1 || echo "Config OK"`
Expected: No errors or "Config OK"

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: configure Next.js for Takumi native bindings"
```

---

## Task 3: Migrate OG route to Takumi

**Files:**
- Modify: `src/app/og/route.tsx`

- [ ] **Step 1: Rewrite the OG route handler**

Replace the entire contents of `src/app/og/route.tsx` with:

```tsx
import { getRoastForOg } from "@/db/queries";
import { ImageResponse } from "@takumi-rs/image-response";
import type { NextRequest } from "next/server";

function getScoreColor(score: number): string {
	if (score < 4) return "#ef4444";
	if (score < 7) return "#f59e0b";
	return "#10b981";
}

function truncateQuote(quote: string, maxLength = 120): string {
	if (quote.length <= maxLength) return quote;
	return quote.slice(0, maxLength - 3) + "...";
}

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const id = searchParams.get("id");

	if (!id) {
		return new Response("Missing id parameter", { status: 400 });
	}

	const roast = await getRoastForOg(id);

	if (!roast) {
		return new Response("Roast not found", { status: 404 });
	}

	const scoreColor = getScoreColor(roast.score);
	const quote = truncateQuote(roast.quote);

	return new ImageResponse(
		<div tw="flex flex-col items-center justify-center w-full h-full bg-[#0a0a0a] p-16 gap-7">
			{/* Logo */}
			<div tw="flex items-center gap-2">
				<span tw="text-2xl font-bold text-[#10b981]">{">"}</span>
				<span tw="text-xl font-medium text-white">devroast</span>
			</div>

			{/* Score */}
			<div tw="flex items-baseline gap-1">
				<span
					tw="text-[160px] font-black leading-none"
					style={{ color: scoreColor }}
				>
					{roast.score.toFixed(1)}
				</span>
				<span tw="text-6xl text-gray-600 leading-none">/10</span>
			</div>

			{/* Verdict */}
			<div tw="flex items-center gap-2">
				<div
					tw="w-3 h-3 rounded-full"
					style={{ backgroundColor: scoreColor }}
				/>
				<span tw="text-xl" style={{ color: scoreColor }}>
					{roast.verdict}
				</span>
			</div>

			{/* Lang info */}
			<span tw="text-base text-gray-600">
				lang: {roast.language} · {roast.lineCount} lines
			</span>

			{/* Quote */}
			<span tw="text-2xl text-white text-center leading-relaxed max-w-[90%]">
				"{quote}"
			</span>
		</div>,
		{
			width: 1200,
			height: 630,
			format: "png",
			headers: {
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		},
	);
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/og/route.tsx
git commit -m "feat: migrate OG image generation to Takumi"
```

---

## Task 4: Add generateMetadata to roast page

**Files:**
- Modify: `src/app/roast/[id]/page.tsx`

- [ ] **Step 1: Add generateMetadata export**

Add the following import and function at the top of `src/app/roast/[id]/page.tsx`, after the existing imports:

```tsx
import type { Metadata } from "next";
import { getRoastForOg } from "@/db/queries";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const roast = await getRoastForOg(id);

	if (!roast) {
		return { title: "Roast not found — DevRoast" };
	}

	const title = `Score ${roast.score.toFixed(1)}/10 — DevRoast`;
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

- [ ] **Step 2: Verify no duplicate imports**

Check that `getRoastById` import remains (used by page component) and `getRoastForOg` is added separately. The imports section should look like:

```tsx
import { getRoastById, getRoastForOg } from "@/db/queries";
```

Or if they were separate:

```tsx
import { getRoastById } from "@/db/queries";
import { getRoastForOg } from "@/db/queries";
```

Combine them into a single import if needed.

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add "src/app/roast/[id]/page.tsx"
git commit -m "feat: add dynamic OpenGraph metadata to roast page"
```

---

## Task 5: End-to-end verification

- [ ] **Step 1: Get a test roast ID**

Query the database for an existing roast ID. Use the leaderboard preview which has known IDs from seed data:

```bash
# Known seed IDs (from src/db/seed.ts):
# - Dnmx15thMfaH (ruby, score 0.2)
# - SZG5tZ9qHvi5 (rust, score 0.3)
# - JdvPqxp4q7qj (python, score 0.3)
```

Use `TEST_ID=Dnmx15thMfaH` for the following tests.

- [ ] **Step 2: Start dev server**

Run: `pnpm dev`

- [ ] **Step 3: Test OG image returns valid PNG**

Run: `curl -sI "http://localhost:3000/og?id=Dnmx15thMfaH" | grep -i content-type`
Expected: `content-type: image/png`

- [ ] **Step 4: Visually verify OG image**

Open browser to `http://localhost:3000/og?id=Dnmx15thMfaH`

Verify image renders with:
- Logo "> devroast" at top
- Large score number (0.2) in red color
- Verdict with colored dot
- Language and line count
- Quote at bottom

- [ ] **Step 5: Test missing ID returns 400**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/og`
Expected: `400`

- [ ] **Step 6: Test invalid ID returns 404**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/og?id=nonexistent`
Expected: `404`

- [ ] **Step 7: Verify metadata in page source**

Run: `curl -s http://localhost:3000/roast/Dnmx15thMfaH | grep -E "(og:image|twitter:card)"`
Expected output should contain:
- `og:image` with `/og?id=Dnmx15thMfaH`
- `twitter:card` with `summary_large_image`

- [ ] **Step 8: Test cache headers**

Run: `curl -sI "http://localhost:3000/og?id=Dnmx15thMfaH" | grep -i cache-control`
Expected: `cache-control: public, max-age=31536000, immutable`

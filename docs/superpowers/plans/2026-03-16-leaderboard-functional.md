# Leaderboard Page — Functional Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static data in the leaderboard page with real DB queries, collapsible code blocks, and animated stats via tRPC + NumberFlow.

**Architecture:** SSR direct for 20 entries via `getLeaderboard(20)`. tRPC prefetch + client component for stats with NumberFlow animation. CollapsibleCode wraps CodeBlock for entries with >5 lines.

**Tech Stack:** Next.js 16 App Router, tRPC v11, TanStack React Query, Drizzle ORM, shiki, @number-flow/react, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-16-leaderboard-functional-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/_components/leaderboard-stats.tsx` | Create | Client component: animated stats (NumberFlow + tRPC) |
| `src/app/leaderboard/page.tsx` | Modify | Server component: DB query, tRPC prefetch, CollapsibleCode |

Dependencies (already exist, no changes):
- `src/db/queries.ts` — `getLeaderboard(limit)` returns `{ id, code, language, lineCount, score }[]`
- `src/trpc/routers/leaderboard.ts` — `stats` procedure returns `{ total, avgScore }`
- `src/app/_components/collapsible-code.tsx` — generic collapsible wrapper
- `src/components/ui/code-block.tsx` — shiki syntax highlighting

---

## Chunk 1: Implementation

### Task 1: Create LeaderboardStats client component

**Files:**
- Create: `src/app/_components/leaderboard-stats.tsx`

**Reference:** `src/app/_components/stats-counter.tsx` (same pattern, different text)

- [ ] **Step 1: Create the LeaderboardStats component**

```tsx
"use client";

import { useTRPC } from "@/trpc/client";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function LeaderboardStats() {
	const trpc = useTRPC();
	const { data } = useQuery(trpc.leaderboard.stats.queryOptions());

	const [animated, setAnimated] = useState({ total: 0, avgScore: 0 });

	useEffect(() => {
		if (data) {
			setAnimated({ total: data.total, avgScore: data.avgScore });
		}
	}, [data]);

	return (
		<div className="flex items-center gap-2 font-mono text-xs text-text-tertiary">
			<span className="flex items-center gap-1">
				<NumberFlow value={animated.total} format={{ useGrouping: true }} />
				<span>submissions</span>
			</span>
			<span>&middot;</span>
			<span className="flex items-center gap-1">
				<span>avg score:</span>
				<NumberFlow
					value={animated.avgScore}
					format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
					suffix="/10"
				/>
			</span>
		</div>
	);
}

export { LeaderboardStats };
```

Key differences from `StatsCounter`:
- Layout uses `gap-2` (not `gap-6`, no `justify-center`) to match the leaderboard hero stats row
- Text says "submissions" (not "codes roasted")
- Named export at bottom with `export { LeaderboardStats }`

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `leaderboard-stats.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/leaderboard-stats.tsx
git commit -m "feat: add LeaderboardStats client component with NumberFlow animation"
```

---

### Task 2: Rewrite leaderboard page with real data

**Files:**
- Modify: `src/app/leaderboard/page.tsx` (full rewrite)

**Reference files:**
- `src/app/page.tsx:18-121` — homepage LeaderboardPreview pattern (SSR + CollapsibleCode)
- `src/app/page.tsx:123-161` — homepage prefetch + HydrateClient pattern

- [ ] **Step 1: Rewrite the leaderboard page**

Replace the entire contents of `src/app/leaderboard/page.tsx` with:

```tsx
import { CodeBlock } from "@/components/ui/code-block";
import { getLeaderboard } from "@/db/queries";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import type { BundledLanguage } from "shiki";
import { CollapsibleCode } from "../_components/collapsible-code";
import { LeaderboardStats } from "../_components/leaderboard-stats";

function scoreColor(score: number) {
	if (score <= 3) return "text-accent-red";
	if (score <= 6) return "text-accent-amber";
	return "text-accent-green";
}

export default async function LeaderboardPage() {
	const entries = await getLeaderboard(20);

	prefetch(trpc.leaderboard.stats.queryOptions());

	return (
		<HydrateClient>
			<main className="flex-1 flex flex-col w-full">
				{/* Main Content */}
				<div className="flex flex-col gap-10 w-full max-w-[1360px] mx-auto px-20 py-10">
					{/* Hero Section */}
					<section className="flex flex-col gap-4">
						{/* Title Row */}
						<div className="flex items-center gap-3">
							<span className="font-mono text-[32px] font-bold text-accent-green">
								{">"}
							</span>
							<h1 className="font-mono text-[28px] font-bold text-text-primary">
								shame_leaderboard
							</h1>
						</div>

						{/* Subtitle */}
						<p className="font-mono text-sm text-text-secondary">
							{"// the most roasted code on the internet"}
						</p>

						{/* Stats Row — animated via tRPC + NumberFlow */}
						<LeaderboardStats />
					</section>

					{/* Leaderboard Entries */}
					<section className="flex flex-col gap-5">
						{entries.map((entry, idx) => {
							const needsCollapsible = entry.lineCount > 5;

							return (
								<article
									key={entry.id}
									className="flex flex-col border border-border-primary overflow-hidden"
								>
									{/* Meta Row */}
									<div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
										{/* Left: Rank + Score */}
										<div className="flex items-center gap-4">
											{/* Rank */}
											<div className="flex items-center gap-1.5 font-mono">
												<span className="text-[13px] text-text-tertiary">
													#
												</span>
												<span className="text-sm font-bold text-accent-amber">
													{idx + 1}
												</span>
											</div>

											{/* Score */}
											<div className="flex items-center gap-1.5 font-mono">
												<span className="text-xs text-text-tertiary">
													score
												</span>
												<span
													className={`text-sm font-bold ${scoreColor(entry.score)}`}
												>
													{entry.score.toFixed(1)}
												</span>
											</div>
										</div>

										{/* Right: Language + Lines + View Link */}
										<div className="flex items-center gap-3 font-mono text-xs">
											<span className="text-text-secondary">
												{entry.language}
											</span>
											<span className="text-text-tertiary">
												{entry.lineCount} line
												{entry.lineCount !== 1 ? "s" : ""}
											</span>
											<a
												href={`/roast/${entry.id}`}
												className="text-accent-green hover:text-accent-green/80 transition-colors"
											>
												view &rarr;
											</a>
										</div>
									</div>

									{/* Code Block */}
									{needsCollapsible ? (
										<CollapsibleCode>
											<CodeBlock
												code={entry.code}
												lang={entry.language as BundledLanguage}
												showLineNumbers
												className="border-0"
											/>
										</CollapsibleCode>
									) : (
										<CodeBlock
											code={entry.code}
											lang={entry.language as BundledLanguage}
											showLineNumbers
											className="border-0 max-h-[120px]"
										/>
									)}
								</article>
							);
						})}
					</section>
				</div>
			</main>
		</HydrateClient>
	);
}
```

Key changes from the current static version:
- Removed `LEADERBOARD_ENTRIES` and `STATS` constants
- Added `getLeaderboard(20)` DB query + `prefetch` for tRPC stats
- Wrapped in `HydrateClient`
- Stats row replaced with `<LeaderboardStats />` client component
- Score color is now dynamic via `scoreColor()`
- Uses `entry.lineCount` from DB (not `code.split("\n").length`)
- Code blocks: `CollapsibleCode > CodeBlock` for >5 lines, plain `CodeBlock` with `max-h-[120px]` for <=5 lines
- Added "view →" link in meta row
- Both code paths keep `showLineNumbers`

- [ ] **Step 2: Type-check the project**

Run: `pnpm exec tsc --noEmit --pretty 2>&1 | head -30`
Expected: No type errors

- [ ] **Step 3: Verify the page loads**

Run: `pnpm dev` (if not already running), then open `http://localhost:3000/leaderboard` in browser.
Expected: Page renders with 20 entries from database, stats animate with NumberFlow, collapsible code works for long entries, "view →" links point to `/roast/{id}`.

- [ ] **Step 4: Commit**

```bash
git add src/app/leaderboard/page.tsx
git commit -m "feat: connect leaderboard page to DB with collapsible code and animated stats"
```

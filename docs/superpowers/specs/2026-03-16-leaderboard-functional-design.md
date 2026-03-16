# Leaderboard Page — Functional Implementation

**Date:** 2026-03-16
**Status:** Approved
**Scope:** Replace static data in the leaderboard page with real database queries, add collapsible code blocks, and animate stats with NumberFlow.

## Goal

Make the leaderboard page (`/leaderboard`) functional by loading 20 entries from the database, adding collapsible syntax-highlighted code blocks (matching the homepage pattern), and animating stats with NumberFlow via tRPC.

## Architecture

Two data-fetching patterns working together (same as homepage):

1. **SSR direct** for the 20 entries: `getLeaderboard(20)` called in the server component
2. **tRPC prefetch + client component** for stats: reuses existing `trpc.leaderboard.stats` with NumberFlow animation

```
LeaderboardPage (async server component)
├── prefetch(trpc.leaderboard.stats.queryOptions())
├── HydrateClient
│   ├── Hero section (server-rendered)
│   │   └── LeaderboardStats (client component, NumberFlow)
│   └── Entries list (server-rendered, 20 items)
│       └── Each entry:
│           ├── Meta row: rank, score (color-coded), language, line count, "view →" link
│           └── Code: CollapsibleCode > CodeBlock (if >5 lines) or CodeBlock (if ≤5 lines)
```

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/app/leaderboard/page.tsx` | Modify | Replace static data with DB query + tRPC prefetch, add CollapsibleCode |
| `src/app/_components/leaderboard-stats.tsx` | Create | Client component for animated stats (NumberFlow + tRPC) |

No changes needed to:
- `src/trpc/routers/leaderboard.ts` — `stats` procedure already exists
- `src/db/queries.ts` — `getLeaderboard(limit)` already exists
- `src/app/_components/collapsible-code.tsx` — already works generically

## Design Details

### `src/app/leaderboard/page.tsx`

**Removals:**
- Delete `LEADERBOARD_ENTRIES` static array
- Delete `STATS` static object

**Additions:**
- Import `getLeaderboard` from `@/db/queries`
- Import `HydrateClient, prefetch, trpc` from `@/trpc/server`
- Import `CollapsibleCode` from `../_components/collapsible-code`
- Import `LeaderboardStats` from `../_components/leaderboard-stats`
- Add `scoreColor()` helper (same as homepage): score ≤3 → `text-accent-red`, ≤6 → `text-accent-amber`, >6 → `text-accent-green`

**Data flow:**
- Call `const entries = await getLeaderboard(20)` at the top of the async function
- Call `prefetch(trpc.leaderboard.stats.queryOptions())` — fire-and-forget, no `await` (same as homepage pattern). The dehydration boundary handles it.
- Wrap content in `HydrateClient`

**Stats row:** Replace hardcoded `{STATS.total.toLocaleString("en-US")} submissions` with `<LeaderboardStats />` client component.

**Entries rendering:**
- Iterate with `entries.map((entry, idx) => ...)` where rank is `idx + 1`
- Replace the current hardcoded `text-accent-red` on score with dynamic `scoreColor(entry.score)`
- Use `entry.lineCount` from DB for both the collapsible threshold check AND the line count display in the meta row (remove the current `entry.code.split("\n").length` computation)
- Cast `entry.language as BundledLanguage` when passing to `CodeBlock`'s `lang` prop
- Code rendering: if `entry.lineCount > 5`, wrap `CodeBlock` in `CollapsibleCode`. Otherwise, render `CodeBlock` directly.
- When using `CollapsibleCode`: remove `h-[120px]` from CodeBlock (CollapsibleCode manages height via its 120px maxHeight). Keep `showLineNumbers` and `border-0`. Note: homepage preview does NOT use `showLineNumbers` inside CollapsibleCode, but leaderboard intentionally keeps them for the detailed view.
- When not using `CollapsibleCode`: keep `h-[120px]` on CodeBlock as a max display constraint. Keep `showLineNumbers`.
- Add "view →" link to `/roast/{entry.id}` as a separate element inside the meta row's right-side `<div>`, after language and line count spans. Style: `text-accent-green hover:text-accent-green/80 transition-colors` (same as homepage).

### `src/app/_components/leaderboard-stats.tsx`

Client component (`"use client"`) that:
- Uses `useTRPC()` from `@/trpc/client` + `useQuery` from `@tanstack/react-query`
- Calls `trpc.leaderboard.stats.queryOptions()` to get `{ total, avgScore }`
- Implements NumberFlow animation pattern: `useState({ total: 0, avgScore: 0 })` + `useEffect` to trigger 0→N animation
- NumberFlow format props:
  - `total`: `format={{ useGrouping: true }}`
  - `avgScore`: `format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}` with `suffix="/10"`
- Renders: `<NumberFlow value={total} /> submissions · avg score: <NumberFlow value={avgScore} suffix="/10" />`
- Same visual styling as the current stats row: `font-mono text-xs text-text-tertiary`
- Export pattern: `export { LeaderboardStats }` (named export at bottom, matching codebase convention)

## Score Color Logic

Shared between homepage and leaderboard:

```typescript
function scoreColor(score: number) {
  if (score <= 3) return "text-accent-red";
  if (score <= 6) return "text-accent-amber";
  return "text-accent-green";
}
```

Currently duplicated inline in both pages. Acceptable for now — two usages don't warrant extraction.

## Constraints

- 20 entries, no pagination
- Locale always explicit: `toLocaleString("en-US")` where used
- Named exports only for components (page uses default export per Next.js convention)
- No Suspense around NumberFlow components (NumberFlow handles its own loading state)

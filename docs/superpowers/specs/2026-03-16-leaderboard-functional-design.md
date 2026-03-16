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
- Call `getLeaderboard(20)` at the top of the async function
- Call `prefetch(trpc.leaderboard.stats.queryOptions())` for stats
- Wrap content in `HydrateClient`

**Stats row:** Replace hardcoded `{STATS.total.toLocaleString("en-US")} submissions` with `<LeaderboardStats />` client component.

**Entries rendering:**
- Iterate with `entries.map((entry, idx) => ...)` where rank is `idx + 1`
- Score color uses `scoreColor(entry.score)`
- Code rendering: if `entry.lineCount > 5`, wrap `CodeBlock` in `CollapsibleCode`. Otherwise, render `CodeBlock` directly.
- When using `CollapsibleCode`: remove `h-[120px]` from CodeBlock (CollapsibleCode manages height via its 120px maxHeight). Keep `showLineNumbers` and `border-0`.
- When not using `CollapsibleCode`: keep `h-[120px]` on CodeBlock as a max display constraint.
- Add "view →" link to `/roast/{entry.id}` in the meta row's right side, after language and line count.

### `src/app/_components/leaderboard-stats.tsx`

Client component (`"use client"`) that:
- Uses `useTRPC()` from `@/trpc/client` + `useQuery` from `@tanstack/react-query`
- Calls `trpc.leaderboard.stats.queryOptions()` to get `{ total, avgScore }`
- Implements NumberFlow animation pattern: `useState({ total: 0, avgScore: 0 })` + `useEffect` to trigger 0→N animation
- Renders: `<NumberFlow value={total} /> submissions · avg score: <NumberFlow value={avgScore} />/10`
- Same visual styling as the current stats row: `font-mono text-xs text-text-tertiary`

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

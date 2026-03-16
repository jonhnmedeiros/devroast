# Create Roast Feature — AI-Powered Code Analysis

**Date:** 2026-03-16
**Status:** Approved
**Scope:** Replace mock roast generation with Google Gemini AI, connect roast results page to database.

## Goal

Enable the full "create roast" flow: user submits code on the homepage, Gemini AI analyzes it and generates a structured roast (score, issues, suggested fixes), the result is stored in the database, and the user sees the analysis on the roast results page.

## Architecture

Three isolated changes to complete the flow:

```
User pastes code -> CodeInputSection (modify: handle error return)
  -> submitRoast server action (modify: swap mock for AI)
    -> generateRoast (new: Gemini API + Zod validation)
    -> DB insert (existing, no changes)
  -> redirect to /roast/{id}
    -> RoastResultsPage (modify: read from DB instead of static data)
      -> getRoastById (existing, no changes)
```

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/generate-roast.ts` | Create | Gemini AI integration + Zod schema for structured roast output |
| `src/app/actions.ts` | Modify | Replace `generateMockRoast` with `generateRoast` |
| `src/app/roast/[id]/page.tsx` | Modify | Replace static data with `getRoastById(id)` from DB |
| `src/app/_components/code-input-section.tsx` | Modify | Handle `{ error }` return from `submitRoast` |

No changes needed to:
- `src/db/schema.ts` — schema already supports all fields
- `src/db/queries.ts` — `getRoastById` already exists and returns the right shape
- Any UI components — ScoreRing, Badge, AnalysisCard, DiffLine, CodeBlock all ready

## New dependency

- `@google/genai` — Google Gemini SDK (official)
- `zod` already installed (v4.3.6)

## Environment variable

- `GEMINI_API_KEY` — required in `.env`

## Design Details

### Part 1: `src/lib/generate-roast.ts`

Isolated module responsible for calling the Gemini API and returning validated, structured output.

**Zod schema (`roastOutputSchema`):**
```typescript
{
  score: z.number().min(0).max(10),       // 0 = disaster, 10 = perfect
  verdict: z.string(),                     // slug like "needs_serious_help"
  quote: z.string(),                       // sarcastic or polite one-liner
  language: z.string(),                    // detected programming language
  issues: z.array(z.object({
    severity: z.enum(["critical", "warning", "good"]),
    title: z.string(),
    description: z.string(),
  })),
  diffs: z.array(z.object({
    type: z.enum(["added", "removed", "context"]),
    code: z.string(),
  })),
}
```

**Function signature:**
```typescript
async function generateRoast(input: {
  code: string;
  roastMode: boolean;
}): Promise<RoastOutput>
```

**Gemini configuration:**
- Model: `gemini-2.0-flash` (fast, cheap, good for structured text)
- Uses `responseMimeType: "application/json"` + `responseSchema` to force structured JSON output
- Temperature: ~1.0 for roast mode (more creative), ~0.7 for polite mode

**Prompt strategy:**
- System instruction defines the AI's role as a "brutal code reviewer" (roast mode) or "constructive code analyst" (polite mode)
- System instruction specifies the exact output format, verdict options, and scoring rubric
- User message passes the raw code
- Scoring rubric: 0-2 = catastrophic, 3-4 = bad, 5-6 = mediocre, 7-8 = decent, 9-10 = excellent
- Verdicts mapped to score ranges (canonical list from `src/db/seed.ts`): "absolute_disaster", "mass_destruction", "career_ending", "logically_challenged", "security_nightmare", "willfully_negligent", "cpu_arsonist", "needs_serious_help", "barely_functional", "surprisingly_mediocre", "could_be_worse", "almost_acceptable", "decent_attempt", "above_average", "respectable_effort". The AI prompt must include this exact list so verdicts match what the seed uses.
- Issues: 3-6 per roast, mix of severities, specific to the actual code
- Diffs: show the original problematic lines as "removed" + improved version as "added" + surrounding context as "context"

**Error handling:**
- If Gemini API fails (network, rate limit, etc.), throw a descriptive error that the server action can catch
- If Zod validation fails (AI returned unexpected shape), throw with details
- No retries in v1 — keep it simple

### Part 2: `src/app/actions.ts`

**Changes to `submitRoast`:**
- Remove `generateMockRoast` function entirely
- Import `generateRoast` from `@/lib/generate-roast`
- Call `generateRoast({ code, roastMode })` instead of `generateMockRoast(code)`
- The returned `language` comes from the AI (it detects the language from the code)
- `lineCount` stays in `submitRoast`, computed from `code.split("\n").length` before the DB insert (same location as current code, line 13 of actions.ts)
- Convert existing validation `throw`s to `return { error: "..." }` for consistency — all error paths now use the same return pattern instead of mixing throws and returns
- Keep the DB transaction insert (roasts + roastIssues + roastDiffs)
- Wrap the `generateRoast` call in try/catch — if AI fails, return `{ error: "..." }`

**Return type update:**
- Current: `{ id: string }` on success (throws on error)
- New: `{ id: string }` on success, `{ error: string }` on failure (never throws)
- Use discriminated union: check `"error" in result` to distinguish success from failure

**Update to `CodeInputSection`:**
- After `const result = await submitRoast(code, roastMode)`, check `"error" in result`
- If error, don't redirect — set an error state string and display it inline (e.g., below the submit button in `font-mono text-xs text-accent-red`)
- If success, redirect as before (`router.push(\`/roast/${result.id}\`)`)
- Remove the existing try/catch around `submitRoast` since it no longer throws

### Part 3: `src/app/roast/[id]/page.tsx`

**Changes:**
- Remove `ROAST` static constant
- Import `getRoastById` from `@/db/queries`
- Import `notFound` from `next/navigation`
- At the top of the async function: `const roast = await getRoastById(id)`
- If `roast` is `null`, call `notFound()` (renders Next.js 404 page)
- Replace all `ROAST.xxx` references with `roast.xxx`
- Map verdict Badge variant dynamically based on score: score 0-4 = `"critical"`, 4-7 = `"warning"`, 7-10 = `"good"`. Currently hardcoded to `"critical"` — add a `verdictVariant(score)` helper function.
- The data shape from `getRoastById` matches what the page expects:
  - `roast.score`, `roast.verdict`, `roast.quote`, `roast.language`, `roast.lineCount`, `roast.code`
  - `roast.issues` — array with `{ id, severity, title, description, order }`
  - `roast.diffs` — array with `{ id, type, code, order }`
- Import `cacheLife` from `"next/cache"` and add `"use cache"` + `cacheLife("hours")` for caching (roast results are immutable)

## Constraints

- No share functionality in this version
- No retry/regenerate functionality in this version
- Max code input: 10,000 characters (existing validation in server action)
- Gemini API key must be configured in `.env`
- Named exports only for new modules (page uses default export per Next.js convention)

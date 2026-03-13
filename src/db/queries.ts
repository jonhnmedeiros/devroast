import { asc, avg, count, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { roastDiffs, roastIssues, roasts } from "./schema";

export async function getRoastById(id: string) {
	const [roast] = await db
		.select()
		.from(roasts)
		.where(eq(roasts.id, id))
		.limit(1);

	if (!roast) return null;

	const issues = await db
		.select()
		.from(roastIssues)
		.where(eq(roastIssues.roastId, id))
		.orderBy(asc(roastIssues.order));

	const diffs = await db
		.select()
		.from(roastDiffs)
		.where(eq(roastDiffs.roastId, id))
		.orderBy(asc(roastDiffs.order));

	return { ...roast, issues, diffs };
}

export async function getLeaderboard(limit = 50) {
	return db
		.select({
			id: roasts.id,
			code: roasts.code,
			language: roasts.language,
			lineCount: roasts.lineCount,
			score: roasts.score,
		})
		.from(roasts)
		.orderBy(asc(roasts.score), desc(roasts.createdAt))
		.limit(limit);
}

export async function getLeaderboardPreview() {
	return db
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
}

export async function getStats() {
	const [result] = await db
		.select({
			total: count(),
			avgScore: avg(roasts.score),
		})
		.from(roasts);

	if (!result) {
		return { total: 0, avgScore: 0 };
	}

	return {
		total: result.total,
		avgScore: result.avgScore ? Number.parseFloat(result.avgScore) : 0,
	};
}

export async function getRoastForOg(id: string) {
	const [roast] = await db
		.select({
			score: roasts.score,
			verdict: roasts.verdict,
			language: roasts.language,
			lineCount: roasts.lineCount,
			quote: roasts.quote,
		})
		.from(roasts)
		.where(eq(roasts.id, id))
		.limit(1);

	return roast ?? null;
}

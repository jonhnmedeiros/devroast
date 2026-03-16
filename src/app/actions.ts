"use server";

import { db } from "@/db";
import { roastDiffs, roastIssues, roasts } from "@/db/schema";
import { type RoastOutput, generateRoast } from "@/lib/generate-roast";
import { nanoid } from "nanoid";

type RoastResult = { id: string } | { error: string };

export async function submitRoast(
	code: string,
	roastMode: boolean,
): Promise<RoastResult> {
	if (!code.trim()) {
		return { error: "Code cannot be empty" };
	}

	if (code.length > 10000) {
		return { error: "Code is too long (max 10,000 characters)" };
	}

	const lineCount = code.split("\n").length;

	let result: RoastOutput;
	try {
		result = await generateRoast({ code, roastMode });
	} catch (err) {
		console.error("AI generation failed:", err);
		return {
			error:
				err instanceof Error
					? err.message
					: "Failed to analyze code. Please try again.",
		};
	}

	const id = nanoid(12);

	try {
		await db.transaction(async (tx) => {
			await tx.insert(roasts).values({
				id,
				code,
				language: result.language,
				lineCount,
				score: result.score,
				verdict: result.verdict,
				quote: result.quote,
				roastMode,
			});

			await tx.insert(roastIssues).values(
				result.issues.map((issue, i) => ({
					roastId: id,
					severity: issue.severity,
					title: issue.title,
					description: issue.description,
					order: i,
				})),
			);

			await tx.insert(roastDiffs).values(
				result.diffs.map((diff, i) => ({
					roastId: id,
					type: diff.type,
					code: diff.code,
					order: i,
				})),
			);
		});
	} catch (err) {
		console.error("Database insert failed:", err);
		return { error: "Failed to save roast. Please try again." };
	}

	return { id };
}

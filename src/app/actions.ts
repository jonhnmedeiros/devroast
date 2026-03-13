"use server";

import { db } from "@/db";
import { roastDiffs, roastIssues, roasts } from "@/db/schema";
import { nanoid } from "nanoid";

type RoastResult = {
	id: string;
};

// TODO: Replace with real AI-powered roast generation
function generateMockRoast(code: string, roastMode: boolean) {
	const lines = code.split("\n");
	const lineCount = lines.length;

	// Simple heuristic score — shorter/sketchier code scores worse
	const hasVar = code.includes("var ");
	const hasEval = code.includes("eval(");
	const hasConsoleLog = code.includes("console.log");
	const hasTodo = code.includes("TODO");
	const hasSelectStar = code.includes("SELECT *");

	let score = 5.0;
	if (hasVar) score -= 1.0;
	if (hasEval) score -= 2.0;
	if (hasConsoleLog) score -= 0.5;
	if (hasTodo) score -= 0.5;
	if (hasSelectStar) score -= 1.5;
	if (lineCount < 5) score -= 0.5;
	score = Math.max(0.5, Math.min(9.5, score));

	const verdicts = [
		"needs_serious_help",
		"absolute_disaster",
		"logically_challenged",
		"security_nightmare",
		"willfully_negligent",
		"barely_functional",
		"surprisingly_mediocre",
	];
	const verdictIdx = Math.min(
		Math.floor((10 - score) / 1.5),
		verdicts.length - 1,
	);
	const verdict = verdicts[verdictIdx] ?? "needs_serious_help";

	const quotes = roastMode
		? [
				"this code looks like it was written by someone who googled 'how to code' five minutes ago.",
				"I've seen better code written by a cat walking across a keyboard.",
				"congratulations, you've achieved a new low in software engineering.",
				"this is what happens when you copy from Stack Overflow with your eyes closed.",
				"your code is the reason we have code reviews.",
			]
		: [
				"this code has some significant issues that should be addressed.",
				"there are several patterns here that could be improved.",
				"the code works but has notable quality concerns.",
			];
	const quote = quotes[Math.floor(Math.random() * quotes.length)] ?? quotes[0];

	// Detect language (simple heuristic)
	let language = "javascript";
	if (code.includes("def ") || code.includes("import ")) language = "python";
	if (code.includes("SELECT") || code.includes("FROM")) language = "sql";
	if (code.includes("public class") || code.includes("System.out"))
		language = "java";
	if (code.includes(": string") || code.includes(": number"))
		language = "typescript";
	if (code.includes("fn ") || code.includes("let mut")) language = "rust";

	const issues = [
		{
			severity: "critical" as const,
			title: "questionable patterns detected",
			description:
				"the code contains patterns that are widely considered anti-patterns in modern development.",
		},
		{
			severity: "warning" as const,
			title: "could be more idiomatic",
			description:
				"there are more conventional ways to express this logic that would improve readability.",
		},
		{
			severity: "warning" as const,
			title: "missing error handling",
			description:
				"the code assumes the happy path. consider what happens when things go wrong.",
		},
		{
			severity: "good" as const,
			title: "readable structure",
			description:
				"the overall structure is clear and follows a logical flow. that's something.",
		},
	];

	const diffs = [
		{ type: "removed" as const, code: lines[0] ?? "" },
		...(lines.length > 1
			? [{ type: "removed" as const, code: lines[1] ?? "" }]
			: []),
		{ type: "added" as const, code: "// improved version" },
		{ type: "added" as const, code: "// TODO: implement proper fix" },
	];

	return { score, verdict, quote, language, lineCount, issues, diffs };
}

export async function submitRoast(
	code: string,
	roastMode: boolean,
): Promise<RoastResult> {
	if (!code.trim()) {
		throw new Error("Code cannot be empty");
	}

	if (code.length > 10000) {
		throw new Error("Code is too long (max 10,000 characters)");
	}

	const id = nanoid(12);
	const result = generateMockRoast(code, roastMode);

	await db.transaction(async (tx) => {
		await tx.insert(roasts).values({
			id,
			code,
			language: result.language,
			lineCount: result.lineCount,
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

	return { id };
}

import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const roastOutputSchema = z.object({
	score: z.number().min(0).max(10),
	verdict: z.string(),
	quote: z.string(),
	language: z.string(),
	issues: z.array(
		z.object({
			severity: z.enum(["critical", "warning", "good"]),
			title: z.string(),
			description: z.string(),
		}),
	),
	diffs: z.array(
		z.object({
			type: z.enum(["added", "removed", "context"]),
			code: z.string(),
		}),
	),
});

type RoastOutput = z.infer<typeof roastOutputSchema>;

const VERDICTS = [
	"absolute_disaster",
	"mass_destruction",
	"career_ending",
	"needs_serious_help",
	"logically_challenged",
	"security_nightmare",
	"willfully_negligent",
	"cpu_arsonist",
	"barely_functional",
	"surprisingly_mediocre",
	"could_be_worse",
	"almost_acceptable",
	"not_terrible",
	"decent_attempt",
	"respectable_effort",
];

const SYSTEM_INSTRUCTION = `You are a code analysis expert. Analyze the provided code and return a structured JSON response.

## Scoring Rubric (0-10 scale, lower = worse):
- 0-2: Catastrophic code with severe issues
- 3-4: Bad code with multiple problems
- 5-6: Mediocre code with room for improvement
- 7-8: Decent code with minor issues
- 9-10: Excellent, well-written code

## Verdict Selection (pick ONE based on score):
${VERDICTS.map((v, i) => `- Score ${Math.floor(i * 10 / VERDICTS.length)}-${Math.floor((i + 1) * 10 / VERDICTS.length)}: "${v}"`).join("\n")}

## Response Format:
- score: number between 0 and 10 (can be decimal like 3.5)
- verdict: one of the verdicts above matching the score range
- quote: a one-liner comment about the code (see tone below)
- language: detected programming language (javascript, typescript, python, java, sql, go, rust, php, ruby, csharp, or other)
- issues: array of 3-6 specific issues found in the code, each with:
  - severity: "critical" for security/major bugs, "warning" for bad practices, "good" for positive aspects
  - title: short title (lowercase, 3-5 words)
  - description: 1-2 sentence explanation
- diffs: array of suggested code improvements showing:
  - type: "context" for unchanged lines, "removed" for old code, "added" for improved code
  - code: the actual line of code

Always include at least one "good" issue to highlight something positive, even in bad code.`;

const ROAST_MODE_TONE = `
## Tone: ROAST MODE
Be brutally sarcastic, funny, and savage in the quote. Mock the code mercilessly but keep it clever. Examples:
- "this code looks like it was written during a power outage... in 2005."
- "congratulations, you just built the world's most efficient security vulnerability generator."
- "I've seen better code written by a cat walking across a keyboard."`;

const POLITE_MODE_TONE = `
## Tone: CONSTRUCTIVE MODE
Be professional, helpful, and constructive in the quote. Focus on improvement opportunities. Examples:
- "This code has some areas that could benefit from refactoring."
- "There are several patterns here that could be improved for better maintainability."
- "The code works but has notable quality concerns worth addressing."`;

async function generateRoast(input: {
	code: string;
	roastMode: boolean;
}): Promise<RoastOutput> {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error("GEMINI_API_KEY environment variable is not set");
	}

	const ai = new GoogleGenAI({ apiKey });

	const systemInstruction =
		SYSTEM_INSTRUCTION + (input.roastMode ? ROAST_MODE_TONE : POLITE_MODE_TONE);

	const response = await ai.models.generateContent({
		model: "gemini-2.0-flash",
		contents: [
			{
				role: "user",
				parts: [{ text: `Analyze this code:\n\n${input.code}` }],
			},
		],
		config: {
			systemInstruction,
			temperature: input.roastMode ? 1.0 : 0.7,
			responseMimeType: "application/json",
			responseJsonSchema: {
				type: Type.OBJECT,
				properties: {
					score: { type: Type.NUMBER },
					verdict: { type: Type.STRING },
					quote: { type: Type.STRING },
					language: { type: Type.STRING },
					issues: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								severity: { type: Type.STRING },
								title: { type: Type.STRING },
								description: { type: Type.STRING },
							},
							required: ["severity", "title", "description"],
						},
					},
					diffs: {
						type: Type.ARRAY,
						items: {
							type: Type.OBJECT,
							properties: {
								type: { type: Type.STRING },
								code: { type: Type.STRING },
							},
							required: ["type", "code"],
						},
					},
				},
				required: ["score", "verdict", "quote", "language", "issues", "diffs"],
			},
		},
	});

	const text = response.text;
	if (!text) {
		throw new Error("Gemini returned empty response");
	}

	const parsed = JSON.parse(text);
	const validated = roastOutputSchema.parse(parsed);

	return validated;
}

export { generateRoast, type RoastOutput };

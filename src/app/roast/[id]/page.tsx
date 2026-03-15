import { AnalysisCard } from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";
import type { BundledLanguage } from "shiki";

// ---------------------------------------------------------------------------
// Static Data (based on Pencil design - Screen 2)
// ---------------------------------------------------------------------------

const ROAST = {
	score: 3.5,
	verdict: "needs_serious_help",
	quote:
		"this code looks like it was written during a power outage... in 2005.",
	language: "javascript",
	lineCount: 7,
	code: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`,
	issues: [
		{
			id: 1,
			severity: "critical" as const,
			title: "using var instead of const/let",
			description:
				"var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
		},
		{
			id: 2,
			severity: "warning" as const,
			title: "imperative loop pattern",
			description:
				"for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
		},
		{
			id: 3,
			severity: "good" as const,
			title: "clear naming conventions",
			description:
				"calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.",
		},
		{
			id: 4,
			severity: "good" as const,
			title: "single responsibility",
			description:
				"the function does one thing well — calculates a total. no side effects, no mixed concerns, no hidden complexity.",
		},
	],
	diffs: [
		{
			id: 1,
			type: "context" as const,
			code: "function calculateTotal(items) {",
		},
		{ id: 2, type: "removed" as const, code: "  var total = 0;" },
		{
			id: 3,
			type: "removed" as const,
			code: "  for (var i = 0; i < items.length; i++) {",
		},
		{
			id: 4,
			type: "removed" as const,
			code: "    total = total + items[i].price;",
		},
		{ id: 5, type: "removed" as const, code: "  }" },
		{ id: 6, type: "removed" as const, code: "  return total;" },
		{
			id: 7,
			type: "added" as const,
			code: "  return items.reduce((sum, item) => sum + item.price, 0);",
		},
		{ id: 8, type: "context" as const, code: "}" },
	],
};

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function SectionTitle({ prompt, title }: { prompt: string; title: string }) {
	return (
		<div className="flex items-center gap-2">
			<span className="font-mono text-sm font-bold text-accent-green">
				{prompt}
			</span>
			<span className="font-mono text-sm font-bold text-text-primary">
				{title}
			</span>
		</div>
	);
}

function Divider() {
	return <div className="h-px w-full bg-border-primary" />;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function RoastResultsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	await params;

	const roast = ROAST;

	const issueRows: Array<Array<(typeof roast.issues)[number]>> = [];
	for (let i = 0; i < roast.issues.length; i += 2) {
		issueRows.push(roast.issues.slice(i, i + 2));
	}

	return (
		<main className="flex-1 flex flex-col w-full">
			<div className="flex flex-col gap-xl w-full max-w-[1360px] mx-auto px-20 py-10">
				{/* Score Hero */}
				<section className="flex items-center gap-12 w-full">
					<ScoreRing score={roast.score} />

					<div className="flex flex-col gap-4 flex-1">
						<Badge variant="critical" size="lg">
							verdict: {roast.verdict}
						</Badge>

						<p className="font-mono text-xl leading-relaxed text-text-primary">
							{`"${roast.quote}"`}
						</p>

						<div className="flex items-center gap-4 font-mono text-xs text-text-tertiary">
							<span>lang: {roast.language}</span>
							<span>&middot;</span>
							<span>{roast.lineCount} lines</span>
						</div>

						<div className="flex items-center gap-3">
							<Button variant="secondary" size="sm">
								$ share_roast
							</Button>
						</div>
					</div>
				</section>

				<Divider />

				{/* Submitted Code Section */}
				<section className="flex flex-col gap-4">
					<SectionTitle prompt="//" title="your_submission" />
					<CodeBlock
						code={roast.code}
						lang={roast.language as BundledLanguage}
						showLineNumbers
					/>
				</section>

				<Divider />

				{/* Analysis Section */}
				<section className="flex flex-col gap-6">
					<SectionTitle prompt="//" title="detailed_analysis" />

					<div className="flex flex-col gap-5">
						{issueRows.map((row) => (
							<div key={row.map((i) => i.id).join("-")} className="flex gap-5">
								{row.map((issue) => (
									<AnalysisCard.Root key={issue.id} className="flex-1">
										<Badge variant={issue.severity}>{issue.severity}</Badge>
										<AnalysisCard.Title>{issue.title}</AnalysisCard.Title>
										<AnalysisCard.Description>
											{issue.description}
										</AnalysisCard.Description>
									</AnalysisCard.Root>
								))}
							</div>
						))}
					</div>
				</section>

				<Divider />

				{/* Diff Section */}
				<section className="flex flex-col gap-6">
					<SectionTitle prompt="//" title="suggested_fix" />

					<div className="flex flex-col border border-border-primary bg-bg-input overflow-hidden">
						{/* Diff Header */}
						<div className="flex items-center h-10 px-4 border-b border-border-primary">
							<span className="font-mono text-xs font-medium text-text-secondary">
								your_code.ts &rarr; improved_code.ts
							</span>
						</div>

						{/* Diff Body */}
						<div className="flex flex-col py-1">
							{roast.diffs.map((line) => (
								<DiffLine key={line.id} variant={line.type} code={line.code} />
							))}
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}

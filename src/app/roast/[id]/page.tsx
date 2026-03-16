import { AnalysisCard } from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";
import { getRoastById } from "@/db/queries";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import type { BundledLanguage } from "shiki";

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

function verdictVariant(score: number): "critical" | "warning" | "good" {
	if (score < 4) return "critical";
	if (score < 7) return "warning";
	return "good";
}

export default async function RoastResultsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	"use cache";
	cacheLife("hours");

	const { id } = await params;
	const roast = await getRoastById(id);

	if (!roast) {
		notFound();
	}

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
						<Badge variant={verdictVariant(roast.score)} size="lg">
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

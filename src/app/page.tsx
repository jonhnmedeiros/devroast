import { button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { getLeaderboardPreview, getStats } from "@/db/queries";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import type { BundledLanguage } from "shiki";
import { CodeInputSection } from "./_components/code-input-section";
import { CollapsibleCode } from "./_components/collapsible-code";
import { LeaderboardPreviewSkeleton } from "./_components/leaderboard-preview-skeleton";
import { StatsCounter } from "./_components/stats-counter";

function scoreColor(score: number) {
	if (score <= 3) return "text-accent-red";
	if (score <= 6) return "text-accent-amber";
	return "text-accent-green";
}

async function LeaderboardPreview() {
	"use cache";
	cacheLife("hours");

	const [entries, stats] = await Promise.all([
		getLeaderboardPreview(),
		getStats(),
	]);

	return (
		<section className="flex flex-col gap-6 w-full max-w-[960px]">
			{/* Header */}
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="font-mono text-sm font-bold text-accent-green">
							{"//"}
						</span>
						<span className="font-mono text-sm font-bold text-text-primary">
							shame_leaderboard
						</span>
					</div>
					<a
						href="/leaderboard"
						className={button({ variant: "ghost", size: "xs" })}
					>
						{"$ view_all >>"}
					</a>
				</div>
				<p className="font-mono text-[13px] text-text-tertiary">
					{"// the worst code on the internet, ranked by shame"}
				</p>
			</div>

			{/* Table */}
			<div className="flex flex-col border border-border-primary">
				{/* Table Header */}
				<div className="flex items-center h-10 px-5 bg-bg-surface border-b border-border-primary font-mono text-xs font-medium text-text-tertiary">
					<span className="w-[50px]">#</span>
					<span className="w-[70px]">score</span>
					<span className="flex-1">code</span>
					<span className="w-[100px]">lang</span>
				</div>

				{/* Rows */}
				{entries.map((row, idx) => {
					const lineCount = row.code.split("\n").length;
					const needsCollapsible = lineCount > 5;

					return (
						<div
							key={row.id}
							className={`flex items-start px-5 py-4 font-mono text-xs ${
								idx < entries.length - 1 ? "border-b border-border-primary" : ""
							}`}
						>
							<span
								className={`w-[50px] shrink-0 pt-2 ${
									idx === 0 ? "text-accent-amber" : "text-text-secondary"
								}`}
							>
								{idx + 1}
							</span>
							<span
								className={`w-[70px] shrink-0 pt-2 font-bold ${scoreColor(row.score)}`}
							>
								{row.score.toFixed(1)}
							</span>
							<div className="flex-1 min-w-0">
								{needsCollapsible ? (
									<CollapsibleCode>
										<CodeBlock
											code={row.code}
											lang={row.language as BundledLanguage}
											className="border-0"
										/>
									</CollapsibleCode>
								) : (
									<CodeBlock
										code={row.code}
										lang={row.language as BundledLanguage}
										className="border-0"
									/>
								)}
							</div>
							<div className="w-[100px] shrink-0 flex flex-col gap-1.5 pt-2">
								<span className="text-text-secondary">{row.language}</span>
								<a
									href={`/roast/${row.id}`}
									className="text-accent-green hover:text-accent-green/80 transition-colors"
								>
									view &rarr;
								</a>
							</div>
						</div>
					);
				})}
			</div>

			{/* Fade Hint */}
			<p className="text-center font-mono text-xs text-text-tertiary">
				showing top 3 of {stats.total.toLocaleString("en-US")} &middot; view
				full leaderboard &gt;&gt;
			</p>
		</section>
	);
}

export default async function HomePage() {
	prefetch(trpc.leaderboard.stats.queryOptions());

	return (
		<HydrateClient>
			<main className="flex-1 flex flex-col items-center gap-8 w-full max-w-[1360px] mx-auto px-10 pt-20 pb-[60px]">
				{/* Hero */}
				<div className="flex flex-col items-center gap-3">
					<div className="flex items-center gap-3">
						<span className="font-mono text-[36px] font-bold text-accent-green">
							$
						</span>
						<h1 className="font-mono text-[36px] font-bold text-text-primary">
							paste your code. get roasted.
						</h1>
					</div>
					<p className="font-mono text-sm text-text-secondary">
						{
							"// drop your code below and we'll rate it — brutally honest or full roast mode"
						}
					</p>
				</div>

				{/* Client-side code input + roast mode toggle */}
				<CodeInputSection />

				{/* Footer Stats */}
				<StatsCounter />

				{/* Spacer */}
				<div className="h-[60px]" />

				{/* Leaderboard Preview */}
				<Suspense fallback={<LeaderboardPreviewSkeleton />}>
					<LeaderboardPreview />
				</Suspense>
			</main>
		</HydrateClient>
	);
}

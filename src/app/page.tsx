import { button } from "@/components/ui/button";
import { getLeaderboardPreview, getStats } from "@/db/queries";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { CodeInputSection } from "./_components/code-input-section";
import { LeaderboardPreviewSkeleton } from "./_components/leaderboard-preview-skeleton";
import { StatsCounter } from "./_components/stats-counter";

function scoreColor(score: number) {
	if (score <= 3) return "text-accent-red";
	if (score <= 6) return "text-accent-amber";
	return "text-accent-green";
}

async function LeaderboardPreview() {
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
					const lines = row.code.split("\n");
					return (
						<a
							key={row.id}
							href={`/roast/${row.id}`}
							className={`flex items-start px-5 py-4 font-mono text-xs hover:bg-bg-surface transition-colors ${
								idx < entries.length - 1 ? "border-b border-border-primary" : ""
							}`}
						>
							<span
								className={`w-[50px] shrink-0 ${
									idx === 0 ? "text-accent-amber" : "text-text-secondary"
								}`}
							>
								{idx + 1}
							</span>
							<span
								className={`w-[70px] shrink-0 font-bold ${scoreColor(row.score)}`}
							>
								{row.score.toFixed(1)}
							</span>
							<div className="flex flex-col gap-0.5 flex-1 min-w-0">
								{lines.map((line) => (
									<span
										key={line}
										className={
											line.trimStart().startsWith("//") ||
											line.trimStart().startsWith("--")
												? "text-text-tertiary"
												: "text-text-primary"
										}
									>
										{line}
									</span>
								))}
							</div>
							<span className="w-[100px] shrink-0 text-text-secondary">
								{row.language}
							</span>
						</a>
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

import { CodeBlock } from "@/components/ui/code-block";
import { getLeaderboard } from "@/db/queries";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";
import type { BundledLanguage } from "shiki";
import { CollapsibleCode } from "../_components/collapsible-code";
import { LeaderboardStats } from "../_components/leaderboard-stats";

function scoreColor(score: number) {
	if (score <= 3) return "text-accent-red";
	if (score <= 6) return "text-accent-amber";
	return "text-accent-green";
}

async function LeaderboardEntries() {
	const entries = await getLeaderboard(20);

	return (
		<section className="flex flex-col gap-5">
			{entries.map((entry, idx) => {
				const needsCollapsible = entry.lineCount > 5;

				return (
					<article
						key={entry.id}
						className="flex flex-col border border-border-primary overflow-hidden"
					>
						{/* Meta Row */}
						<div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
							{/* Left: Rank + Score */}
							<div className="flex items-center gap-4">
								{/* Rank */}
								<div className="flex items-center gap-1.5 font-mono">
									<span className="text-[13px] text-text-tertiary">#</span>
									<span className="text-sm font-bold text-accent-amber">
										{idx + 1}
									</span>
								</div>

								{/* Score */}
								<div className="flex items-center gap-1.5 font-mono">
									<span className="text-xs text-text-tertiary">score</span>
									<span
										className={`text-sm font-bold ${scoreColor(entry.score)}`}
									>
										{entry.score.toFixed(1)}
									</span>
								</div>
							</div>

							{/* Right: Language + Lines + View Link */}
							<div className="flex items-center gap-3 font-mono text-xs">
								<span className="text-text-secondary">{entry.language}</span>
								<span className="text-text-tertiary">
									{entry.lineCount} line
									{entry.lineCount !== 1 ? "s" : ""}
								</span>
								<a
									href={`/roast/${entry.id}`}
									className="text-accent-green hover:text-accent-green/80 transition-colors"
								>
									view &rarr;
								</a>
							</div>
						</div>

						{/* Code Block */}
						{needsCollapsible ? (
							<CollapsibleCode>
								<CodeBlock
									code={entry.code}
									lang={entry.language as BundledLanguage}
									showLineNumbers
									className="border-0"
								/>
							</CollapsibleCode>
						) : (
							<CodeBlock
								code={entry.code}
								lang={entry.language as BundledLanguage}
								showLineNumbers
								className="border-0 max-h-[120px]"
							/>
						)}
					</article>
				);
			})}
		</section>
	);
}

function LeaderboardEntriesSkeleton() {
	return (
		<section className="flex flex-col gap-5">
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={`skeleton-${
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
						i
					}`}
					className="flex flex-col border border-border-primary overflow-hidden"
				>
					<div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
						<div className="h-4 w-32 bg-bg-surface animate-pulse" />
						<div className="h-4 w-24 bg-bg-surface animate-pulse" />
					</div>
					<div className="h-[120px] bg-bg-input animate-pulse" />
				</div>
			))}
		</section>
	);
}

export default async function LeaderboardPage() {
	prefetch(trpc.leaderboard.stats.queryOptions());

	return (
		<HydrateClient>
			<main className="flex-1 flex flex-col w-full">
				{/* Main Content */}
				<div className="flex flex-col gap-10 w-full max-w-[1360px] mx-auto px-20 py-10">
					{/* Hero Section */}
					<section className="flex flex-col gap-4">
						{/* Title Row */}
						<div className="flex items-center gap-3">
							<span className="font-mono text-[32px] font-bold text-accent-green">
								{">"}
							</span>
							<h1 className="font-mono text-[28px] font-bold text-text-primary">
								shame_leaderboard
							</h1>
						</div>

						{/* Subtitle */}
						<p className="font-mono text-sm text-text-secondary">
							{"// the most roasted code on the internet"}
						</p>

						{/* Stats Row — animated via tRPC + NumberFlow */}
						<LeaderboardStats />
					</section>

					{/* Leaderboard Entries */}
					<Suspense fallback={<LeaderboardEntriesSkeleton />}>
						<LeaderboardEntries />
					</Suspense>
				</div>
			</main>
		</HydrateClient>
	);
}

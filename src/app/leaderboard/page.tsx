import { CodeBlock } from "@/components/ui/code-block";
import { getLeaderboard, getStats } from "@/db/queries";
import type { BundledLanguage } from "shiki";

function scoreColor(score: number) {
	if (score <= 3) return "text-accent-red";
	if (score <= 6) return "text-accent-amber";
	return "text-accent-green";
}

export default async function LeaderboardPage() {
	const [entries, stats] = await Promise.all([getLeaderboard(), getStats()]);

	return (
		<main className="flex-1 flex flex-col gap-10 w-full max-w-[1360px] mx-auto px-10 py-10">
			{/* Hero Section */}
			<section className="flex flex-col gap-4">
				<div className="flex items-center gap-3">
					<span className="font-mono text-[28px] font-bold text-accent-green">
						{">"}
					</span>
					<h1 className="font-mono text-[28px] font-bold text-text-primary">
						shame_leaderboard
					</h1>
				</div>

				<p className="font-mono text-sm text-text-secondary">
					{"// the most roasted code on the internet"}
				</p>

				<div className="flex items-center gap-2 font-mono text-xs text-text-tertiary">
					<span>
						{stats.total.toLocaleString()} submission
						{stats.total !== 1 ? "s" : ""}
					</span>
					<span>&middot;</span>
					<span>avg score: {stats.avgScore.toFixed(1)}/10</span>
				</div>
			</section>

			{/* Leaderboard Entries */}
			<section className="flex flex-col gap-5">
				{entries.map((entry, idx) => (
					<a
						key={entry.id}
						href={`/roast/${entry.id}`}
						className="flex flex-col border border-border-primary overflow-hidden hover:border-border-focus transition-colors"
					>
						{/* Meta Row */}
						<div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-1.5 font-mono">
									<span className="text-[13px] text-text-tertiary">#</span>
									<span className="text-sm font-bold text-accent-amber">
										{idx + 1}
									</span>
								</div>
								<div className="flex items-center gap-1.5 font-mono">
									<span className="text-xs text-text-tertiary">score:</span>
									<span
										className={`text-sm font-bold ${scoreColor(entry.score)}`}
									>
										{entry.score.toFixed(1)}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3 font-mono text-xs">
								<span className="text-text-secondary">{entry.language}</span>
								<span className="text-text-tertiary">
									{entry.lineCount} lines
								</span>
							</div>
						</div>

						{/* Code Block */}
						<CodeBlock
							code={entry.code}
							lang={entry.language as BundledLanguage}
							className="border-0"
						/>
					</a>
				))}
			</section>
		</main>
	);
}

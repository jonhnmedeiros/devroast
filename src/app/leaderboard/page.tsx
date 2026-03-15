import { CodeBlock } from "@/components/ui/code-block";
import type { BundledLanguage } from "shiki";

// ---------------------------------------------------------------------------
// Static Data (based on Pencil design)
// ---------------------------------------------------------------------------

const LEADERBOARD_ENTRIES = [
	{
		id: "1",
		rank: 1,
		score: 1.2,
		language: "javascript",
		code: `eval(prompt("enter code"))
document.write(response)
// trust the user lol`,
	},
	{
		id: "2",
		rank: 2,
		score: 1.8,
		language: "typescript",
		code: `if (x == true) { return true; }
else if (x == false) { return false; }
else { return !false; }`,
	},
	{
		id: "3",
		rank: 3,
		score: 2.1,
		language: "sql",
		code: `SELECT * FROM users WHERE 1=1
-- TODO: add authentication`,
	},
	{
		id: "4",
		rank: 4,
		score: 2.3,
		language: "java",
		code: `catch (e) {
  // ignore
}`,
	},
	{
		id: "5",
		rank: 5,
		score: 2.5,
		language: "javascript",
		code: `const sleep = (ms) =>
  new Date(Date.now() + ms)
  while(new Date() < end) {}`,
	},
];

const STATS = {
	total: 2847,
	avgScore: 4.2,
};

// ---------------------------------------------------------------------------
// Page Component (SSR)
// ---------------------------------------------------------------------------

export default async function LeaderboardPage() {
	return (
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

					{/* Stats Row */}
					<div className="flex items-center gap-2 font-mono text-xs text-text-tertiary">
						<span>{STATS.total.toLocaleString("en-US")} submissions</span>
						<span>·</span>
						<span>avg score: {STATS.avgScore.toFixed(1)}/10</span>
					</div>
				</section>

				{/* Leaderboard Entries */}
				<section className="flex flex-col gap-5">
					{LEADERBOARD_ENTRIES.map((entry) => {
						const lineCount = entry.code.split("\n").length;

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
												{entry.rank}
											</span>
										</div>

										{/* Score */}
										<div className="flex items-center gap-1.5 font-mono">
											<span className="text-xs text-text-tertiary">score</span>
											<span className="text-sm font-bold text-accent-red">
												{entry.score.toFixed(1)}
											</span>
										</div>
									</div>

									{/* Right: Language + Lines */}
									<div className="flex items-center gap-3 font-mono text-xs">
										<span className="text-text-secondary">
											{entry.language}
										</span>
										<span className="text-text-tertiary">
											{lineCount} line{lineCount !== 1 ? "s" : ""}
										</span>
									</div>
								</div>

								{/* Code Block */}
								<CodeBlock
									code={entry.code}
									lang={entry.language as BundledLanguage}
									showLineNumbers
									className="border-0 h-[120px]"
								/>
							</article>
						);
					})}
				</section>
			</div>
		</main>
	);
}

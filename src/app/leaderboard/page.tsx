import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { twMerge } from "tailwind-merge";

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
// Helper Components
// ---------------------------------------------------------------------------

type LeaderboardCodeBlockProps = {
	code: string;
	lang: BundledLanguage;
	className?: string;
};

async function LeaderboardCodeBlock({
	code,
	lang,
	className,
}: LeaderboardCodeBlockProps) {
	const html = await codeToHtml(code, {
		lang,
		theme: "vesper",
	});

	const lines = code.split("\n");
	const lineCount = lines.length;

	return (
		<div
			className={twMerge(
				"flex overflow-hidden bg-bg-input border border-border-primary h-[120px]",
				className,
			)}
		>
			{/* Line Numbers */}
			<div className="flex flex-col items-end gap-1.5 bg-bg-surface py-3.5 px-2.5 border-r border-border-primary w-10 shrink-0">
				{Array.from({ length: lineCount }, (_, i) => (
					<span
						key={`ln-${i + 1}`}
						className="font-mono text-xs leading-tight text-text-tertiary"
					>
						{i + 1}
					</span>
				))}
			</div>

			{/* Code Content */}
			<div
				className="flex-1 overflow-auto py-3.5 px-4 [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-tight [&_code]:font-mono [&_code]:text-xs"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates trusted HTML server-side
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</div>
	);
}

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
						<span>{STATS.total.toLocaleString()} submissions</span>
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
								<LeaderboardCodeBlock
									code={entry.code}
									lang={entry.language as BundledLanguage}
									className="border-0 border-t-0"
								/>
							</article>
						);
					})}
				</section>
			</div>
		</main>
	);
}

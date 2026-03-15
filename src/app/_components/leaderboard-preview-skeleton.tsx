import { button } from "@/components/ui/button";

function SkeletonBar({ className }: { className?: string }) {
	return (
		<span
			className={`inline-block bg-border-primary rounded animate-pulse ${className}`}
		/>
	);
}

function LeaderboardPreviewSkeleton() {
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
					<span
						aria-hidden
						className={button({ variant: "ghost", size: "xs" })}
					>
						<span className="invisible">{"$ view_all >>"}</span>
					</span>
				</div>
				<SkeletonBar className="w-80 h-4" />
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

				{/* Skeleton Rows */}
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className={`flex items-start px-5 py-4 ${i < 3 ? "border-b border-border-primary" : ""}`}
					>
						{/* Rank */}
						<div className="w-[50px] shrink-0">
							<SkeletonBar className="w-4 h-4" />
						</div>
						{/* Score */}
						<div className="w-[70px] shrink-0">
							<SkeletonBar className="w-8 h-4" />
						</div>
						{/* Code lines */}
						<div className="flex flex-col gap-1.5 flex-1 min-w-0">
							<SkeletonBar className="w-3/4 h-3.5" />
							<SkeletonBar className="w-1/2 h-3.5" />
						</div>
						{/* Language */}
						<div className="w-[100px] shrink-0">
							<SkeletonBar className="w-16 h-4" />
						</div>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="flex justify-center">
				<SkeletonBar className="w-64 h-4" />
			</div>
		</section>
	);
}

export { LeaderboardPreviewSkeleton };

function SkeletonBar({ className }: { className?: string }) {
	return (
		<span
			className={`inline-block bg-border-primary rounded animate-pulse ${className}`}
		/>
	);
}

export default function LeaderboardLoading() {
	return (
		<main className="flex-1 flex flex-col w-full">
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

					{/* Stats Row skeleton */}
					<div className="flex items-center gap-2">
						<SkeletonBar className="w-24 h-4" />
						<SkeletonBar className="w-32 h-4" />
					</div>
				</section>

				{/* Leaderboard Entries Skeleton */}
				<section className="flex flex-col gap-5">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={`skeleton-${
								// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
								i
							}`}
							className="flex flex-col border border-border-primary overflow-hidden"
						>
							{/* Meta Row */}
							<div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
								<div className="flex items-center gap-4">
									<SkeletonBar className="w-8 h-4" />
									<SkeletonBar className="w-12 h-4" />
								</div>
								<div className="flex items-center gap-3">
									<SkeletonBar className="w-16 h-3.5" />
									<SkeletonBar className="w-12 h-3.5" />
									<SkeletonBar className="w-10 h-3.5" />
								</div>
							</div>

							{/* Code Block skeleton */}
							<div className="flex flex-col gap-1.5 p-4 bg-bg-input">
								<SkeletonBar className="w-3/4 h-3.5" />
								<SkeletonBar className="w-1/2 h-3.5" />
								<SkeletonBar className="w-2/3 h-3.5" />
							</div>
						</div>
					))}
				</section>
			</div>
		</main>
	);
}

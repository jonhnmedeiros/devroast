"use client";

import { useTRPC } from "@/trpc/client";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";

export function StatsCounter() {
	const trpc = useTRPC();
	const { data } = useQuery(trpc.leaderboard.stats.queryOptions());

	const total = data?.total ?? 0;
	const avgScore = data?.avgScore ?? 0;

	return (
		<div className="flex items-center justify-center gap-6 font-mono text-xs text-text-tertiary">
			<span className="flex items-center gap-1">
				<NumberFlow value={total} format={{ useGrouping: true }} />
				<span>codes roasted</span>
			</span>
			<span>&middot;</span>
			<span className="flex items-center gap-1">
				<span>avg score:</span>
				<NumberFlow
					value={avgScore}
					format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
					suffix="/10"
				/>
			</span>
		</div>
	);
}

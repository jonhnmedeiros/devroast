"use client";

import { useTRPC } from "@/trpc/client";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function LeaderboardStats() {
	const trpc = useTRPC();
	const { data } = useQuery(trpc.leaderboard.stats.queryOptions());

	const [animated, setAnimated] = useState({ total: 0, avgScore: 0 });

	useEffect(() => {
		if (data) {
			setAnimated({ total: data.total, avgScore: data.avgScore });
		}
	}, [data]);

	return (
		<div className="flex items-center gap-2 font-mono text-xs text-text-tertiary">
			<span className="flex items-center gap-1">
				<NumberFlow value={animated.total} format={{ useGrouping: true }} />
				<span>submissions</span>
			</span>
			<span>&middot;</span>
			<span className="flex items-center gap-1">
				<span>avg score:</span>
				<NumberFlow
					value={animated.avgScore}
					format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
					suffix="/10"
				/>
			</span>
		</div>
	);
}

export { LeaderboardStats };

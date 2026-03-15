import { roasts } from "@/db/schema";
import { avg, count } from "drizzle-orm";
import { baseProcedure, createTRPCRouter } from "../init";

export const leaderboardRouter = createTRPCRouter({
	stats: baseProcedure.query(async ({ ctx }) => {
		const [result] = await ctx.db
			.select({
				total: count(),
				avgScore: avg(roasts.score),
			})
			.from(roasts);

		if (!result) return { total: 0, avgScore: 0 };

		return {
			total: result.total,
			avgScore: result.avgScore ? Number.parseFloat(result.avgScore) : 0,
		};
	}),
});

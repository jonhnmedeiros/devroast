import { db } from "@/db";
import { initTRPC } from "@trpc/server";
import { cache } from "react";

export const createTRPCContext = cache(async () => {
	return { db };
});

const t = initTRPC
	.context<Awaited<ReturnType<typeof createTRPCContext>>>()
	.create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

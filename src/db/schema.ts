import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const severityEnum = pgEnum("severity", ["critical", "warning", "good"]);

export const diffTypeEnum = pgEnum("diff_type", [
	"added",
	"removed",
	"context",
]);

export const roasts = pgTable(
	"roasts",
	{
		id: text().primaryKey(),
		code: text().notNull(),
		language: text().notNull(),
		lineCount: integer().notNull(),
		score: real().notNull(),
		verdict: text().notNull(),
		quote: text().notNull(),
		roastMode: boolean().notNull().default(true),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("roasts_score_idx").on(t.score)],
);

export const roastIssues = pgTable("roast_issues", {
	id: serial().primaryKey(),
	roastId: text()
		.notNull()
		.references(() => roasts.id, { onDelete: "cascade" }),
	severity: severityEnum().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	order: integer().notNull().default(0),
});

export const roastDiffs = pgTable("roast_diffs", {
	id: serial().primaryKey(),
	roastId: text()
		.notNull()
		.references(() => roasts.id, { onDelete: "cascade" }),
	type: diffTypeEnum().notNull(),
	code: text().notNull(),
	order: integer().notNull().default(0),
});

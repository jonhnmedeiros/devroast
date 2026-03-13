import { getRoastForOg } from "@/db/queries";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const id = searchParams.get("id");

	let score: string;
	let verdict: string;
	let lang: string;
	let lines: string;
	let quote: string;

	if (id) {
		const roast = await getRoastForOg(id);
		if (!roast) {
			return new Response("Roast not found", { status: 404 });
		}
		score = roast.score.toString();
		verdict = roast.verdict;
		lang = roast.language;
		lines = roast.lineCount.toString();
		quote = roast.quote;
	} else {
		score = searchParams.get("score") ?? "3.5";
		verdict = searchParams.get("verdict") ?? "needs_serious_help";
		lang = searchParams.get("lang") ?? "javascript";
		lines = searchParams.get("lines") ?? "7";
		quote =
			searchParams.get("quote") ??
			"this code was written during a power outage...";
	}

	const scoreNum = Number.parseFloat(score);
	const scoreColor =
		scoreNum <= 3 ? "#ef4444" : scoreNum <= 6 ? "#f59e0b" : "#10b981";
	const verdictColor = scoreColor;

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 28,
				padding: 64,
				backgroundColor: "#0a0a0a",
				border: "1px solid #2a2a2a",
				fontFamily: "monospace",
			}}
		>
			{/* Logo */}
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<span style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>
					{">"}
				</span>
				<span style={{ fontSize: 20, fontWeight: 500, color: "#fafafa" }}>
					devroast
				</span>
			</div>

			{/* Score */}
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: 4,
				}}
			>
				<span
					style={{
						fontSize: 160,
						fontWeight: 900,
						color: scoreColor,
						lineHeight: 1,
					}}
				>
					{score}
				</span>
				<span
					style={{
						fontSize: 56,
						fontWeight: 400,
						color: "#4b5563",
						lineHeight: 1,
					}}
				>
					/10
				</span>
			</div>

			{/* Verdict */}
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<div
					style={{
						width: 12,
						height: 12,
						borderRadius: "50%",
						backgroundColor: verdictColor,
					}}
				/>
				<span style={{ fontSize: 20, color: verdictColor }}>{verdict}</span>
			</div>

			{/* Lang Info */}
			<span style={{ fontSize: 16, color: "#4b5563" }}>
				lang: {lang} &middot; {lines} lines
			</span>

			{/* Quote */}
			<span
				style={{
					fontSize: 22,
					color: "#fafafa",
					textAlign: "center",
					lineHeight: 1.5,
					maxWidth: "90%",
				}}
			>
				&ldquo;{quote}&rdquo;
			</span>
		</div>,
		{
			width: 1200,
			height: 630,
		},
	);
}

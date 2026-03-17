import { getRoastForOg } from "@/db/queries";
import { ImageResponse } from "@takumi-rs/image-response";
import type { NextRequest } from "next/server";

function getScoreColor(score: number): string {
	if (score < 4) return "#ef4444";
	if (score < 7) return "#f59e0b";
	return "#10b981";
}

function truncateQuote(quote: string, maxLength = 120): string {
	if (quote.length <= maxLength) return quote;
	return `${quote.slice(0, maxLength - 3)}...`;
}

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const id = searchParams.get("id");

	if (!id) {
		return new Response("Missing id parameter", { status: 400 });
	}

	const roast = await getRoastForOg(id);

	if (!roast) {
		return new Response("Roast not found", { status: 404 });
	}

	const scoreColor = getScoreColor(roast.score);
	const quote = truncateQuote(roast.quote);

	return new ImageResponse(
		<div tw="flex flex-col items-center justify-center w-full h-full bg-[#0a0a0a] p-16 gap-7">
			{/* Logo */}
			<div tw="flex items-center gap-2">
				<span tw="text-2xl font-bold text-[#10b981]">{">"}</span>
				<span tw="text-xl font-medium text-white">devroast</span>
			</div>

			{/* Score */}
			<div tw="flex items-baseline gap-1">
				<span
					tw="text-[160px] font-black leading-none"
					style={{ color: scoreColor }}
				>
					{roast.score.toFixed(1)}
				</span>
				<span tw="text-6xl text-gray-600 leading-none">/10</span>
			</div>

			{/* Verdict */}
			<div tw="flex items-center gap-2">
				<div
					tw="w-3 h-3 rounded-full"
					style={{ backgroundColor: scoreColor }}
				/>
				<span tw="text-xl" style={{ color: scoreColor }}>
					{roast.verdict}
				</span>
			</div>

			{/* Lang info */}
			<span tw="text-base text-gray-600">
				lang: {roast.language} · {roast.lineCount} lines
			</span>

			{/* Quote */}
			<span tw="text-2xl text-white text-center leading-relaxed max-w-[90%]">
				"{quote}"
			</span>
		</div>,
		{
			width: 1200,
			height: 630,
			format: "png",
			headers: {
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		},
	);
}

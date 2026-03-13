import { type ComponentProps, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type ScoreRingProps = ComponentProps<"div"> & {
	score: number;
	maxScore?: number;
};

const SIZE = 180;
const RADIUS = (SIZE - 8) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ScoreRing = forwardRef<HTMLDivElement, ScoreRingProps>(
	({ className, score, maxScore = 10, ...props }, ref) => {
		const percentage = Math.min(score / maxScore, 1);
		const strokeDashoffset = CIRCUMFERENCE * (1 - percentage);

		const scoreColor =
			score <= 3
				? "var(--color-accent-red)"
				: score <= 6
					? "var(--color-accent-amber)"
					: "var(--color-accent-green)";

		const scoreTextClass =
			score <= 3
				? "text-accent-red"
				: score <= 6
					? "text-accent-amber"
					: "text-accent-green";

		return (
			<div
				ref={ref}
				className={twMerge(
					"relative inline-flex items-center justify-center",
					className,
				)}
				style={{ width: SIZE, height: SIZE }}
				{...props}
			>
				<svg
					width={SIZE}
					height={SIZE}
					viewBox={`0 0 ${SIZE} ${SIZE}`}
					className="absolute inset-0"
				>
					<title>Score ring</title>
					{/* Background ring */}
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						stroke="var(--color-border-primary)"
						strokeWidth={4}
					/>

					{/* Score arc */}
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						stroke={scoreColor}
						strokeWidth={4}
						strokeLinecap="round"
						strokeDasharray={CIRCUMFERENCE}
						strokeDashoffset={strokeDashoffset}
						transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
						className="transition-[stroke-dashoffset] duration-700 ease-out"
					/>
				</svg>

				{/* Center text */}
				<div className="flex items-center gap-0.5 font-mono">
					<span
						className={twMerge(
							"text-5xl font-bold leading-none",
							scoreTextClass,
						)}
					>
						{score.toFixed(1)}
					</span>
					<span className="text-base leading-none text-text-tertiary">
						/{maxScore}
					</span>
				</div>
			</div>
		);
	},
);

ScoreRing.displayName = "ScoreRing";

export { ScoreRing, type ScoreRingProps };

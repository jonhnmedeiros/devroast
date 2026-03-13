import { type ComponentProps, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type LeaderboardRowRootProps = ComponentProps<"div"> & {
	header?: boolean;
};

const LeaderboardRowRoot = forwardRef<HTMLDivElement, LeaderboardRowRootProps>(
	({ className, header, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={twMerge(
					"flex items-center gap-6 px-5 py-4 font-mono border-b border-border-primary",
					header && "bg-bg-surface h-10 py-0",
					className,
				)}
				{...props}
			/>
		);
	},
);

LeaderboardRowRoot.displayName = "LeaderboardRow.Root";

type LeaderboardRowRankProps = ComponentProps<"span">;

const LeaderboardRowRank = forwardRef<HTMLSpanElement, LeaderboardRowRankProps>(
	({ className, ...props }, ref) => {
		return (
			<span
				ref={ref}
				className={twMerge(
					"w-10 text-[13px] text-text-tertiary shrink-0",
					className,
				)}
				{...props}
			/>
		);
	},
);

LeaderboardRowRank.displayName = "LeaderboardRow.Rank";

type LeaderboardRowScoreProps = ComponentProps<"span"> & {
	value: number;
};

const LeaderboardRowScore = forwardRef<
	HTMLSpanElement,
	LeaderboardRowScoreProps
>(({ className, value, children, ...props }, ref) => {
	const scoreColor =
		value <= 3
			? "text-accent-red"
			: value <= 6
				? "text-accent-amber"
				: "text-accent-green";

	return (
		<span
			ref={ref}
			className={twMerge(
				"w-15 text-[13px] font-bold shrink-0",
				scoreColor,
				className,
			)}
			{...props}
		>
			{children ?? value.toFixed(1)}
		</span>
	);
});

LeaderboardRowScore.displayName = "LeaderboardRow.Score";

type LeaderboardRowCodeProps = ComponentProps<"span">;

const LeaderboardRowCode = forwardRef<HTMLSpanElement, LeaderboardRowCodeProps>(
	({ className, ...props }, ref) => {
		return (
			<span
				ref={ref}
				className={twMerge(
					"flex-1 text-xs text-text-secondary truncate min-w-0",
					className,
				)}
				{...props}
			/>
		);
	},
);

LeaderboardRowCode.displayName = "LeaderboardRow.Code";

type LeaderboardRowLanguageProps = ComponentProps<"span">;

const LeaderboardRowLanguage = forwardRef<
	HTMLSpanElement,
	LeaderboardRowLanguageProps
>(({ className, ...props }, ref) => {
	return (
		<span
			ref={ref}
			className={twMerge(
				"w-25 text-xs text-text-tertiary shrink-0 text-right",
				className,
			)}
			{...props}
		/>
	);
});

LeaderboardRowLanguage.displayName = "LeaderboardRow.Language";

const LeaderboardRow = Object.assign(LeaderboardRowRoot, {
	Root: LeaderboardRowRoot,
	Rank: LeaderboardRowRank,
	Score: LeaderboardRowScore,
	Code: LeaderboardRowCode,
	Language: LeaderboardRowLanguage,
});

export {
	LeaderboardRow,
	LeaderboardRowRoot,
	LeaderboardRowRank,
	LeaderboardRowScore,
	LeaderboardRowCode,
	LeaderboardRowLanguage,
	type LeaderboardRowRootProps,
	type LeaderboardRowRankProps,
	type LeaderboardRowScoreProps,
	type LeaderboardRowCodeProps,
	type LeaderboardRowLanguageProps,
};

import { type ComponentProps, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type AnalysisCardRootProps = ComponentProps<"div">;

const AnalysisCardRoot = forwardRef<HTMLDivElement, AnalysisCardRootProps>(
	({ className, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={twMerge(
					"flex flex-col gap-3 p-5 border border-border-primary",
					className,
				)}
				{...props}
			/>
		);
	},
);

AnalysisCardRoot.displayName = "AnalysisCard.Root";

type AnalysisCardTitleProps = ComponentProps<"p">;

const AnalysisCardTitle = forwardRef<
	HTMLParagraphElement,
	AnalysisCardTitleProps
>(({ className, ...props }, ref) => {
	return (
		<p
			ref={ref}
			className={twMerge("font-mono text-[13px] text-text-primary", className)}
			{...props}
		/>
	);
});

AnalysisCardTitle.displayName = "AnalysisCard.Title";

type AnalysisCardDescriptionProps = ComponentProps<"p">;

const AnalysisCardDescription = forwardRef<
	HTMLParagraphElement,
	AnalysisCardDescriptionProps
>(({ className, ...props }, ref) => {
	return (
		<p
			ref={ref}
			className={twMerge("text-xs leading-6 text-text-secondary", className)}
			{...props}
		/>
	);
});

AnalysisCardDescription.displayName = "AnalysisCard.Description";

const AnalysisCard = Object.assign(AnalysisCardRoot, {
	Root: AnalysisCardRoot,
	Title: AnalysisCardTitle,
	Description: AnalysisCardDescription,
});

export {
	AnalysisCard,
	AnalysisCardRoot,
	AnalysisCardTitle,
	AnalysisCardDescription,
	type AnalysisCardRootProps,
	type AnalysisCardTitleProps,
	type AnalysisCardDescriptionProps,
};

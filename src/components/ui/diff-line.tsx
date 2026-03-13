import { type ComponentProps, forwardRef } from "react";
import { type VariantProps, tv } from "tailwind-variants";

const diffLine = tv({
	base: "flex gap-2 px-4 py-2 font-mono text-[13px]",
	variants: {
		variant: {
			removed: "bg-diff-removed-bg",
			added: "bg-diff-added-bg",
			context: "bg-transparent",
		},
	},
	defaultVariants: {
		variant: "context",
	},
});

type DiffLineVariants = VariantProps<typeof diffLine>;

type DiffLineProps = ComponentProps<"div"> &
	DiffLineVariants & {
		code: string;
	};

const DiffLine = forwardRef<HTMLDivElement, DiffLineProps>(
	({ className, variant, code, ...props }, ref) => {
		const prefix =
			variant === "removed" ? "-" : variant === "added" ? "+" : " ";
		const prefixColor =
			variant === "removed"
				? "text-accent-red"
				: variant === "added"
					? "text-accent-green"
					: "text-text-tertiary";
		const codeColor =
			variant === "removed"
				? "text-text-secondary"
				: variant === "added"
					? "text-text-primary"
					: "text-text-secondary";

		return (
			<div ref={ref} className={diffLine({ variant, className })} {...props}>
				<span className={prefixColor}>{prefix}</span>
				<span className={codeColor}>{code}</span>
			</div>
		);
	},
);

DiffLine.displayName = "DiffLine";

export { DiffLine, diffLine, type DiffLineProps };

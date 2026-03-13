import { type ComponentProps, forwardRef } from "react";
import { type VariantProps, tv } from "tailwind-variants";

const badge = tv({
	base: "inline-flex items-center gap-2 font-mono",
	variants: {
		variant: {
			critical: "text-accent-red",
			warning: "text-accent-amber",
			good: "text-accent-green",
		},
		size: {
			default: "text-xs",
			lg: "text-[13px]",
		},
	},
	defaultVariants: {
		variant: "critical",
		size: "default",
	},
});

type BadgeVariants = VariantProps<typeof badge>;

type BadgeProps = ComponentProps<"span"> & BadgeVariants;

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
	({ className, variant, size, children, ...props }, ref) => {
		return (
			<span
				ref={ref}
				className={badge({ variant, size, className })}
				{...props}
			>
				<span className="inline-block size-2 rounded-full bg-current" />
				{children}
			</span>
		);
	},
);

Badge.displayName = "Badge";

export { Badge, badge, type BadgeProps };

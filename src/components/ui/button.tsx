import { type ComponentProps, forwardRef } from "react";
import { type VariantProps, tv } from "tailwind-variants";

const button = tv({
	base: [
		"inline-flex items-center justify-center",
		"font-mono whitespace-nowrap",
		"transition-colors duration-150",
		"disabled:pointer-events-none disabled:opacity-50",
		"enabled:cursor-pointer",
	],
	variants: {
		variant: {
			primary: [
				"bg-accent-green text-bg-page",
				"font-medium text-[13px]",
				"enabled:hover:bg-accent-green/80",
			],
			secondary: [
				"bg-transparent text-text-primary",
				"border border-border-primary",
				"text-xs font-normal",
				"enabled:hover:bg-text-primary/5",
			],
			ghost: [
				"bg-transparent text-text-secondary",
				"border border-border-primary",
				"text-xs font-normal",
				"enabled:hover:text-text-primary",
			],
		},
		size: {
			default: "px-6 py-2.5",
			sm: "px-4 py-2",
			xs: "px-3 py-1.5",
		},
	},
	defaultVariants: {
		variant: "primary",
		size: "default",
	},
});

type ButtonVariants = VariantProps<typeof button>;

type ButtonProps = ComponentProps<"button"> &
	ButtonVariants & {
		asChild?: boolean;
	};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<button
				ref={ref}
				className={button({ variant, size, className })}
				{...props}
			/>
		);
	},
);

Button.displayName = "Button";

export { Button, button, type ButtonProps };

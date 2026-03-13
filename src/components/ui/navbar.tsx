import { type ComponentProps, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type NavbarRootProps = ComponentProps<"nav">;

const NavbarRoot = forwardRef<HTMLElement, NavbarRootProps>(
	({ className, ...props }, ref) => {
		return (
			<nav
				ref={ref}
				className={twMerge(
					"flex items-center h-14 px-10 bg-bg-page border-b border-border-primary",
					className,
				)}
				{...props}
			/>
		);
	},
);

NavbarRoot.displayName = "Navbar.Root";

type NavbarLogoProps = ComponentProps<"a">;

const NavbarLogo = forwardRef<HTMLAnchorElement, NavbarLogoProps>(
	({ className, ...props }, ref) => {
		return (
			<a
				ref={ref}
				href="/"
				className={twMerge("flex items-center gap-2 font-mono", className)}
				{...props}
			>
				<span className="text-xl font-bold text-accent-green">{">"}</span>
				<span className="text-lg font-medium text-text-primary">devroast</span>
			</a>
		);
	},
);

NavbarLogo.displayName = "Navbar.Logo";

function NavbarSpacer() {
	return <div className="flex-1" />;
}

NavbarSpacer.displayName = "Navbar.Spacer";

type NavbarLinkProps = ComponentProps<"a">;

const NavbarLink = forwardRef<HTMLAnchorElement, NavbarLinkProps>(
	({ className, ...props }, ref) => {
		return (
			<a
				ref={ref}
				className={twMerge(
					"font-mono text-[13px] text-text-secondary hover:text-text-primary transition-colors",
					className,
				)}
				{...props}
			/>
		);
	},
);

NavbarLink.displayName = "Navbar.Link";

const Navbar = Object.assign(NavbarRoot, {
	Root: NavbarRoot,
	Logo: NavbarLogo,
	Spacer: NavbarSpacer,
	Link: NavbarLink,
});

export {
	Navbar,
	NavbarRoot,
	NavbarLogo,
	NavbarSpacer,
	NavbarLink,
	type NavbarRootProps,
	type NavbarLogoProps,
	type NavbarLinkProps,
};

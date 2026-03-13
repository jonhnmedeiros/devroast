"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type SwitchRootProps = ComponentProps<typeof BaseSwitch.Root>;

type SwitchProps = {
	checked?: SwitchRootProps["checked"];
	defaultChecked?: SwitchRootProps["defaultChecked"];
	onCheckedChange?: SwitchRootProps["onCheckedChange"];
	disabled?: SwitchRootProps["disabled"];
	name?: SwitchRootProps["name"];
	label?: string;
	className?: string;
};

function Switch({
	className,
	label,
	checked,
	defaultChecked,
	onCheckedChange,
	disabled,
	name,
}: SwitchProps) {
	return (
		<BaseSwitch.Root
			checked={checked}
			defaultChecked={defaultChecked}
			onCheckedChange={onCheckedChange}
			disabled={disabled}
			name={name}
			aria-label={label}
			className={twMerge(
				"group inline-flex items-center gap-3 font-mono text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
		>
			<span className="inline-flex items-center w-10 h-[22px] rounded-full p-[3px] transition-colors duration-150 bg-border-primary group-data-[checked]:bg-accent-green group-data-[unchecked]:justify-start group-data-[checked]:justify-end">
				<BaseSwitch.Thumb className="size-4 rounded-full transition-colors duration-150 bg-gray-500 group-data-[checked]:bg-bg-page" />
			</span>

			{label && (
				<span className="select-none transition-colors duration-150 text-text-secondary group-data-[checked]:text-accent-green">
					{label}
				</span>
			)}
		</BaseSwitch.Root>
	);
}

Switch.displayName = "Switch";

export { Switch, type SwitchProps };

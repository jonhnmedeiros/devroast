"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";

type CollapsibleCodeProps = {
	children: React.ReactNode;
	defaultExpanded?: boolean;
};

function CollapsibleCode({
	children,
	defaultExpanded = false,
}: CollapsibleCodeProps) {
	return (
		<Collapsible.Root defaultOpen={defaultExpanded}>
			<Collapsible.Panel
				keepMounted
				className="group/panel relative overflow-hidden data-[closed]:max-h-[120px]"
			>
				{children}
				{/* Fade gradient — only visible when collapsed */}
				<div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-bg-input to-transparent pointer-events-none transition-opacity group-data-[open]/panel:opacity-0" />
			</Collapsible.Panel>

			<Collapsible.Trigger className="group/trigger flex items-center gap-1.5 pt-2 font-mono text-xs text-text-tertiary hover:text-text-secondary transition-colors">
				<ChevronDown className="size-3 transition-transform group-data-[panel-open]/trigger:rotate-180" />
				<span className="group-data-[panel-open]/trigger:hidden">
					show more
				</span>
				<span className="hidden group-data-[panel-open]/trigger:inline">
					show less
				</span>
			</Collapsible.Trigger>
		</Collapsible.Root>
	);
}

export { CollapsibleCode, type CollapsibleCodeProps };

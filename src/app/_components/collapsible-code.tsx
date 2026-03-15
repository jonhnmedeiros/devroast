"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type CollapsibleCodeProps = {
	children: React.ReactNode;
	defaultExpanded?: boolean;
};

function CollapsibleCode({
	children,
	defaultExpanded = false,
}: CollapsibleCodeProps) {
	const [expanded, setExpanded] = useState(defaultExpanded);

	return (
		<div>
			<div
				className="relative overflow-hidden"
				style={expanded ? undefined : { maxHeight: 120 }}
			>
				{children}
				{/* Fade gradient — only visible when collapsed */}
				{!expanded && (
					<div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-bg-input to-transparent pointer-events-none" />
				)}
			</div>

			<button
				type="button"
				onClick={() => setExpanded((prev) => !prev)}
				className="flex items-center gap-1.5 pt-2 font-mono text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
			>
				<ChevronDown
					className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`}
				/>
				<span>{expanded ? "show less" : "show more"}</span>
			</button>
		</div>
	);
}

export { CollapsibleCode, type CollapsibleCodeProps };

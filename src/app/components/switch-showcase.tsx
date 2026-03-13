"use client";

import { Switch } from "@/components/ui/switch";
import { useState } from "react";

function SwitchShowcase() {
	const [roastMode, setRoastMode] = useState(true);

	return (
		<div className="flex flex-col gap-sm">
			<span className="font-mono text-xs text-text-tertiary">states</span>
			<div className="flex items-center gap-md flex-wrap">
				<Switch
					checked={roastMode}
					onCheckedChange={setRoastMode}
					label="roast mode"
				/>
				<Switch checked={false} label="roast mode" />
			</div>
		</div>
	);
}

export { SwitchShowcase };

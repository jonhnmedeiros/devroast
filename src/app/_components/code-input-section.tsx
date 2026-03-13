"use client";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitRoast } from "../actions";

const PLACEHOLDER_CODE = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`;

function CodeInputSection() {
	const router = useRouter();
	const [code, setCode] = useState(PLACEHOLDER_CODE);
	const [roastMode, setRoastMode] = useState(true);
	const [isPending, startTransition] = useTransition();

	function handleSubmit() {
		if (!code.trim() || isPending) return;

		startTransition(async () => {
			try {
				const { id } = await submitRoast(code, roastMode);
				router.push(`/roast/${id}`);
			} catch (err) {
				// TODO: show error toast
				console.error("Failed to submit roast:", err);
			}
		});
	}

	return (
		<>
			{/* Code Editor */}
			<CodeEditor value={code} onChange={setCode} />

			{/* Actions Bar */}
			<div className="flex items-center justify-between w-full max-w-[780px]">
				<div className="flex items-center gap-4">
					<Switch
						checked={roastMode}
						onCheckedChange={setRoastMode}
						label="roast mode"
					/>
					<span className="font-mono text-xs text-text-tertiary">
						{"// maximum sarcasm enabled"}
					</span>
				</div>
				<Button
					variant="primary"
					onClick={handleSubmit}
					disabled={isPending || !code.trim()}
				>
					{isPending ? "$ roasting..." : "$ roast_my_code"}
				</Button>
			</div>
		</>
	);
}

export { CodeInputSection };

import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { twMerge } from "tailwind-merge";

type CodeBlockProps = {
	code: string;
	lang: BundledLanguage;
	fileName?: string;
	className?: string;
};

async function CodeBlock({ code, lang, fileName, className }: CodeBlockProps) {
	const html = await codeToHtml(code, {
		lang,
		theme: "vesper",
	});

	return (
		<div
			className={twMerge(
				"flex flex-col overflow-hidden bg-bg-input border border-border-primary",
				className,
			)}
		>
			{/* Window Header */}
			<div className="flex items-center h-10 px-4 border-b border-border-primary gap-3 shrink-0">
				<div className="flex items-center gap-2">
					<span className="size-3 rounded-full bg-red-500" />
					<span className="size-3 rounded-full bg-amber-500" />
					<span className="size-3 rounded-full bg-emerald-500" />
				</div>
				<div className="flex-1" />
				{fileName && (
					<span className="font-mono text-xs text-text-tertiary">
						{fileName}
					</span>
				)}
			</div>

			{/* Code Body — rendered by shiki (trusted server-side HTML) */}
			<div
				className="overflow-x-auto [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed [&_code]:font-mono"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates trusted HTML server-side
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</div>
	);
}

CodeBlock.displayName = "CodeBlock";

export { CodeBlock, type CodeBlockProps };

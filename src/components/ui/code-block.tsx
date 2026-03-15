import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";
import { twMerge } from "tailwind-merge";

type CodeBlockProps = {
	code: string;
	lang: BundledLanguage;
	showLineNumbers?: boolean;
	className?: string;
};

async function CodeBlock({
	code,
	lang,
	showLineNumbers,
	className,
}: CodeBlockProps) {
	const html = await codeToHtml(code, {
		lang,
		theme: "vesper",
	});

	const lineCount = showLineNumbers ? code.split("\n").length : 0;

	return (
		<div
			className={twMerge(
				"flex overflow-hidden bg-bg-input border border-border-primary",
				className,
			)}
		>
			{/* Line Numbers */}
			{showLineNumbers && (
				<div className="flex flex-col items-end py-3.5 px-2.5 border-r border-border-primary shrink-0 bg-bg-surface select-none">
					{Array.from({ length: lineCount }, (_, i) => (
						<span
							key={`ln-${i + 1}`}
							className="font-mono text-xs leading-relaxed text-text-tertiary"
						>
							{i + 1}
						</span>
					))}
				</div>
			)}

			{/* Code Body — rendered by shiki (trusted server-side HTML) */}
			<div
				className={twMerge(
					"flex-1 overflow-x-auto [&_pre]:!bg-transparent [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed [&_code]:font-mono",
					showLineNumbers
						? "[&_pre]:py-3.5 [&_pre]:px-4 [&_pre]:!m-0"
						: "[&_pre]:p-4",
				)}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates trusted HTML server-side
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</div>
	);
}

CodeBlock.displayName = "CodeBlock";

export { CodeBlock, type CodeBlockProps };

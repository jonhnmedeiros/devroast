"use client";

import { Select } from "@base-ui/react/select";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { Check, ChevronDown } from "lucide-react";
import {
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { BundledLanguage, Highlighter } from "shiki";
import { twMerge } from "tailwind-merge";

// ---------------------------------------------------------------------------
// highlight.js — register subset for language detection only
// ---------------------------------------------------------------------------
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("php", php);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);

const LANGUAGE_SUBSET = [
	"javascript",
	"typescript",
	"python",
	"java",
	"go",
	"rust",
	"ruby",
	"php",
	"swift",
	"sql",
	"html",
	"css",
	"bash",
	"c",
	"cpp",
] as const;

const LANGUAGE_LABELS: Record<string, string> = {
	javascript: "JavaScript",
	typescript: "TypeScript",
	python: "Python",
	java: "Java",
	go: "Go",
	rust: "Rust",
	ruby: "Ruby",
	php: "PHP",
	swift: "Swift",
	sql: "SQL",
	html: "HTML",
	css: "CSS",
	bash: "Bash",
	c: "C",
	cpp: "C++",
};

// ---------------------------------------------------------------------------
// Shiki singleton (lazy, client-side only)
// Uses bundle/full to support all 15 languages including go, rust, ruby, swift
// ---------------------------------------------------------------------------
let highlighterPromise: Promise<Highlighter> | null = null;

function getShikiHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = import("shiki/bundle/full").then((mod) =>
			mod.createHighlighter({
				themes: ["vesper"],
				langs: [
					"javascript",
					"typescript",
					"python",
					"java",
					"go",
					"rust",
					"ruby",
					"php",
					"swift",
					"sql",
					"html",
					"css",
					"bash",
					"c",
					"cpp",
				],
			}),
		);
	}
	return highlighterPromise;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Shiki HTML output, updated when code/language change.
 *
 * - Shows plain-text fallback immediately while highlighter loads.
 * - Debounces highlighting during typing (150ms).
 * - Exposes `highlightNow()` to skip debounce (used on paste).
 */
function useHighlightedHtml(code: string, language: string | null) {
	const [html, setHtml] = useState("");
	const [highlighterReady, setHighlighterReady] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

	// Eagerly start loading the highlighter on mount
	useEffect(() => {
		getShikiHighlighter().then(() => setHighlighterReady(true));
	}, []);

	// Generate plain-text fallback HTML (white text so code is visible)
	const makePlainHtml = useCallback(
		(text: string) =>
			`<pre style="background:transparent;margin:0;padding:0"><code style="font-family:inherit;font-size:inherit;line-height:inherit;color:#fafafa">${escapeHtml(text)}</code></pre>`,
		[],
	);

	// Run shiki highlight (no debounce)
	const runHighlight = useCallback(
		(text: string, lang: string | null) => {
			if (!text) {
				setHtml("");
				return;
			}
			const shikiLang = (lang ?? "javascript") as BundledLanguage;
			getShikiHighlighter()
				.then((hl) => {
					setHtml(hl.codeToHtml(text, { lang: shikiLang, theme: "vesper" }));
				})
				.catch(() => {
					setHtml(makePlainHtml(text));
				});
		},
		[makePlainHtml],
	);

	// Debounced effect for typing
	useEffect(() => {
		if (!code) {
			setHtml("");
			return;
		}

		// Show plain text immediately if highlighter not ready
		if (!highlighterReady) {
			setHtml(makePlainHtml(code));
			return;
		}

		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			runHighlight(code, language);
		}, 150);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [code, language, highlighterReady, makePlainHtml, runHighlight]);

	/** Call this to skip debounce and highlight immediately (e.g. on paste) */
	const highlightNow = useCallback(
		(text: string, lang: string | null) => {
			// Cancel any pending debounce
			if (debounceRef.current) clearTimeout(debounceRef.current);

			if (!highlighterReady) {
				// Show plain text while waiting for highlighter
				setHtml(makePlainHtml(text));
				// Queue highlight for when ready
				getShikiHighlighter().then(() => {
					runHighlight(text, lang);
				});
			} else {
				runHighlight(text, lang);
			}
		},
		[highlighterReady, makePlainHtml, runHighlight],
	);

	return { html, highlightNow };
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Auto-detect language from code */
function detectLanguage(code: string): string | null {
	if (!code.trim()) return null;
	const result = hljs.highlightAuto(code, [...LANGUAGE_SUBSET]);
	if (result.language && result.relevance > 3) {
		return result.language;
	}
	return null;
}

/** Scroll sync between textarea and overlay */
function useScrollSync(
	textareaRef: RefObject<HTMLTextAreaElement | null>,
	overlayRef: RefObject<HTMLDivElement | null>,
	lineNumbersRef: RefObject<HTMLDivElement | null>,
) {
	const onScroll = useCallback(() => {
		const textarea = textareaRef.current;
		const overlay = overlayRef.current;
		const lineNumbers = lineNumbersRef.current;
		if (!textarea) return;
		if (overlay) {
			overlay.scrollTop = textarea.scrollTop;
			overlay.scrollLeft = textarea.scrollLeft;
		}
		if (lineNumbers) {
			lineNumbers.scrollTop = textarea.scrollTop;
		}
	}, [textareaRef, overlayRef, lineNumbersRef]);

	return onScroll;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CodeEditorProps = {
	value?: string;
	onChange?: (value: string) => void;
	language?: string;
	onLanguageChange?: (language: string) => void;
	placeholder?: string;
	className?: string;
};

function CodeEditor({
	value = "",
	onChange,
	language: controlledLanguage,
	onLanguageChange,
	placeholder = "// paste your code here...",
	className,
}: CodeEditorProps) {
	// Internal state
	const [internalValue, setInternalValue] = useState(value);
	const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
	const [manualLanguage, setManualLanguage] = useState<string | null>(
		controlledLanguage ?? null,
	);

	const code = onChange ? value : internalValue;
	const activeLanguage =
		controlledLanguage ?? manualLanguage ?? detectedLanguage ?? "javascript";

	// Refs
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const lineNumbersRef = useRef<HTMLDivElement>(null);

	// Highlighted HTML
	const { html: highlightedHtml, highlightNow } = useHighlightedHtml(
		code,
		activeLanguage,
	);

	// Scroll sync
	const handleScroll = useScrollSync(textareaRef, overlayRef, lineNumbersRef);

	// Line count (minimum 16 for visual consistency)
	const lines = code.split("\n");
	const lineCount = Math.max(lines.length, 16);

	// Language detection on change
	const handleChange = useCallback(
		(newValue: string) => {
			if (onChange) {
				onChange(newValue);
			} else {
				setInternalValue(newValue);
			}

			// Auto-detect if no manual override
			if (!controlledLanguage && !manualLanguage) {
				const detected = detectLanguage(newValue);
				if (detected) {
					setDetectedLanguage(detected);
				}
			}
		},
		[onChange, controlledLanguage, manualLanguage],
	);

	// Detect language on paste + trigger immediate highlighting
	const handlePaste = useCallback(
		(e: React.ClipboardEvent<HTMLTextAreaElement>) => {
			const pastedText = e.clipboardData.getData("text");
			if (!pastedText) return;

			// Auto-detect language from pasted content
			let lang = activeLanguage;
			if (!controlledLanguage && !manualLanguage) {
				const detected = detectLanguage(pastedText);
				if (detected) {
					setDetectedLanguage(detected);
					lang = detected;
				}
			}

			// Build what the full value will be after the paste applies
			const textarea = textareaRef.current;
			if (textarea) {
				const { selectionStart, selectionEnd, value: val } = textarea;
				const newValue =
					val.substring(0, selectionStart) +
					pastedText +
					val.substring(selectionEnd);
				// Highlight immediately (skip debounce)
				highlightNow(newValue, lang);
			}
		},
		[controlledLanguage, manualLanguage, activeLanguage, highlightNow],
	);

	// Tab / Shift+Tab handling
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Tab") {
				e.preventDefault();
				const textarea = textareaRef.current;
				if (!textarea) return;

				const { selectionStart, selectionEnd, value: val } = textarea;

				if (e.shiftKey) {
					// Dedent: remove up to 2 leading spaces from the current line
					const lineStart = val.lastIndexOf("\n", selectionStart - 1) + 1;
					const linePrefix = val.substring(lineStart, selectionStart);
					const spacesToRemove = linePrefix.startsWith("  ")
						? 2
						: linePrefix.startsWith(" ")
							? 1
							: 0;
					if (spacesToRemove > 0) {
						const newValue =
							val.substring(0, lineStart) +
							val.substring(lineStart + spacesToRemove);
						handleChange(newValue);
						requestAnimationFrame(() => {
							textarea.selectionStart = Math.max(
								lineStart,
								selectionStart - spacesToRemove,
							);
							textarea.selectionEnd = Math.max(
								lineStart,
								selectionEnd - spacesToRemove,
							);
						});
					}
				} else {
					// Indent: insert 2 spaces
					const newValue = `${val.substring(0, selectionStart)}  ${val.substring(selectionEnd)}`;
					handleChange(newValue);
					requestAnimationFrame(() => {
						textarea.selectionStart = selectionStart + 2;
						textarea.selectionEnd = selectionStart + 2;
					});
				}
			}
		},
		[handleChange],
	);

	// Language dropdown handler
	const handleLanguageSelect = useCallback(
		(lang: string | null) => {
			if (lang === null || lang === "") {
				// Clear manual selection -> back to auto-detect
				setManualLanguage(null);
				const detected = detectLanguage(code);
				setDetectedLanguage(detected);
				onLanguageChange?.(detected ?? "javascript");
			} else {
				setManualLanguage(lang);
				onLanguageChange?.(lang);
			}
		},
		[code, onLanguageChange],
	);

	// Dropdown display value
	const isAutoDetected = !controlledLanguage && !manualLanguage;
	const displayLanguage = LANGUAGE_LABELS[activeLanguage] ?? activeLanguage;

	// Memoize line numbers to avoid re-rendering when only highlight changes
	const lineNumbers = useMemo(
		() =>
			Array.from({ length: lineCount }, (_, i) => (
				<span
					key={`ln-${i + 1}`}
					className="font-mono text-xs leading-[20px] text-text-tertiary select-none"
				>
					{i + 1}
				</span>
			)),
		[lineCount],
	);

	return (
		<div
			className={twMerge(
				"flex flex-col overflow-hidden bg-bg-input border border-border-primary h-[360px] w-full max-w-[780px]",
				className,
			)}
		>
			{/* Window Header */}
			<div className="flex items-center justify-between h-10 px-4 border-b border-border-primary shrink-0">
				<div className="flex items-center gap-2">
					<span className="size-3 rounded-full bg-accent-red" />
					<span className="size-3 rounded-full bg-accent-amber" />
					<span className="size-3 rounded-full bg-accent-green" />
				</div>

				{/* Language Dropdown */}
				<LanguageSelect
					value={activeLanguage}
					isAutoDetected={isAutoDetected}
					onSelect={handleLanguageSelect}
					displayLanguage={displayLanguage}
				/>
			</div>

			{/* Code Body */}
			<div className="flex flex-1 min-h-0 relative">
				{/* Line Numbers */}
				<div
					ref={lineNumbersRef}
					className="flex flex-col items-end py-2.5 px-3 border-r border-border-primary w-12 shrink-0 overflow-hidden"
				>
					{lineNumbers}
				</div>

				{/* Code Area: overlay + textarea stacked */}
				<div className="relative flex-1 min-h-0">
					{/* Highlighted overlay (behind textarea) */}
					<div
						ref={overlayRef}
						aria-hidden="true"
						className="absolute inset-0 overflow-auto pointer-events-none py-2.5 px-4 [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-[20px] [&_code]:font-mono [&_code]:text-xs [&_code]:leading-[20px]"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: shiki generates trusted HTML
						dangerouslySetInnerHTML={{
							__html: highlightedHtml,
						}}
					/>

					{/* Textarea (transparent, captures input — scrolls, overlay follows) */}
					<textarea
						ref={textareaRef}
						value={code}
						onChange={(e) => handleChange(e.target.value)}
						onPaste={handlePaste}
						onKeyDown={handleKeyDown}
						onScroll={handleScroll}
						spellCheck={false}
						autoCapitalize="off"
						autoComplete="off"
						autoCorrect="off"
						className="absolute inset-0 w-full h-full py-2.5 px-4 bg-transparent font-mono text-xs leading-[20px] text-transparent caret-text-primary resize-none outline-none placeholder:text-text-tertiary z-10 overflow-auto"
						placeholder={code ? undefined : placeholder}
					/>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Language Select (sub-component using @base-ui/react)
// ---------------------------------------------------------------------------

type LanguageSelectProps = {
	value: string;
	isAutoDetected: boolean;
	onSelect: (lang: string | null) => void;
	displayLanguage: string;
};

function LanguageSelect({
	value,
	isAutoDetected,
	onSelect,
	displayLanguage,
}: LanguageSelectProps) {
	return (
		<Select.Root
			value={value}
			onValueChange={(val) => onSelect(val === "auto" ? null : val)}
			modal={false}
		>
			<Select.Trigger className="flex items-center gap-1.5 font-mono text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer outline-none">
				<Select.Value>
					{isAutoDetected ? `${displayLanguage} (auto)` : displayLanguage}
				</Select.Value>
				<Select.Icon className="flex items-center">
					<ChevronDown size={14} />
				</Select.Icon>
			</Select.Trigger>

			<Select.Portal>
				<Select.Positioner
					sideOffset={4}
					align="end"
					alignItemWithTrigger={false}
				>
					<Select.Popup className="flex flex-col py-1 bg-bg-elevated border border-border-primary shadow-lg min-w-[160px] z-50">
						<Select.List className="max-h-[240px] overflow-y-auto outline-none">
							{/* Auto-detect option */}
							<Select.Item
								value="auto"
								className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-text-tertiary hover:bg-bg-surface hover:text-text-secondary cursor-pointer outline-none data-[highlighted]:bg-bg-surface data-[highlighted]:text-text-secondary"
							>
								<Select.ItemText>Auto-detect</Select.ItemText>
							</Select.Item>

							{/* Separator */}
							<Select.Separator className="h-px bg-border-primary my-1" />

							{/* Language options */}
							{LANGUAGE_SUBSET.map((lang) => (
								<Select.Item
									key={lang}
									value={lang}
									className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-text-secondary hover:bg-bg-surface hover:text-text-primary cursor-pointer outline-none data-[highlighted]:bg-bg-surface data-[highlighted]:text-text-primary"
								>
									<Select.ItemIndicator className="flex items-center text-accent-green">
										<Check size={12} />
									</Select.ItemIndicator>
									<Select.ItemText>
										{LANGUAGE_LABELS[lang] ?? lang}
									</Select.ItemText>
								</Select.Item>
							))}
						</Select.List>
					</Select.Popup>
				</Select.Positioner>
			</Select.Portal>
		</Select.Root>
	);
}

CodeEditor.displayName = "CodeEditor";

export { CodeEditor, type CodeEditorProps };

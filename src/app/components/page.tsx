import { AnalysisCard } from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { LeaderboardRow } from "@/components/ui/leaderboard-row";
import { ScoreRing } from "@/components/ui/score-ring";
import { SwitchShowcase } from "./switch-showcase";

function Section({
	title,
	children,
}: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-md">
			<div className="flex items-center gap-sm">
				<span className="font-mono text-sm font-bold text-accent-green">
					{"//"}
				</span>
				<h2 className="font-mono text-sm font-bold text-text-primary">
					{title}
				</h2>
			</div>
			<div className="flex flex-col gap-md">{children}</div>
		</section>
	);
}

function VariantRow({
	label,
	children,
}: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-sm">
			<span className="font-mono text-xs text-text-tertiary">{label}</span>
			<div className="flex items-center gap-md flex-wrap">{children}</div>
		</div>
	);
}

const CODE_SAMPLE = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
}`;

export default function ComponentsPage() {
	return (
		<main className="flex-1 px-10 py-16">
			<div className="mx-auto flex max-w-4xl flex-col gap-12">
				<div className="flex flex-col gap-sm">
					<h1 className="font-mono text-2xl font-bold text-text-primary">
						{">"} component_library
					</h1>
					<p className="font-mono text-sm text-text-secondary">
						{"// todos os componentes UI e suas variantes"}
					</p>
				</div>

				{/* Buttons */}
				<Section title="buttons">
					<VariantRow label="variant: primary">
						<Button variant="primary" size="default">
							$ roast_my_code
						</Button>
						<Button variant="primary" size="sm">
							$ roast_my_code
						</Button>
						<Button variant="primary" size="xs">
							$ roast_my_code
						</Button>
					</VariantRow>

					<VariantRow label="variant: secondary">
						<Button variant="secondary" size="default">
							$ share_roast
						</Button>
						<Button variant="secondary" size="sm">
							$ share_roast
						</Button>
						<Button variant="secondary" size="xs">
							$ share_roast
						</Button>
					</VariantRow>

					<VariantRow label="variant: ghost">
						<Button variant="ghost" size="default">
							{"$ view_all >>"}
						</Button>
						<Button variant="ghost" size="sm">
							{"$ view_all >>"}
						</Button>
						<Button variant="ghost" size="xs">
							{"$ view_all >>"}
						</Button>
					</VariantRow>

					<VariantRow label="state: disabled">
						<Button variant="primary" disabled>
							$ disabled
						</Button>
						<Button variant="secondary" disabled>
							$ disabled
						</Button>
						<Button variant="ghost" disabled>
							$ disabled
						</Button>
					</VariantRow>
				</Section>

				{/* Switch */}
				<Section title="switch">
					<SwitchShowcase />
				</Section>

				{/* Badges */}
				<Section title="badge_status">
					<VariantRow label="variants">
						<Badge variant="critical">critical</Badge>
						<Badge variant="warning">warning</Badge>
						<Badge variant="good">good</Badge>
						<Badge variant="critical" size="lg">
							needs_serious_help
						</Badge>
					</VariantRow>
				</Section>

				{/* Analysis Card */}
				<Section title="cards">
					<AnalysisCard.Root>
						<Badge variant="critical">critical</Badge>
						<AnalysisCard.Title>
							using var instead of const/let
						</AnalysisCard.Title>
						<AnalysisCard.Description>
							the var keyword is function-scoped rather than block-scoped, which
							can lead to unexpected behavior and bugs. modern javascript uses
							const for immutable bindings and let for mutable ones.
						</AnalysisCard.Description>
					</AnalysisCard.Root>
					<AnalysisCard.Root>
						<Badge variant="warning">warning</Badge>
						<AnalysisCard.Title>
							manual loop instead of array methods
						</AnalysisCard.Title>
						<AnalysisCard.Description>
							using a traditional for loop with index access when .reduce() or
							.map() would be more idiomatic and less error-prone.
						</AnalysisCard.Description>
					</AnalysisCard.Root>
					<AnalysisCard.Root>
						<Badge variant="good">good</Badge>
						<AnalysisCard.Title>
							function naming is descriptive
						</AnalysisCard.Title>
						<AnalysisCard.Description>
							calculateTotal clearly describes what the function does — this is
							one of the few things not to roast here.
						</AnalysisCard.Description>
					</AnalysisCard.Root>
				</Section>

				{/* Code Block (async server component) */}
				<Section title="code_block">
					<div className="flex flex-col overflow-hidden border border-border-primary bg-bg-input w-[560px]">
						{/* Window Header */}
						<div className="flex items-center h-10 px-4 border-b border-border-primary gap-3 shrink-0">
							<div className="flex items-center gap-2">
								<span className="size-3 rounded-full bg-red-500" />
								<span className="size-3 rounded-full bg-amber-500" />
								<span className="size-3 rounded-full bg-emerald-500" />
							</div>
							<div className="flex-1" />
							<span className="font-mono text-xs text-text-tertiary">
								calculate.js
							</span>
						</div>
						<CodeBlock
							code={CODE_SAMPLE}
							lang="javascript"
							className="border-0"
						/>
					</div>
				</Section>

				{/* Diff Lines */}
				<Section title="diff_line">
					<div className="flex flex-col w-[560px] border border-border-primary">
						<DiffLine variant="removed" code="var total = 0;" />
						<DiffLine variant="added" code="const total = 0;" />
						<DiffLine
							variant="context"
							code="for (let i = 0; i < items.length; i++) {"
						/>
					</div>
				</Section>

				{/* Table Rows */}
				<Section title="table_row">
					<div className="flex flex-col w-full border border-border-primary">
						<LeaderboardRow.Root header>
							<LeaderboardRow.Rank>rank</LeaderboardRow.Rank>
							<LeaderboardRow.Score
								value={0}
								className="font-normal text-text-tertiary"
							>
								score
							</LeaderboardRow.Score>
							<LeaderboardRow.Code>code</LeaderboardRow.Code>
							<LeaderboardRow.Language>lang</LeaderboardRow.Language>
						</LeaderboardRow.Root>
						<LeaderboardRow.Root>
							<LeaderboardRow.Rank>#1</LeaderboardRow.Rank>
							<LeaderboardRow.Score value={2.1} />
							<LeaderboardRow.Code>
								{"function calculateTotal(items) { var total = 0; ..."}
							</LeaderboardRow.Code>
							<LeaderboardRow.Language>javascript</LeaderboardRow.Language>
						</LeaderboardRow.Root>
						<LeaderboardRow.Root>
							<LeaderboardRow.Rank>#2</LeaderboardRow.Rank>
							<LeaderboardRow.Score value={4.5} />
							<LeaderboardRow.Code>
								{"def fetch_data(): import requests; r = requests.get(...)"}
							</LeaderboardRow.Code>
							<LeaderboardRow.Language>python</LeaderboardRow.Language>
						</LeaderboardRow.Root>
						<LeaderboardRow.Root>
							<LeaderboardRow.Rank>#3</LeaderboardRow.Rank>
							<LeaderboardRow.Score value={7.8} />
							<LeaderboardRow.Code>
								{"const handler = async (req: Request) => { ... }"}
							</LeaderboardRow.Code>
							<LeaderboardRow.Language>typescript</LeaderboardRow.Language>
						</LeaderboardRow.Root>
					</div>
				</Section>

				{/* Score Ring */}
				<Section title="score_ring">
					<VariantRow label="score values">
						<ScoreRing score={2.1} />
						<ScoreRing score={5.5} />
						<ScoreRing score={8.2} />
					</VariantRow>
				</Section>
			</div>
		</main>
	);
}

import type { ComponentDetail } from "@/app/data/component-detail-types";

export const NEXT_BEST_ACTION_DETAIL: ComponentDetail = {
	description: "A proactive suggestion card: skills and agents worth creating, automations worth enabling, integrations worth connecting, and in-context work nudges. It is a naming adapter over Artifact List, not a second row implementation — layout, tiles, metadata, PR bylines, hover/focus reveal, and accessibility all live in `components/ui-custom/artifact-list`, so fixes land once. Rows read as \"kind · rationale\" and each carries its own action verb via `rowActionLabel`.",
	importStatement: `import { NextBestAction } from "@/components/blocks/next-best-action";`,
	usage: `import { NextBestAction } from "@/components/blocks/next-best-action";
import type { NextBestActionItem } from "@/components/blocks/next-best-action";
import AutomationIcon from "@atlaskit/icon/core/automation";
import MagicWandIcon from "@atlaskit/icon/core/magic-wand";

const items: NextBestActionItem[] = [
  {
    id: "create-release-notes-skill",
    title: "Create a “Release notes drafter” skill",
    source: "Suggested skill",
    owner: "You wrote 14 similar prompts this month",
    icon: <MagicWandIcon label="" />,
    tileVariant: "purpleSubtle",
    rowActionLabel: "Create",
  },
  {
    id: "automate-in-review-on-pr",
    title: "Move work items to In review when a PR opens",
    source: "Suggested automation",
    owner: "You did this by hand 31 times",
    icon: <AutomationIcon label="" />,
    tileVariant: "blueSubtle",
    rowActionLabel: "Enable",
  },
];

<NextBestAction items={items} onAct={(item) => console.log(item.id)} />`,
	demoLayout: { previewHeight: "fixed" },
	props: [
		{
			name: "items",
			type: "readonly NextBestActionItem[]",
			required: true,
			description: "Suggestions to render. `NextBestActionItem` is `ArtifactListItem`: `title` is the suggested action, `source` the suggestion kind, `owner` the rationale, plus an ADS icon, 3P logo, or agent avatar. Set `rowActionLabel` for that row's verb and `href` to make a pull-request byline a real link.",
		},
		{
			name: "onAct",
			type: "(item: NextBestActionItem) => void",
			description: "Called when a row's hover/focus-revealed action button is activated.",
		},
		{
			name: "actionLabel",
			type: "string",
			default: '"Create"',
			description: "Default label for the per-row action button. Individual rows override it with `rowActionLabel` (e.g. \"Enable\", \"Connect\", \"Review\").",
		},
		{
			name: "actOnRowClick",
			type: "boolean",
			default: "false",
			description: "Also fire `onAct` when the row body is clicked, via a full-row overlay button.",
		},
		{
			name: "variant",
			type: '"default" | "compact"',
			default: '"default"',
			description: "Controls row density. Compact rows are 48px tall with stacked title and metadata lines plus compact actions.",
		},
	],
};

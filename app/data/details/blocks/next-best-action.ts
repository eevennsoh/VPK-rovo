import type { ComponentDetail } from "@/app/data/component-detail-types";

export const NEXT_BEST_ACTION_DETAIL: ComponentDetail = {
	description: "A proactive suggestion card that reuses the Artifact List row anatomy — raised surface, leading tile, title with \"kind · rationale\" metadata, and a hover/focus-revealed action. Content is next best actions rather than artifacts: skills and agents worth creating, automations worth enabling, integrations worth connecting, and in-context work nudges. The default variant uses 64px rows; the compact variant uses 48px rows and swaps the action for inline PR diff stats when a row carries pull-request metadata.",
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
			description: "Suggestions to render. Each item provides a title, kind/rationale metadata, an optional per-row action label, and either an ADS icon, a 3P logo, or an agent avatar.",
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

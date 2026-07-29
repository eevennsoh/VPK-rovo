import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TWG_APPSTACK_DETAIL: ComponentDetail = {
	description:
		"A compact overlapping Teamwork Graph app/source stack on the shared 16/20/24/32px tile scale, with overflow count support and optional entrance animation.",
	usage: `import {
  TWGAppstack,
  type TwgToolSource,
} from "@/components/ui-custom/twg-appstack";

const sources: TwgToolSource[] = [
  { id: "jira", label: "Jira", provider: "jira" },
  { id: "confluence", label: "Confluence", provider: "confluence" },
  { id: "google-drive", label: "Google Drive", provider: "google-drive" },
];

<TWGAppstack sources={sources} />
<TWGAppstack iconSize="medium" sources={sources} />
<TWGAppstack animated={false} sources={sources} />`,
	props: [
		{
			name: "sources",
			type: "ReadonlyArray<TwgToolSource>",
			required: true,
			description: "Sources rendered as overlapping app tiles.",
		},
		{
			name: "iconSize",
			type: '"xxsmall" | "xsmall" | "small" | "medium"',
			default: '"small"',
			description:
				"Tile size on the shared components/ui/tile scale: xxsmall 16x16, xsmall 20x20, small 24x24, medium 32x32. Tile overlap and the +N overflow label scale with it.",
		},
		{
			name: "maxVisible",
			type: "number",
			default: "6",
			description: "Maximum number of source tiles shown before rendering an overflow count.",
		},
		{
			name: "animated",
			type: "boolean",
			default: "true",
			description: "Enables or disables the entrance animation. Disable it for static cards.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the stack container.",
		},
	],
	subComponents: [
		{ name: "TWGAppstack", description: "Root overlapping source stack." },
		{ name: "TwgToolSourceIcon", description: "Tile-backed provider icon at 16, 20, 24, or 32px." },
		{ name: "TwgToolSourceStack", description: "Compatibility wrapper around TWGAppstack." },
	],
	examples: [
		{ title: "Static", description: "Non-animated stack for cards and templates.", demoSlug: "twg-appstack-demo-static" },
		{ title: "Overflow", description: "Stack with hidden source count.", demoSlug: "twg-appstack-demo-overflow" },
		{ title: "Sizes", description: "xxsmall 16px, xsmall 20px, small 24px, and medium 32px stacks.", demoSlug: "twg-appstack-demo-sizes" },
	],
};

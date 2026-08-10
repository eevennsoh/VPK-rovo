import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PULL_REQUEST_DETAIL: ComponentDetail = {
	description:
		"Compact pull-request summary card with author avatar, title, diff stats, relative time, and repo / status / branch pills. Built for selectable lists such as the Jira work-item Pull requests popover.",
	importStatement: `import { PullRequest } from "@/components/blocks/pull-request";
import type { PullRequestProps } from "@/components/blocks/pull-request";`,
	usage: `import { PullRequest } from "@/components/blocks/pull-request";

<PullRequest
  number={1306}
  title="Add guest checkout to the storefront"
  status="Open"
  author={{ name: "Venn", avatarUrl: "/avatar-user/venn/venn.png" }}
  repository="eevensoh/vpk-rovo"
  branch="feature/guest-checkout"
  additions={86}
  deletions={21}
  relativeTime="2hr ago"
  selected
  onActivate={() => {}}
/>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "number",
			type: "number",
			required: true,
			description: "Pull request number shown as `#N` before the title.",
		},
		{
			name: "title",
			type: "string",
			required: true,
			description: "Pull request title.",
		},
		{
			name: "status",
			type: '"Open" | "Merged"',
			required: true,
			description: "Review state rendered as a status lozenge.",
		},
		{
			name: "author",
			type: "PullRequestAuthor",
			description: "Author name and optional avatar URL for the leading circular avatar.",
		},
		{
			name: "repository",
			type: "string",
			description: "Owner/name path shown in the GitHub repository pill.",
		},
		{
			name: "branch",
			type: "string",
			description: "Source branch pill. Omitted when absent.",
		},
		{
			name: "additions",
			type: "number",
			required: true,
			description: "Lines added, shown in success green as `+N`.",
		},
		{
			name: "deletions",
			type: "number",
			required: true,
			description: "Lines deleted, shown in danger red as `-N`.",
		},
		{
			name: "timestampMs",
			type: "number",
			description: "Absolute timestamp used by shared RelativeTime aging.",
		},
		{
			name: "relativeTime",
			type: "string",
			description: "Static relative label when timestampMs is unavailable.",
		},
		{
			name: "selected",
			type: "boolean",
			default: "false",
			description: "Marks the card as the active selection in a list.",
		},
		{
			name: "onActivate",
			type: "() => void",
			description: "Turns the card into a pressed button for select-to-open lists.",
		},
	],
};

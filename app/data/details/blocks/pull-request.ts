import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PULL_REQUEST_DETAIL: ComponentDetail = {
	description:
		"Pull-request summary card in two layouts. `dropdown` is a single-row list card (author avatar, split `#N` + title, diff stats, status lozenge, repo pill, `source → target` branch path) built for selectable lists such as the Jira work-item Pull requests select. `flyout` is the overlay summary card: `#N` + title with a trailing status lozenge, author avatar + `Name · relativeTime`, then a divided GitHub mark + `source → target` path and files / `+add` `−del` footer.",
	importStatement: `import { PullRequest } from "@/components/blocks/pull-request";
import type { PullRequestProps } from "@/components/blocks/pull-request";`,
	usage: `import { PullRequest } from "@/components/blocks/pull-request";

<PullRequest
  variant="flyout"
  number={1306}
  title="Add guest checkout to the storefront"
  status="Open"
  author={{ name: "Venn", avatarUrl: "/avatar-user/venn/venn.png" }}
  repository="eevensoh/vpk-rovo"
  branch="rovo/rfp-103-response-validation"
  targetBranch="main"
  additions={86}
  deletions={21}
  filesChanged={6}
  relativeTime="1h ago"
/>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	examples: [
		{
			title: "Dropdown",
			description:
				"Single-row list card for select menus and other dropdown surfaces. Avatar, `#N` + title, diffs, status lozenge, repo pill, and `source → target`.",
			demoSlug: "pull-request-demo-dropdown",
		},
		{
			title: "Flyout",
			description:
				"Overlay summary card: `#N` + title with a trailing status lozenge, author · time, then GitHub `source → target` and files / diff stats.",
			demoSlug: "pull-request-demo-flyout",
		},
	],
	props: [
		{
			name: "variant",
			type: '"dropdown" | "flyout"',
			default: '"dropdown"',
			description:
				"Card layout. `dropdown` keeps everything on one list row; `flyout` is the overlay summary card.",
		},
		{
			name: "number",
			type: "number",
			required: true,
			description: "Pull request number shown as subtle `#N` before the title.",
		},
		{
			name: "title",
			type: "string",
			required: true,
			description: "Pull request title shown after the number.",
		},
		{
			name: "status",
			type: '"Open" | "Merged"',
			required: true,
			description: "Review state rendered as a status lozenge (Open = success, Merged = discovery).",
		},
		{
			name: "author",
			type: "PullRequestAuthor",
			description: "Author name and optional avatar URL. Leads the dropdown row; on the flyout, pairs with `relativeTime`.",
		},
		{
			name: "repository",
			type: "string",
			description:
				"Owner/name path shown in the GitHub repository pill on the dropdown card. Ignored by the flyout card, which keeps the GitHub mark beside the branch path.",
		},
		{
			name: "branch",
			type: "string",
			description: "Source / head branch shown before the arrow. Omitted when absent.",
		},
		{
			name: "targetBranch",
			type: "string",
			description: "Target / base branch shown after the arrow (e.g. `main`).",
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
			name: "filesChanged",
			type: "number",
			description:
				"Number of changed files, rendered as `N files` in the flyout footer. Ignored by the dropdown card.",
		},
		{
			name: "timestampMs",
			type: "number",
			description: "Optional absolute timestamp reserved for callers; not rendered on the card.",
		},
		{
			name: "relativeTime",
			type: "string",
			description: "Optional static relative label. Rendered on the flyout as `Name · relativeTime`.",
		},
		{
			name: "selected",
			type: "boolean",
			default: "false",
			description: "Marks the card as the active selection in a list. Ignored by the flyout overlay chrome.",
		},
		{
			name: "onActivate",
			type: "() => void",
			description: "Turns the card into a pressed button for select-to-open lists.",
		},
	],
};

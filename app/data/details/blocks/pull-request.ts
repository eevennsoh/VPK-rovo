import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PULL_REQUEST_DETAIL: ComponentDetail = {
	description:
		"Pull-request summary card in two densities. `compact` is a single-row list card (author avatar, split `#N` + title, diff stats, status lozenge, repo pill, `source → target` branch path) built for selectable lists such as the Jira work-item Pull requests select. `spacious` rearranges the same data into three rows: status lozenge + title, repo pill + branch path, then an author / changed-files / diff footer.",
	importStatement: `import { PullRequest } from "@/components/blocks/pull-request";
import type { PullRequestProps } from "@/components/blocks/pull-request";`,
	usage: `import { PullRequest } from "@/components/blocks/pull-request";

<PullRequest
  variant="spacious"
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
  selected
  onActivate={() => {}}
/>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "variant",
			type: '"compact" | "spacious"',
			default: '"compact"',
			description:
				"Card density. `compact` keeps everything on one row; `spacious` splits the same data across three rows.",
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
				"Number of changed files, rendered as `N files` in the spacious footer. Ignored by the compact card.",
		},
		{
			name: "timestampMs",
			type: "number",
			description: "Optional absolute timestamp reserved for callers; not rendered on the card.",
		},
		{
			name: "relativeTime",
			type: "string",
			description: "Optional static relative label reserved for callers; not rendered on the card.",
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

import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PULL_REQUEST_HEADER_DETAIL: ComponentDetail = {
	description:
		"Two-row pull-request detail header with expanded and compact variants. The title row stays visible with a Merge split button (primary label + Auto merge menu) and a More actions menu (Copy link, Open in {SCM}, Convert to draft, Close pull request); use `variant` or `scrollContainerRef` to collapse the status, repository, and branch meta row. Compact mode also shrinks the PR number and title to `text-sm`.",
	importStatement: `import { PullRequestHeader } from "@/components/blocks/pull-request-header";
import type { PullRequestHeaderProps } from "@/components/blocks/pull-request-header";`,
	usage: `import { useRef } from "react";

import { PullRequestHeader } from "@/components/blocks/pull-request-header";

const scrollContainerRef = useRef<HTMLDivElement | null>(null);

// Controlled mode
<PullRequestHeader
  number={1847}
  title="Add the guest checkout storefront flow"
  status="Open"
  baseBranch="main"
  headBranch="feature/guest-checkout"
  repository="eevensoh/vpk-rovo"
  mergeState="ready"
  defaultAutoMerge
  variant="compact"
/>

// Scroll-driven mode
<PullRequestHeader
  {...pullRequest}
  collapseOffset={16}
  scrollContainerRef={scrollContainerRef}
/>
<div ref={scrollContainerRef}>{content}</div>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "variant",
			type: '"expanded" | "compact"',
			description:
				"Controlled presentation override. When provided, it takes precedence over scroll-driven collapse. Compact also applies `text-sm` to the PR number and title.",
		},
		{
			name: "scrollContainerRef",
			type: "RefObject<HTMLElement | null>",
			description:
				"Scrollable element used to derive expanded or compact state when `variant` is omitted.",
		},
		{
			name: "collapseOffset",
			type: "number",
			default: "16",
			description:
				"Scroll distance in pixels at which scroll-driven mode becomes compact.",
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
			description:
				"Review state rendered as a status lozenge in the meta row (Open = success, Merged = discovery).",
		},
		{
			name: "baseBranch",
			type: "string | null",
			description:
				"Target / base branch shown after the arrow. Branch text omits when either side is missing.",
		},
		{
			name: "headBranch",
			type: "string | null",
			description: "Source / head branch shown before the arrow.",
		},
		{
			name: "repository",
			type: "string",
			required: true,
			description: "Owner/name path shown in the GitHub repository tag.",
		},
		{
			name: "mergeState",
			type: '"checks-running" | "merge-conflicts" | "ready"',
			default: '"ready"',
			description:
				'Merge split-button primary label: `"checks-running"` → "Checks running", `"merge-conflicts"` → "Merge conflicts", `"ready"` → "Merge". Primary enables for `ready` + `onMergeClick` or `checks-running` + `onChecksRunningClick`; `merge-conflicts` stays disabled (no related primary action yet). The chevron menu stays available for Auto merge.',
		},
		{
			name: "autoMerge",
			type: "boolean",
			description:
				"Controlled Auto merge switch state in the merge options menu. Prefer with `onAutoMergeChange`.",
		},
		{
			name: "defaultAutoMerge",
			type: "boolean",
			default: "true",
			description:
				"Uncontrolled Auto merge default. On (`true`) unless overridden.",
		},
		{
			name: "onAutoMergeChange",
			type: "(enabled: boolean) => void",
			description:
				"Called when the Auto merge switch in the merge options menu changes.",
		},
		{
			name: "onMergeClick",
			type: "() => void",
			description:
				"Called when the Merge primary action is activated (enabled only when `mergeState` is `ready`).",
		},
		{
			name: "onChecksRunningClick",
			type: "() => void",
			description:
				"Called when the Checks running primary is activated (enabled only when `mergeState` is `checks-running`). In the work-item PR detail, this expands the CI checks disclosure in the metadata rail.",
		},
		{
			name: "url",
			type: "string",
			description:
				"Pull request URL for More actions → Copy link and Open in {SCM}. Those items stay disabled when omitted.",
		},
		{
			name: "scmProviderName",
			type: "string",
			description:
				'SCM product name for More actions → "Open in {name}" (e.g. `"GitHub"`). When omitted, derived from the `url` hostname.',
		},
		{
			name: "onConvertToDraftClick",
			type: "() => void",
			description:
				"Called when More actions → Convert to draft is selected. Pass a no-op stub to enable the item in demos.",
		},
		{
			name: "onClosePullRequestClick",
			type: "() => void",
			description:
				"Called when More actions → Close pull request is selected. Pass a no-op stub to enable the item in demos.",
		},
	],
};

import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PULL_REQUEST_HEADER_DETAIL: ComponentDetail = {
	description:
		"Full-width pull-request detail header with expanded and compact variants. Use `variant` for controlled presentation, or provide `scrollContainerRef` to collapse the author, branches, and repository meta as the linked container scrolls.",
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
  authorName="Venn"
  authorAvatarSrc="/avatar-user/venn/venn.png"
  baseBranch="main"
  headBranch="feature/shop-4821-guest-checkout"
  repository="eevensoh/vpk-rovo"
  additions={86}
  deletions={21}
  updatedTime="20m ago"
  url="https://github.com/eevensoh/vpk-rovo/pull/1847"
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
				"Controlled presentation override. When provided, it takes precedence over scroll-driven collapse.",
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
			description: "Review state rendered as a status lozenge (Open = success, Merged = discovery).",
		},
		{
			name: "authorName",
			type: "string",
			required: true,
			description: "Author display name shown beside the avatar.",
		},
		{
			name: "authorAvatarSrc",
			type: "string",
			description: "Optional author avatar image URL.",
		},
		{
			name: "baseBranch",
			type: "string | null",
			description: "Target / base branch shown before the arrow. Branch pills omit when either side is missing.",
		},
		{
			name: "headBranch",
			type: "string | null",
			description: "Source / head branch shown after the arrow.",
		},
		{
			name: "repository",
			type: "string",
			required: true,
			description: "Owner/name path shown next to the GitHub logo.",
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
			name: "updatedTime",
			type: "string",
			required: true,
			description: "Relative update label shown after the diff stats (e.g. `20m ago`).",
		},
		{
			name: "url",
			type: "string",
			required: true,
			description: "External URL opened by the Open in GitHub CTA.",
		},
	],
};

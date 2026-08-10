import type { PullRequestHeaderProps } from "@/components/blocks/pull-request-header/components/pull-request-header-types";

/** Catalog fixture matching the Jira work-item PR detail header design. */
export const DEMO_PULL_REQUEST_HEADER: PullRequestHeaderProps = {
	number: 1847,
	title: "Add the guest checkout storefront flow",
	status: "Open",
	authorName: "Venn",
	authorAvatarSrc: "/avatar-user/venn/venn.png",
	baseBranch: "main",
	headBranch: "feature/shop-4821-guest-checkout",
	repository: "eevensoh/vpk-rovo",
	additions: 86,
	deletions: 21,
	updatedTime: "20m ago",
	url: "https://github.com/eevensoh/vpk-rovo/pull/1847",
};

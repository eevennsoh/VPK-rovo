import type { PullRequestHeaderProps } from "@/components/blocks/pull-request-header/components/pull-request-header-types";

/** Catalog fixture for the two-row pull-request detail header. */
export const DEMO_PULL_REQUEST_HEADER: PullRequestHeaderProps = {
	number: 1847,
	title: "Add the guest checkout storefront flow",
	status: "Open",
	baseBranch: "main",
	headBranch: "feature/guest-checkout",
	repository: "eevensoh/vpk-rovo",
	url: "https://github.com/eevensoh/vpk-rovo/pull/1847",
	scmProviderName: "GitHub",
	mergeState: "ready",
	defaultAutoMerge: true,
};

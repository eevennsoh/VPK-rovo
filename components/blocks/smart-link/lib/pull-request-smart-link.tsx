import PullRequestIcon from "@atlaskit/icon/core/pull-request";

import type {
	SmartLinkAvatar,
	SmartLinkItem,
} from "@/components/blocks/smart-link/components/smart-link";
import { SMART_LINK_MODAL_ACTIONS } from "@/components/blocks/smart-link/data/smart-link-actions";

/** Status values shared with Jira activity pull-request rows. */
export type PullRequestSmartLinkStatus = "Open" | "Merged";

export interface PullRequestSmartLinkInput {
	id: string;
	number: number;
	title: string;
	status: PullRequestSmartLinkStatus;
	additions: number;
	deletions: number;
	/** Number of files touched by the diff, rendered alongside the +/- counts. */
	files?: number;
	/** Owner/name path (e.g. `eevensoh/vpk-rovo`). */
	repository?: string;
	/** Source branch the PR merges from (e.g. `feature/shop-4821-guest-checkout`). */
	branch?: string;
	/** Branch the PR merges into (e.g. `main`). */
	targetBranch?: string;
	/** Absolute or hash URL. When omitted, builds a GitHub PR URL from `repository`. */
	href?: string;
	author?: SmartLinkAvatar;
	description?: string;
}

function pullRequestStatusPresentation(
	status: PullRequestSmartLinkStatus,
): NonNullable<SmartLinkItem["status"]> {
	switch (status) {
		case "Open":
			return { label: "Open", variant: "success" };
		case "Merged":
			return { label: "Merged", variant: "discovery" };
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

function resolvePullRequestHref(input: Readonly<PullRequestSmartLinkInput>): string {
	if (input.href) return input.href;
	if (input.repository) {
		return `https://github.com/${input.repository}/pull/${input.number}`;
	}
	return `#pull-request-${input.number}`;
}

/**
 * Normalize pull-request story/activity fields into a SmartLinkItem with the
 * `pull-request` variant (GitHub chip + flyout details).
 */
export function toPullRequestSmartLink(
	input: Readonly<PullRequestSmartLinkInput>,
): SmartLinkItem {
	return {
		id: input.id,
		href: resolvePullRequestHref(input),
		// The number prefixes the title (`#1847: Add guest checkout…`) so the card,
		// flyout, and inline chip all identify the PR the same way.
		title: `#${input.number}: ${input.title}`,
		variant: "pull-request",
		provider: { name: "GitHub", logo: { kind: "third-party", name: "github" } },
		// The front slot is a transparent icon tile holding the pull-request glyph,
		// tinted to the status tone (green Open, purple Merged). The GitHub logo
		// still identifies the provider in the footer and the repo tag.
		icon: { kind: "icon", icon: <PullRequestIcon label="" /> },
		status: pullRequestStatusPresentation(input.status),
		author: input.author,
		codeStats: {
			files: input.files,
			additions: input.additions,
			deletions: input.deletions,
		},
		branchPath:
			input.branch || input.targetBranch
				? { branch: input.branch, targetBranch: input.targetBranch }
				: undefined,
		// The repo renders as a provider-logo tag on the metadata row, beside the
		// author avatar and the branch path.
		repository: input.repository,
		description: input.description,
		actions: SMART_LINK_MODAL_ACTIONS,
	};
}

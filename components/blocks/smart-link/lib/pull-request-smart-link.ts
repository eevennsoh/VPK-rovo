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
	/** Owner/name path (e.g. `eevensoh/vpk-rovo`). */
	repository?: string;
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
			return { label: "Open", variant: "information" };
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
		title: `#${input.number}: ${input.title}`,
		variant: "pull-request",
		provider: { name: "GitHub", logo: { kind: "third-party", name: "github" } },
		icon: { kind: "third-party", name: "github" },
		status: pullRequestStatusPresentation(input.status),
		author: input.author,
		codeStats: {
			additions: input.additions,
			deletions: input.deletions,
		},
		metadata: input.repository ? [{ label: input.repository }] : undefined,
		description: input.description,
		actions: SMART_LINK_MODAL_ACTIONS,
	};
}

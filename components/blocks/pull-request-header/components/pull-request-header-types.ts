import type { ComponentProps, RefObject } from "react";

export type PullRequestHeaderStatus = "Open" | "Merged";
export type PullRequestHeaderVariant = "expanded" | "compact";

export interface PullRequestHeaderProps
	extends Omit<ComponentProps<"header">, "children"> {
	/** Controlled presentation. Overrides scroll-driven collapse when provided. */
	variant?: PullRequestHeaderVariant;
	/** Scrollable element that automatically collapses the header when scrolled. */
	scrollContainerRef?: RefObject<HTMLElement | null>;
	/** Scroll distance in pixels before the header collapses. Defaults to 16. */
	collapseOffset?: number;
	/** Pull request number shown as subtle `#N` before the title. */
	number: number;
	/** Pull request title shown after the number. */
	title: string;
	/** Review state rendered as a status lozenge. */
	status: PullRequestHeaderStatus;
	/** Author display name beside the avatar. */
	authorName: string;
	/** Optional author avatar image URL. */
	authorAvatarSrc?: string;
	/** Target / base branch shown before the arrow (e.g. `main`). */
	baseBranch?: string | null;
	/** Source / head branch shown after the arrow. */
	headBranch?: string | null;
	/** Owner/name path (e.g. `eevensoh/vpk-rovo`). */
	repository: string;
	additions: number;
	deletions: number;
	/** Relative update label shown after the diff stats (e.g. `20m ago`). */
	updatedTime: string;
	/** External URL opened by the GitHub CTA. */
	url: string;
}

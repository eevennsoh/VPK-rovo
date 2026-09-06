export type PullRequestStatus = "Open" | "Merged";

/**
 * Card layout. `dropdown` is the single-row list card used in select menus.
 * `flyout` is the overlay summary card: title + lozenge, author · time, then a
 * divided GitHub branch path and files / diff footer.
 */
export type PullRequestVariant = "dropdown" | "flyout";

export interface PullRequestAuthor {
	name: string;
	avatarUrl?: string;
}

export interface PullRequestProps {
	/** Layout. Defaults to the dropdown list card. */
	variant?: PullRequestVariant;
	/** Pull request number (shown as `#1306` in subtle text). */
	number: number;
	/** Pull request title (shown after the number). */
	title: string;
	/** Review state shown as a status lozenge. */
	status: PullRequestStatus;
	/** Author shown as a circular avatar, and on the flyout as name · time. */
	author?: PullRequestAuthor;
	/** Owner/name path (e.g. `eevensoh/vpk-rovo`). Dropdown card only. */
	repository?: string;
	/** Source / head branch name shown before the arrow. */
	branch?: string;
	/** Target / base branch name shown after the arrow (e.g. `main`). */
	targetBranch?: string;
	additions: number;
	deletions: number;
	/**
	 * Number of changed files, rendered as `N files` on the flyout card.
	 * Ignored by the dropdown card, which has no room for the metric.
	 */
	filesChanged?: number;
	/**
	 * Absolute timestamp (ms). Reserved for callers that already track PR age;
	 * the card renders `relativeTime` when provided.
	 */
	timestampMs?: number;
	/** Static relative label. Rendered on the flyout as `Name · relativeTime`. */
	relativeTime?: string;
	/** Marks the card as the active selection, including read-only summaries. */
	selected?: boolean;
	/**
	 * When provided, the card activates as a pressed button (select-to-open).
	 * Without it, the card remains a non-interactive summary surface.
	 */
	onActivate?: () => void;
	className?: string;
}

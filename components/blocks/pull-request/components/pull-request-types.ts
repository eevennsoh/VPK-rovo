export type PullRequestStatus = "Open" | "Merged";

export interface PullRequestAuthor {
	name: string;
	avatarUrl?: string;
}

export interface PullRequestProps {
	/** Pull request number (shown as `#1306`). */
	number: number;
	/** Pull request title. */
	title: string;
	/** Review state shown as a status lozenge. */
	status: PullRequestStatus;
	/** Author shown as a leading circular avatar. */
	author?: PullRequestAuthor;
	/** Owner/name path (e.g. `eevensoh/vpk-rovo`). */
	repository?: string;
	/** Source branch name. Omitted from the badge row when absent. */
	branch?: string;
	additions: number;
	deletions: number;
	/**
	 * Absolute timestamp (ms). When set, the card ages via shared `RelativeTime`.
	 * Prefer this over a static `relativeTime` label.
	 */
	timestampMs?: number;
	/** Static relative label used when `timestampMs` is unavailable. */
	relativeTime?: string;
	/** Marks the card as the active selection in a list. */
	selected?: boolean;
	/**
	 * When provided, the card activates as a pressed button (select-to-open).
	 * Without it, the card is a non-interactive summary surface.
	 */
	onActivate?: () => void;
	className?: string;
}

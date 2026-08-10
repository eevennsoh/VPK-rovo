export type PullRequestStatus = "Open" | "Merged";

export interface PullRequestAuthor {
	name: string;
	avatarUrl?: string;
}

export interface PullRequestProps {
	/** Pull request number (shown as `#1306` in subtle text). */
	number: number;
	/** Pull request title (shown after the number). */
	title: string;
	/** Review state shown as a status lozenge. */
	status: PullRequestStatus;
	/** Author shown as a leading circular avatar. */
	author?: PullRequestAuthor;
	/** Owner/name path (e.g. `eevensoh/vpk-rovo`). */
	repository?: string;
	/** Source / head branch name shown before the arrow. */
	branch?: string;
	/** Target / base branch name shown after the arrow (e.g. `main`). */
	targetBranch?: string;
	additions: number;
	deletions: number;
	/**
	 * Absolute timestamp (ms). Reserved for callers that already track PR age;
	 * the compact card no longer renders a relative-time label.
	 */
	timestampMs?: number;
	/** Static relative label reserved for callers; not rendered on the card. */
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

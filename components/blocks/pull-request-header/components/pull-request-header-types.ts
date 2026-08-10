import type { RefObject } from "react";
import type { HTMLMotionProps } from "motion/react";

export type PullRequestHeaderStatus = "Open" | "Merged";
export type PullRequestHeaderVariant = "expanded" | "compact";
/** Controls the Merge split-button primary label in the title-row action group. */
export type PullRequestHeaderMergeState =
	| "checks-running"
	| "merge-conflicts"
	| "ready";

export interface PullRequestHeaderProps
	extends Omit<HTMLMotionProps<"header">, "children"> {
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
	/** Target / base branch shown after the arrow (e.g. `main`). */
	baseBranch?: string | null;
	/** Source / head branch shown before the arrow. */
	headBranch?: string | null;
	/** Owner/name path (e.g. `eevensoh/vpk-rovo`). */
	repository: string;
	/**
	 * Merge split-button primary label state.
	 * `"checks-running"` → "Checks running", `"merge-conflicts"` → "Merge conflicts",
	 * `"ready"` → "Merge". Defaults to `"ready"`.
	 * Primary is enabled when `ready` + `onMergeClick`, or `checks-running` +
	 * `onChecksRunningClick`. `merge-conflicts` stays disabled (no related primary
	 * action yet). The chevron menu stays available for Auto merge.
	 */
	mergeState?: PullRequestHeaderMergeState;
	/** Controlled Auto merge switch state (menu option). */
	autoMerge?: boolean;
	/** Uncontrolled Auto merge default. Defaults to `true` (on). */
	defaultAutoMerge?: boolean;
	/** Called when the Auto merge switch (merge options menu) changes. */
	onAutoMergeChange?: (enabled: boolean) => void;
	/** Called when the Merge primary action is activated (`ready` only). */
	onMergeClick?: () => void;
	/**
	 * Called when the Checks running primary is activated (`checks-running` only).
	 * Consumers typically expand the CI checks disclosure in the metadata rail.
	 */
	onChecksRunningClick?: () => void;
	/** Called when the More actions (ellipsis) icon button is activated. */
	onMoreActionsClick?: () => void;
}

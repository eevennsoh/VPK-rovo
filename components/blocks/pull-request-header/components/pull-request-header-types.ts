import type { ComponentProps, RefObject } from "react";

export type PullRequestHeaderStatus = "Open" | "Merged";
export type PullRequestHeaderVariant = "expanded" | "compact";
/** Controls the Merge button label in the title-row action group. */
export type PullRequestHeaderMergeState =
	| "checks-running"
	| "merge-conflicts"
	| "ready";

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
	/** Target / base branch shown after the arrow (e.g. `main`). */
	baseBranch?: string | null;
	/** Source / head branch shown before the arrow. */
	headBranch?: string | null;
	/** Owner/name path (e.g. `eevensoh/vpk-rovo`). */
	repository: string;
	/**
	 * Merge button label state.
	 * `"checks-running"` → "Checks running", `"merge-conflicts"` → "Merge conflicts",
	 * `"ready"` → "Merge". Defaults to `"ready"`.
	 */
	mergeState?: PullRequestHeaderMergeState;
	/** Controlled auto-merge toggle pressed state. */
	autoMerge?: boolean;
	/** Uncontrolled auto-merge default. Defaults to `true` (on). */
	defaultAutoMerge?: boolean;
	/** Called when the auto-merge toggle changes. */
	onAutoMergeChange?: (enabled: boolean) => void;
	/** Called when the Chat icon button is activated. */
	onChatClick?: () => void;
	/** Called when the Merge button is activated. */
	onMergeClick?: () => void;
	/** Called when the More actions (ellipsis) icon button is activated. */
	onMoreActionsClick?: () => void;
}

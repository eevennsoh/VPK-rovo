import type { ReactNode } from "react";

/**
 * The three review actions a reviewer can submit against a pull request. These
 * mirror the SCM review verdicts rather than VPK-local naming so the value can
 * be forwarded to a Bitbucket/GitHub review payload without a translation map.
 */
export type PullRequestReviewVerdict = "comment" | "approve" | "request-changes";

/**
 * `compact` is the single-row prompt bar (`[ + ] [ editor ] [ send ]`), the
 * resting state a reviewer sees under a diff. `expanded` is the review card
 * with the "Review" heading, reviewed-files badge, dismiss control, and the
 * verdict segmented control above the send button.
 */
export type PullRequestReviewVariant = "compact" | "expanded";

export interface PullRequestReviewSubmission {
	/** Trimmed comment body. Always non-empty when Send is enabled. */
	body: string;
	verdict: PullRequestReviewVerdict;
}

export interface PullRequestReviewProps {
	/** Accessible name for the review form landmark. Defaults to `title`. */
	ariaLabel?: string;
	/** Focus the review editor when the expanded review is opened by another control. */
	autoFocus?: boolean;
	/**
	 * Controlled presentation. When provided it wins over focus-driven expansion,
	 * so a host that owns the open/closed state can drive both directions.
	 */
	variant?: PullRequestReviewVariant;
	/** Initial presentation for an uncontrolled block. */
	defaultVariant?: PullRequestReviewVariant;
	onVariantChange?: (variant: PullRequestReviewVariant) => void;
	/**
	 * Expand when the composer takes focus. This is the default transform path —
	 * the reviewer clicks the compact bar and the review card grows around it.
	 * Ignored while `variant` is controlled.
	 */
	expandOnFocus?: boolean;
	/** Heading shown in the expanded card. */
	title?: string;
	/**
	 * Files the reviewer has marked as reviewed. Rendered with `reviewedTotal` as
	 * an "N/M Reviewed" lozenge; the lozenge is omitted when either is undefined.
	 */
	reviewedCount?: number;
	reviewedTotal?: number;
	/**
	 * Committed inline diff comments for this review. Rendered as an "N Comment(s)"
	 * lozenge beside Reviewed; omitted when undefined or 0.
	 */
	commentCount?: number;
	placeholder?: string;
	/** Controlled draft body. Omit to let the block own its draft. */
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	/** Controlled verdict. Prefer with `onVerdictChange`. */
	verdict?: PullRequestReviewVerdict;
	defaultVerdict?: PullRequestReviewVerdict;
	onVerdictChange?: (verdict: PullRequestReviewVerdict) => void;
	/**
	 * Hard-disable Send (e.g. review already submitted). Do not use this for
	 * chapter progress — a non-empty draft should still enable the CTA.
	 */
	submitDisabled?: boolean;
	/**
	 * Called with the trimmed body and the active verdict. Send requires a
	 * non-empty body for every verdict.
	 *
	 * Return `false` to reject the submission and keep the draft intact (for
	 * example when Approve is gated on guided-chapter progress). Any other
	 * return value clears the draft after the callback.
	 *
	 * The verdict applies only while expanded. A compact composer shows no
	 * verdict control, so it always submits `comment` — a selection left from a
	 * previous expansion never decides what Send does, however the collapse
	 * happened.
	 */
	onSubmit?: (submission: PullRequestReviewSubmission) => boolean | void;
	/** Called when the expanded card's dismiss control is activated. */
	onClose?: () => void;
	/** Called when the leading "+" control is activated. */
	onAddClick?: () => void;
	/** One-turn context pills (e.g. a selected diff range) shown above the editor. */
	inputContext?: ReactNode;
	className?: string;
}

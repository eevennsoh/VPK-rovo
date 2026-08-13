import type { ReactNode } from "react";

/**
 * Coding agents a reviewer can pick for the CI-fix flow. Ids align with the
 * work-item coding-agent set so hosts can reuse the same map (minus agents
 * omitted from this composer menu).
 */
export type PullRequestFixAgentId =
	| "claude-code"
	| "codex"
	| "rovo-cli"
	| "cursor"
	| "github-copilot"
	| "gemini";

/**
 * `compact` is the single-row prompt bar (`[ + ] [ editor ] [ send ]`), the
 * resting state a reviewer sees under a diff. `expanded` is the fix card with
 * the "Fix" heading, CI check badge, dismiss control, and the agent dropdown
 * beside Send.
 */
export type PullRequestFixVariant = "compact" | "expanded";

export interface PullRequestFixSubmission {
	/** Trimmed comment body. Always non-empty when Send is enabled. */
	body: string;
	/** Agent selected in the expanded picker (or the default while compact). */
	agentId: PullRequestFixAgentId;
}

export interface PullRequestFixProps {
	/** Focus the review editor when the expanded review is opened by another control. */
	autoFocus?: boolean;
	/**
	 * Controlled presentation. When provided it wins over focus-driven expansion,
	 * so a host that owns the open/closed state can drive both directions.
	 */
	variant?: PullRequestFixVariant;
	/** Initial presentation for an uncontrolled block. */
	defaultVariant?: PullRequestFixVariant;
	onVariantChange?: (variant: PullRequestFixVariant) => void;
	/**
	 * Expand when the composer takes focus. This is the default transform path —
	 * the reviewer clicks the compact bar and the review card grows around it.
	 * Ignored while `variant` is controlled.
	 */
	expandOnFocus?: boolean;
	/** Heading shown in the expanded card. */
	title?: string;
	/**
	 * Failing CI check name shown as a neutral badge beside the Fix heading
	 * (e.g. "Lint and typecheck"). Omitted when undefined or empty.
	 */
	checkName?: string;
	/**
	 * Committed inline diff comments for this review. Rendered as an "N Comment(s)"
	 * lozenge beside the check badge; omitted when undefined or 0.
	 */
	commentCount?: number;
	placeholder?: string;
	/** Controlled draft body. Omit to let the block own its draft. */
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	/** Controlled coding agent. Prefer with `onAgentChange`. */
	agentId?: PullRequestFixAgentId;
	defaultAgentId?: PullRequestFixAgentId;
	onAgentChange?: (agentId: PullRequestFixAgentId) => void;
	/**
	 * Hard-disable Send (e.g. review already submitted). Do not use this for
	 * chapter progress — a non-empty draft should still enable the CTA.
	 */
	submitDisabled?: boolean;
	/**
	 * Called with the trimmed body and the selected coding agent. Send requires
	 * a non-empty body.
	 *
	 * Return `false` to reject the submission and keep the draft intact. Any
	 * other return value clears the draft after the callback.
	 */
	onSubmit?: (submission: PullRequestFixSubmission) => boolean | void;
	/** Called when the expanded card's dismiss control is activated. */
	onClose?: () => void;
	/** Called when the leading "+" control is activated. */
	onAddClick?: () => void;
	/** One-turn context pills (e.g. a selected diff range) shown above the editor. */
	inputContext?: ReactNode;
	className?: string;
}

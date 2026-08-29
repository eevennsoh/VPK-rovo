import type { AgentListItem } from "@/components/blocks/agent-list";

/**
 * A local coding session that has not been captured into a work item.
 *
 * Structurally identical to an Agent List row — the card renders the shared
 * `AgentListRow` presenter inside its sunken body — so this is an alias rather
 * than a parallel model. Consumers that already build `AgentListItem` values
 * (Pulse maps loose-work fixtures into them) need no conversion step.
 */
export type AgentSessionItem = AgentListItem;

export interface AgentSessionProps {
	className?: string;
	/** Sessions to render; defaults to built-in sample data. */
	items?: readonly AgentSessionItem[];
	/** Ids whose chin should read Captured instead of offering Link / Create. */
	capturedItemIds?: ReadonlySet<string>;
	/** Suggested Jira key for the chin primary action. Defaults to `sessionDetails.issueKey`. */
	getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
	/** Links a session to the suggested work item from the chin primary action. */
	onLinkWorkItem?: (item: AgentSessionItem) => void;
	/** Creates a work item from a session. Omit to expose an unavailable Create action. */
	onCreateWorkItem?: (item: AgentSessionItem) => void;
	/** Dismisses a session. Omit to hide the dismiss control. */
	onDismiss?: (item: AgentSessionItem) => void;
	/** Overrides the shell command copied from the chin. */
	getResumeCommand?: (item: AgentSessionItem) => string | undefined;
	/**
	 * Whether a session can be resumed. Rows that answer `false` hide the Resume
	 * control entirely instead of copying a command the host cannot honour.
	 * Defaults to resumable.
	 */
	isResumable?: (item: AgentSessionItem) => boolean;
	/** Called after the chin copies the resume command. */
	onCopyResume?: (item: AgentSessionItem) => void;
	/** Called when a card body is activated. */
	onView?: (item: AgentSessionItem) => void;
	/**
	 * When `onView` is set, non-coding rows for which this returns false omit the
	 * body action. Coding agent rows always stay activatable. Defaults to every row.
	 */
	canViewItem?: (item: AgentSessionItem) => boolean;
}

import type { AgentListItem } from "@/components/blocks/agent-list";

/**
 * A local coding session that has not been captured into a work item.
 *
 * Structurally identical to an Agent List row — the card renders the shared
 * `AgentListRow` presenter inside a dashed uncaptured-work frame — so this is
 * an alias rather than a parallel model. Consumers that already build
 * `AgentListItem` values (Pulse maps loose-work fixtures into them) need no
 * conversion step.
 */
export type AgentSessionItem = AgentListItem;

/** Visual footprint of each session. Large preserves the full uncaptured-work card. */
export type AgentSessionVariant = "large" | "medium" | "small";

export interface AgentSessionProps {
	className?: string;
	/** Card footprint. Defaults to the full large uncaptured-work card. */
	variant?: AgentSessionVariant;
	/** Sessions to render; defaults to built-in sample data. */
	items?: readonly AgentSessionItem[];
	/** Ids whose card should read as captured (solid border, still hoverable). */
	capturedItemIds?: ReadonlySet<string>;
	/**
	 * Ids that arrived in the last sync and the viewer has not reviewed yet.
	 *
	 * Two things follow from membership, and they are deliberately separate. The
	 * card plays a one-shot arrival beat, which only lands if someone is looking;
	 * and it carries a persistent unreviewed mark, which is what survives a
	 * backgrounded tab, a collapsed column, and `prefers-reduced-motion`. The mark
	 * is the load-bearing half — the beat is garnish on top of it.
	 *
	 * Same shape as {@link capturedItemIds} on purpose: the host owns the
	 * watermark that decides when an id leaves the set, and the block just renders
	 * a boolean.
	 */
	newItemIds?: ReadonlySet<string>;
	/**
	 * Subset of {@link newItemIds} whose arrival beat has not played yet.
	 *
	 * Separate from the mark because the two have different lifetimes: the mark
	 * lasts until the watermark clears it, while the beat is one-shot per
	 * arrival. Anything that remounts a card — a host collapsing the surface and
	 * reopening it — would otherwise re-arm `initial` and replay a beat the
	 * viewer already saw. Defaults to `newItemIds`, which is correct for a host
	 * that never unmounts the list.
	 */
	arrivingItemIds?: ReadonlySet<string>;
	/** Suggested Jira key for the untracked-work flyout. Defaults to `sessionDetails.issueKey`. */
	getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
	/**
	 * Several candidate keys for a session. The untracked-work flyout offers the
	 * first key; takes precedence over `getSuggestedWorkItemKey` when returned.
	 */
	getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined;
	/** Links a session to a suggested work item. Receives the flyout's offered key. */
	onLinkWorkItem?: (item: AgentSessionItem, workItemKey?: string) => void;
	/** Creates a work item from a session. Omit to expose an unavailable Create action. */
	onCreateWorkItem?: (item: AgentSessionItem) => void;
	/**
	 * Add-as-subtask action behind the untracked-work flyout menu. Omit to expose
	 * the menu option as unavailable.
	 */
	onSubtasks?: (item: AgentSessionItem) => void;
	/** Overrides the shell command the hover Resume control copies. */
	getResumeCommand?: (item: AgentSessionItem) => string | undefined;
	/**
	 * Whether a session can be resumed. Rows that answer `false` hide the Resume
	 * control entirely instead of copying a command the host cannot honour.
	 * Defaults to resumable.
	 */
	isResumable?: (item: AgentSessionItem) => boolean;
	/** Called after the hover Resume control copies the resume command. */
	onCopyResume?: (item: AgentSessionItem) => void;
	/**
	 * Show/hide-later toggle behind the hover eye control. The button always
	 * renders; omit this to leave it a placeholder until the behaviour lands.
	 */
	onToggleVisibility?: (item: AgentSessionItem) => void;
	/** Called when a card body is activated. */
	onView?: (item: AgentSessionItem) => void;
	/**
	 * When `onView` is set, non-coding rows for which this returns false omit the
	 * body action. Coding agent rows ignore this permission check but still require
	 * `onView` before their body becomes interactive. Defaults to every row.
	 */
	canViewItem?: (item: AgentSessionItem) => boolean;
}

import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import type { JiraKanbanCardTag, JiraKanbanPriority } from "../../index";

/**
 * Pulse — the experimental Kanban's timeline mode.
 *
 * One place for whoever is leading a team of humans *and* agents to see
 * everything the team produced: the work captured in work items, and the work
 * that never made it into one. Scrubbing the timeline moves between snapshots
 * — the decision points of a delivery — so the reader can reconstruct what
 * happened, what needs attention, and what to do next without a stand-up.
 *
 * These types are the contract every Pulse component codes against. Treat them
 * as frozen: components render them, `data/` supplies them.
 */

export type PulseMemberKind = "human" | "agent";

export interface PulseMember {
	id: string;
	/** Display name, e.g. "Maya Ferreira" or "Review Agent". */
	name: string;
	/** Short role line, e.g. "Staff engineer" / "Reviews every PR". */
	role: string;
	kind: PulseMemberKind;
	/** Human avatars use `/avatar/*`; agents use `/avatar-agent/*`. */
	avatarSrc: string;
	/** City label used by the async story, e.g. "Sydney". Agents omit it. */
	timezone?: string;
}

/** A work item the team touched inside the snapshot window. */
export interface PulseWorkItem {
	/** Jira key, e.g. "PAY-118". */
	key: string;
	summary: string;
	tags: readonly JiraKanbanCardTag[];
	priority: JiraKanbanPriority;
	/** Board column the item sat in at this point in time. */
	status: string;
	/** Everyone — human or agent — who moved this item. */
	memberIds: readonly string[];
	/** Roster id of the current assignee — look up `kind` for avatar shape. */
	assigneeId?: string;
	assigneeAvatarSrc?: string;
	assigneeName?: string;
}

/**
 * Work the team produced that never landed in a work item: an unlinked PR, a
 * decision made in chat, a Loom nobody filed. Surfacing these is the whole
 * point of Pulse — they are the part a stand-up usually misses.
 */
export interface PulseLooseWork {
	id: string;
	title: string;
	/** Where it lives, e.g. "GitHub" / "Slack" / "Loom" / "Confluence". */
	source: string;
	/** Compact destination label shown in the hoverable Smart Link trigger. */
	sourceTitle: string;
	/** Supporting line, e.g. "PR #1847 · no linked work item". */
	detail: string;
	memberIds: readonly string[];
}

export type PulseSignalTone = "attention" | "risk" | "decision" | "shipped";

/**
 * Something the reader must know about right now.
 *
 * Every signal is attributed: an agent that has stopped and is waiting on a
 * human, or a teammate who commented or @mentioned the reader. `memberId` is
 * the roster identity behind the row, and must name a member the snapshot lists
 * as active — a signal from somebody who was not in the window is not something
 * the window can show.
 */
export interface PulseSignal {
	id: string;
	tone: PulseSignalTone;
	/** Roster member the signal comes from — drives the attention row's identity. */
	memberId: string;
	title: string;
	detail: string;
	workItemKey?: string;
}

/** A next best action the reader can take without leaving Jira. */
export interface PulseAction {
	id: string;
	label: string;
	/** Why Pulse is suggesting it. */
	rationale: string;
	/** Button copy, e.g. "Assign agent". */
	actionLabel: string;
	workItemKey?: string;
}

/** A headline number for the snapshot window, e.g. "6 PRs merged". */
export interface PulseStat {
	id: string;
	label: string;
	value: string;
}

/** Per-member scoping: what this one person or agent did in this snapshot. */
export interface PulseContribution {
	memberId: string;
	/** One or two sentences, written in the same voice as the snapshot prose. */
	summary: string;
	workItemKeys: readonly string[];
	artifactIds: readonly string[];
	looseWorkIds: readonly string[];
}

/** One decision point on the timeline. */
export interface PulseSnapshot {
	id: string;
	/** ISO timestamp — drives proportional tick placement on the scrubber. */
	timestamp: string;
	/** Scrubber pill label, e.g. "Wed 13 Aug". */
	dateLabel: string;
	/** Clock label, e.g. "02:30". */
	timeLabel: string;
	/** Eyebrow left half, e.g. "Night shift". */
	chapterLabel: string;
	/** Eyebrow right half, e.g. "Tue 18:00 – Wed 06:00". */
	rangeLabel: string;
	/** Display headline. Keep it a sentence a human would actually say. */
	title: string;
	/** Narrative body. One paragraph, plain prose, no bullet lists. */
	paragraphs: readonly string[];
	artifacts: readonly ArtifactListItem[];
	workItemKeys: readonly string[];
	looseWorkIds: readonly string[];
	attention: readonly PulseSignal[];
	nextActions: readonly PulseAction[];
	stats: readonly PulseStat[];
	/** Members active in this window — drives roster availability. */
	memberIds: readonly string[];
	contributions: readonly PulseContribution[];
}

export interface PulseTimeline {
	/** Epic line, e.g. "PAY · Payments SDK v2 migration". */
	projectLabel: string;
	members: readonly PulseMember[];
	workItems: readonly PulseWorkItem[];
	looseWork: readonly PulseLooseWork[];
	/** Chronological, oldest first. */
	snapshots: readonly PulseSnapshot[];
}

/* ------------------------------------------------------------------ */
/* Component contracts — implemented by `components/*`, composed by     */
/* `experimental-pulse.tsx`. Do not widen without updating every owner. */
/* ------------------------------------------------------------------ */

export interface PulseScrubberProps {
	snapshots: readonly PulseSnapshot[];
	activeIndex: number;
	onActiveIndexChange: (index: number) => void;
	/** Indexes where the filtered member was active; others render muted. */
	highlightedIndexes: ReadonlySet<number>;
	/** Set while a member filter is on — changes tick emphasis only. */
	isFiltered: boolean;
}

export interface PulseStoryProps {
	snapshot: PulseSnapshot;
	index: number;
	total: number;
	onPrevious: () => void;
	onNext: () => void;
	/** Present only while a member filter is on. */
	member: PulseMember | null;
	contribution: PulseContribution | null;
	/** Already filtered by the shell — render as given. */
	artifacts: readonly ArtifactListItem[];
	attention: readonly PulseSignal[];
	nextActions: readonly PulseAction[];
}

export interface PulseRailProps {
	members: readonly PulseMember[];
	/** Members active in the current snapshot; others render disabled. */
	activeMemberIds: ReadonlySet<string>;
	selectedMemberId: string | null;
	onSelectedMemberIdChange: (memberId: string | null) => void;
	stats: readonly PulseStat[];
	/** Already filtered by the shell — render as given. */
	workItems: readonly PulseWorkItem[];
	looseWork: readonly PulseLooseWork[];
}

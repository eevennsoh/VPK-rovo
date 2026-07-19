import type { JiraAgentSessionItem } from "@/components/blocks/jira-agent-session";
import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import type { LozengeProps } from "@/components/ui/lozenge";
import type { TagColor } from "@/components/ui/tag";

/**
 * Who performed an activity. Drives the leading timeline visual:
 * `person` → circular photo avatar, `agent` → hexagon agent art,
 * `app` → third-party brand mark (e.g. GitHub).
 */
export type JiraActivityActorKind = "person" | "agent" | "app";

export interface JiraActivityActor {
	id: string;
	name: string;
	kind: JiraActivityActorKind;
	/** Person photo or 1P agent art under `public/`. */
	avatarSrc?: string;
	/** Third-party brand mark for `app` actors, rendered via `LogoThirdParty`. */
	brandName?: ThirdPartyLogoName;
}

/**
 * Neutral leading glyph for an event row. When an event omits its `icon`, the
 * actor avatar is shown in the node slot instead (e.g. a person self-assigning).
 */
export type JiraActivityEventIcon =
	| "created"
	| "label"
	| "sla"
	| "status"
	| "delegated"
	| "in-progress"
	| "linked";

/**
 * A rich inline text run. Shared by event action lines and comment bodies so
 * the code/link/lozenge/tag styling lives in one renderer.
 */
export type JiraActivitySegment =
	| { type: "text"; text: string }
	| { type: "code"; text: string }
	| { type: "link"; text: string; href?: string }
	| {
			type: "lozenge";
			text: string;
			variant?: NonNullable<LozengeProps["variant"]>;
		}
	| { type: "label"; text: string; color: TagColor }
	| { type: "tag"; text: string; color?: TagColor }
	| { type: "transition-arrow" }
	| { type: "priority"; text: "Medium" };

interface JiraActivityEntryBase {
	id: string;
	actor: JiraActivityActor;
	/** Human-readable relative time, e.g. "15min ago". */
	timestamp: string;
}

/** A compact single-line event on the timeline spine. */
export interface JiraActivityEventEntry extends JiraActivityEntryBase {
	kind: "event";
	/** Leading event glyph; when omitted the actor avatar is shown instead. */
	icon?: JiraActivityEventIcon;
	segments: readonly JiraActivitySegment[];
	/** Optional compact pull-request metadata shown in place of the standard action line. */
	pullRequest?: {
		number: number;
		title: string;
		status: "Open" | "Merged";
		additions: number;
		deletions: number;
	};
}

export interface JiraActivityReply {
	id: string;
	actor: JiraActivityActor;
	timestamp: string;
	body: string;
}

export interface JiraActivityCollapsible {
	label: string;
	content: readonly JiraActivitySegment[];
}

/** A bordered comment card with a rich body, optional collapsible, and replies. */
export interface JiraActivityCommentEntry extends JiraActivityEntryBase {
	kind: "comment";
	/** Optional trailing tag on the header, e.g. "Automation". */
	tag?: { text: string; color?: TagColor };
	body: readonly JiraActivitySegment[];
	/** Optional collapsible detail section (e.g. "Investigation"). */
	collapsible?: JiraActivityCollapsible;
	replies?: readonly JiraActivityReply[];
	/** Render the reply composer under this comment. Defaults to `true`. */
	allowReply?: boolean;
	/** Optional Jira Agent Session summary for the expanded activity-card header. */
	sessionItem?: JiraAgentSessionItem;
}

/** A bordered card summarizing a code change, with a branch/PR reference. */
export interface JiraActivityChangedFilesEntry extends JiraActivityEntryBase {
	kind: "changed-files";
	tag?: { text: string; color?: TagColor };
	/** Optional agent-session summary for output-list cards. */
	sessionItem?: JiraAgentSessionItem;
	/** Artifacts produced by the session, rendered as compact output rows. */
	outputs?: readonly ArtifactListItem[];
	/** Headline, e.g. "Changed 2 files". */
	summary: string;
	/** Muted description of the change. */
	description: string;
	/** Optional branch/PR reference, e.g. "#78672". */
	branch?: string;
}

export type JiraActivityEntry =
	| JiraActivityEventEntry
	| JiraActivityCommentEntry
	| JiraActivityChangedFilesEntry;

/** Timeline ordering: `ascending` = oldest first, `descending` = newest first. */
export type JiraActivitySortOrder = "ascending" | "descending";

/** Timeline filtering: show every activity or only comments authored by agents. */
export type JiraActivityFilter = "all" | "agents-only";

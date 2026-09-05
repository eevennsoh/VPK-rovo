import type { AgentSessionColumnFrame } from "@/components/blocks/agent-session-column/agent-session-column-frame";
import type { JiraIssueChrome } from "@/components/blocks/jira-issue/types";
import { token } from "@/lib/tokens";

/** Expanded status-column backdrop. The well recipe also names the implied issue card chrome. Not collapse. Not drag highlight. */
export type KanbanColumnChrome = "default" | "simple";

export const DEFAULT_KANBAN_COLUMN_CHROME: KanbanColumnChrome = "default";

/**
 * Collapsed status-column paint and caption spacing. Framing lives on
 * `KanbanColumnChromeStyles.headerFrame`, not here — one board decision.
 */
export interface KanbanCollapsedChromeStyles {
	/** Default: `bg-surface-sunken`. Simple: `border border-border-disabled`. */
	readonly pillClassName: string;
	/**
	 * Caption only: space below the count row. `undefined` when enclosed —
	 * the gap is inside the pill, not a board-surface spacer.
	 */
	readonly captionPaddingBottom: string | undefined;
	/**
	 * Enclosed only: space above the count, matching the expanded well header.
	 * A collapsed Untracked rail sits beside expanded status columns, so this
	 * inset keeps both numbers on one row. `undefined` for caption.
	 */
	readonly countPaddingTop: string | undefined;
	readonly pillRadius: string;
	readonly pillPaddingBlock: string;
}

/**
 * Well recipe for an expanded BoardColumn.
 *
 * `default`: sunken fill plus the standard well's inner padding. Header lives
 * inside the painted object (`headerFrame: "enclosed"`). The transparent
 * 1px border matches Untracked's visible well stroke so both headers inset
 * the same amount and the counts share a row.
 * `simple`: no fill; inset slots stay unset. Header sits on the board
 * (`headerFrame: "caption"`).
 *
 * Header owns `paddingTop` and `paddingInline`. Default also sets
 * `paddingBottom` (4px). Boards supply a fallback `paddingBottom`.
 * `undefined` slots mean "do not set".
 */
export interface KanbanColumnChromeStyles {
	readonly columnClassName: string;
	readonly cardChrome: JiraIssueChrome;
	readonly headerFrame: AgentSessionColumnFrame;
	readonly header: {
		readonly paddingTop: string | undefined;
		readonly paddingInline: string | undefined;
		readonly paddingBottom?: string;
	};
	readonly cardList: {
		readonly paddingTop: string | undefined;
		readonly paddingBottom: string | undefined;
		readonly paddingInline: string | undefined;
		/** Default well: 4px stack. Omitted on simple so boards keep their own gap. */
		readonly gap?: string;
	};
	readonly footer: {
		readonly paddingInline: string | undefined;
	};
	/** Default well only: collapse control `pt-2`/`pb-1` (8px/4px). Empty on simple. */
	readonly resizeButtonClassName: string;
	readonly collapsed: KanbanCollapsedChromeStyles;
}

const DEFAULT_KANBAN_COLLAPSED_CHROME_STYLES: KanbanCollapsedChromeStyles = Object.freeze({
	pillClassName: "bg-surface-sunken border border-solid border-transparent",
	captionPaddingBottom: undefined,
	countPaddingTop: token("space.100"),
	pillRadius: token("radius.large"),
	pillPaddingBlock: token("space.150"),
});

const SIMPLE_KANBAN_COLLAPSED_CHROME_STYLES: KanbanCollapsedChromeStyles = Object.freeze({
	pillClassName: "border border-border-disabled",
	captionPaddingBottom: token("space.100"),
	countPaddingTop: undefined,
	pillRadius: token("radius.large"),
	pillPaddingBlock: token("space.150"),
});

const DEFAULT_KANBAN_COLUMN_CHROME_STYLES: KanbanColumnChromeStyles = Object.freeze({
	columnClassName: "bg-surface-sunken border border-solid border-transparent",
	cardChrome: "raised",
	headerFrame: "enclosed",
	header: Object.freeze({
		paddingTop: token("space.100"),
		paddingInline: token("space.150"),
		paddingBottom: token("space.050"),
	}),
	cardList: Object.freeze({
		paddingTop: token("space.050"),
		paddingBottom: token("space.100"),
		paddingInline: token("space.050"),
		gap: token("space.050"),
	}),
	footer: Object.freeze({
		paddingInline: token("space.050"),
	}),
	resizeButtonClassName: "pt-2 pb-1",
	collapsed: DEFAULT_KANBAN_COLLAPSED_CHROME_STYLES,
});

const SIMPLE_KANBAN_COLUMN_CHROME_STYLES: KanbanColumnChromeStyles = Object.freeze({
	columnClassName: "",
	cardChrome: "stroke",
	headerFrame: "caption",
	header: Object.freeze({
		paddingTop: undefined,
		paddingInline: undefined,
	}),
	cardList: Object.freeze({
		paddingTop: undefined,
		paddingBottom: undefined,
		paddingInline: undefined,
	}),
	footer: Object.freeze({
		paddingInline: undefined,
	}),
	resizeButtonClassName: "",
	collapsed: SIMPLE_KANBAN_COLLAPSED_CHROME_STYLES,
});

const KANBAN_COLUMN_CHROME_STYLES: Readonly<Record<KanbanColumnChrome, KanbanColumnChromeStyles>> = Object.freeze({
	default: DEFAULT_KANBAN_COLUMN_CHROME_STYLES,
	simple: SIMPLE_KANBAN_COLUMN_CHROME_STYLES,
});

export function resolveKanbanColumnChrome(
	chrome?: KanbanColumnChrome,
): KanbanColumnChromeStyles {
	return KANBAN_COLUMN_CHROME_STYLES[chrome ?? DEFAULT_KANBAN_COLUMN_CHROME];
}

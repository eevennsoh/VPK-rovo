import type { JiraIssueChrome } from "@/components/blocks/jira-issue/types";
import { token } from "@/lib/tokens";

/** Expanded status-column backdrop. The well recipe also names the implied issue card chrome. Not collapse. Not drag highlight. */
export type KanbanColumnChrome = "default" | "simple";

export const DEFAULT_KANBAN_COLUMN_CHROME: KanbanColumnChrome = "default";

/**
 * Well recipe for an expanded BoardColumn.
 *
 * `default`: sunken fill plus the standard well's inner padding.
 * `simple`: no fill; inset slots stay unset.
 *
 * Header owns `paddingTop` and `paddingInline`. Default also sets
 * `paddingBottom` (4px). Boards supply a fallback `paddingBottom`.
 * `undefined` slots mean "do not set".
 */
export interface KanbanColumnChromeStyles {
	readonly columnClassName: string;
	readonly cardChrome: JiraIssueChrome;
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
}

const DEFAULT_KANBAN_COLUMN_CHROME_STYLES: KanbanColumnChromeStyles = Object.freeze({
	columnClassName: "bg-surface-sunken",
	cardChrome: "raised",
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
});

const SIMPLE_KANBAN_COLUMN_CHROME_STYLES: KanbanColumnChromeStyles = Object.freeze({
	columnClassName: "",
	cardChrome: "stroke",
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

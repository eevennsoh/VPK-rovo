import { token } from "@/lib/tokens";

/** Expanded status-column backdrop. Not card chrome. Not collapse. Not drag highlight. */
export type KanbanColumnChrome = "default" | "simple";

export const DEFAULT_KANBAN_COLUMN_CHROME: KanbanColumnChrome = "default";

/**
 * Well recipe for an expanded BoardColumn.
 *
 * `default`: sunken fill plus the standard well's inner padding.
 * `simple`: no fill; inset slots stay unset.
 *
 * Header owns `paddingTop` and `paddingInline` only. Boards own
 * `paddingBottom`. `undefined` slots mean "do not set".
 */
export interface KanbanColumnChromeStyles {
	readonly columnClassName: string;
	readonly header: {
		readonly paddingTop: string | undefined;
		readonly paddingInline: string | undefined;
	};
	readonly cardList: {
		readonly paddingTop: string | undefined;
		readonly paddingBottom: string | undefined;
		readonly paddingInline: string | undefined;
	};
	readonly footer: {
		readonly paddingInline: string | undefined;
	};
}

const DEFAULT_KANBAN_COLUMN_CHROME_STYLES: KanbanColumnChromeStyles = Object.freeze({
	columnClassName: "bg-surface-sunken",
	header: Object.freeze({
		paddingTop: token("space.150"),
		paddingInline: token("space.150"),
	}),
	cardList: Object.freeze({
		paddingTop: token("space.050"),
		paddingBottom: token("space.100"),
		paddingInline: token("space.050"),
	}),
	footer: Object.freeze({
		paddingInline: token("space.050"),
	}),
});

const SIMPLE_KANBAN_COLUMN_CHROME_STYLES: KanbanColumnChromeStyles = Object.freeze({
	columnClassName: "",
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

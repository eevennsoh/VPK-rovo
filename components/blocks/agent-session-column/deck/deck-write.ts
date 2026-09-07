// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { cardLoopPositionFrom, stackZIndex } from "../../../visual/scrolling/stack-layout.ts";
// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { deckRunFrame, groupDeckRuns, isIdentityFrame, type AgentSessionDeck, type DeckRow, type DeckRunFrame } from "./deck-model.ts";

export const DECK_ITEM_SELECTOR = ":scope > ul > li";
export const DECK_PLACEHOLDER_ATTR = "data-session-drag-placeholder";
export const DECK_MARKED_ATTR = "data-marked";

export interface DeckHostStyle {
	readonly opacity: string;
	readonly transform: string;
	readonly transformOrigin: string;
	readonly willChange: string;
}

export interface DeckStyleTarget {
	opacity: string;
	transform: string;
	transformOrigin: string;
	willChange: string;
	zIndex: string;
}

/**
 * Layout `top` in the scrollport's content space. Rects, not `offsetTop`: the
 * column scrollport is `position: static`, so offsetParent would include the header.
 */
export function deckRowFromRect(
	portTop: number,
	scrollTop: number,
	marked: boolean,
	rect: Readonly<{ height: number; top: number }>,
): DeckRow {
	return {
		height: rect.height,
		marked,
		top: rect.top - portTop + scrollTop,
	};
}

export function shouldMeasureDeckItem(
	placeholder: boolean,
	hasHost: boolean,
	height: number,
): boolean {
	return !placeholder && hasHost && height > 0;
}

export function deckHostStyle(
	frame: DeckRunFrame,
	originY: number,
	willChange: string,
): DeckHostStyle | null {
	if (isIdentityFrame(frame) && willChange === "auto") {
		return null;
	}
	return {
		opacity: String(frame.opacity),
		transform: `translateY(${frame.y}px) scale(${frame.scale})`,
		transformOrigin: `50% ${originY}px`,
		willChange: willChange === "auto" ? "" : willChange,
	};
}

export function applyDeckHostStyle(
	target: DeckStyleTarget,
	frame: DeckRunFrame,
	rowTop: number,
	zIndex: number,
	willChange: string,
): void {
	const style = deckHostStyle(frame, frame.originTop - rowTop, willChange);
	if (style === null) {
		target.opacity = "";
		target.transform = "";
		target.transformOrigin = "";
		target.willChange = "";
		target.zIndex = "";
		return;
	}
	target.opacity = style.opacity;
	target.transform = style.transform;
	target.transformOrigin = style.transformOrigin;
	target.willChange = style.willChange;
	target.zIndex = String(zIndex);
}

export function deckRunZIndex(deck: AgentSessionDeck, runTop: number): number {
	return stackZIndex(deck.stackOrder, cardLoopPositionFrom(runTop, 0));
}

export interface MeasuredDeckItem {
	readonly host: HTMLElement;
	readonly li: HTMLElement;
	readonly row: DeckRow;
}

function clearDeckItem(host: HTMLElement, li: HTMLElement): void {
	host.style.opacity = "";
	host.style.transform = "";
	host.style.transformOrigin = "";
	host.style.willChange = "";
	li.style.zIndex = "";
}

/**
 * Content-space row geometry. `row.top` stays put when `rect.top` and
 * `scrollTop` move together, so this is safe to cache across scroll.
 */
export function measureAgentSessionDeck(port: HTMLElement): MeasuredDeckItem[] {
	const portTop = port.getBoundingClientRect().top;
	const scrollTop = port.scrollTop;
	const measured: MeasuredDeckItem[] = [];

	for (const node of port.querySelectorAll(DECK_ITEM_SELECTOR)) {
		if (!(node instanceof HTMLElement)) {
			continue;
		}
		const host = node.firstElementChild;
		if (!(host instanceof HTMLElement)) {
			continue;
		}
		const rect = node.getBoundingClientRect();
		if (
			!shouldMeasureDeckItem(
				node.hasAttribute(DECK_PLACEHOLDER_ATTR),
				true,
				rect.height,
			)
		) {
			clearDeckItem(host, node);
			continue;
		}
		measured.push({
			host,
			li: node,
			row: deckRowFromRect(
				portTop,
				scrollTop,
				node.hasAttribute(DECK_MARKED_ATTR),
				rect,
			),
		});
	}

	return measured;
}

/** Fan / depth from cached rows plus live `scrollTop`. No layout reads. */
export function writeMeasuredAgentSessionDeck(
	measured: readonly MeasuredDeckItem[],
	portLength: number,
	scrollTop: number,
	collapse: number,
	willChange: string,
	deck: AgentSessionDeck,
): void {
	const runs = groupDeckRuns(measured.map((item: MeasuredDeckItem) => item.row));
	let index = 0;
	for (const run of runs) {
		const frame = deckRunFrame(run, portLength, scrollTop, collapse, deck);
		const zIndex = deckRunZIndex(deck, run.top);
		for (let rowIndex = 0; rowIndex < run.rows.length; rowIndex++) {
			const item = measured[index];
			index += 1;
			if (item === undefined) {
				continue;
			}
			writeMeasuredItem(item, frame, zIndex, willChange);
		}
	}
}

export function writeAgentSessionDeck(
	port: HTMLElement,
	collapse: number,
	willChange: string,
	deck: AgentSessionDeck,
): void {
	writeMeasuredAgentSessionDeck(
		measureAgentSessionDeck(port),
		port.clientHeight,
		port.scrollTop,
		collapse,
		willChange,
		deck,
	);
}

function writeMeasuredItem(
	item: MeasuredDeckItem,
	frame: DeckRunFrame,
	zIndex: number,
	willChange: string,
): void {
	const style = deckHostStyle(frame, frame.originTop - item.row.top, willChange);
	if (style === null) {
		clearDeckItem(item.host, item.li);
		return;
	}
	item.host.style.opacity = style.opacity;
	item.host.style.transform = style.transform;
	item.host.style.transformOrigin = style.transformOrigin;
	item.host.style.willChange = style.willChange;
	item.li.style.zIndex = String(zIndex);
}

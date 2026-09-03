import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const requireRegistrySource = createRequire(import.meta.url);
const { readWebsiteRegistrySource } = requireRegistrySource(process.cwd() + "/components/website/registry/test-source.cjs");
const ROOT = process.cwd();

function readProjectFile(filePath) {
	return readFileSync(path.join(ROOT, filePath), "utf8");
}

const ENTRY = /visualComponent\("scrolling", "Scrolling", "@\/components\/visual\/scrolling"\)/u;

test("Scrolling is registered in both visual catalogs", () => {
	// Two separate sources: `verify:catalog` only reads component-manifest.ts,
	// while `app/visual/[slug]/page.tsx` resolves slugs through components.ts.
	// A one-sided landing therefore 404s the route with a green catalog gate.
	assert.match(readProjectFile("app/data/components.ts"), ENTRY);
	assert.match(readProjectFile("app/data/component-manifest.ts"), ENTRY);
});

test("Scrolling docs register the detail leaf and the preview demo", () => {
	assert.match(readProjectFile("app/data/details/visual.ts"), /scrolling: SCROLLING_DETAIL,/u);
	assert.match(
		readWebsiteRegistrySource(),
		/scrolling: dynamic\(\(\) => import\("\.\/demos\/visual\/scrolling-demo"\)/u,
	);
});

test("the detached card re-asserts its own bottom border", () => {
	// `agent-session-card.tsx` kills the bottom stroke with
	// `[li:not(:last-child)_&]:border-b-0`, which Tailwind compiles to a
	// DESCENDANT selector — so Ticker's `<li class="ticker-item">`, which stops
	// being `:last-child` as soon as the loop appends clones, strips the border
	// off every card. `.cls li:last-child article` is (0,2,2) and beats the
	// block's (0,2,1) without `!important`. Same shape as `AGENT_SESSION_WELL_LIST`
	// in `components/blocks/agent-session-column/index.tsx`.
	assert.match(
		readProjectFile("components/visual/scrolling/scrolling-card.tsx"),
		/\[&_li:last-child_article\]:border-b(?!-)/u,
	);
});

test("the depth tail subscribes to Ticker's motion 12 values explicitly", () => {
	// motion-plus pins `motion ^12` and pnpm gives it its own copy, so Ticker's
	// values are motion 12 while this package imports motion 13. The zero-argument
	// `useTransform(() => tickerValue.get())` discovers dependencies through
	// motion-dom's module-level `collectMotionValues` singleton — and a motion 12
	// `.get()` registers with motion-dom 12's singleton, which motion-dom 13 never
	// reads. The tail then captured only `collapse`, which stops changing once the
	// entrance lands, so the scale-and-tuck froze at whatever each card measured
	// when the unfurl finished. Verified in-browser: after a 280px drag every
	// scale was byte-identical while the cards had moved a third of the
	// scrollport, and a forced re-render snapped them all to correct values.
	// `.on("change", …)` is duck-typed and crosses the split safely.
	const bridge = readProjectFile("components/visual/scrolling/use-card-top.ts");
	assert.match(bridge, /renderedOffset\.on\("change", sync\)/u);
	assert.match(bridge, /projection\.on\("change", sync\)/u);
});

test("the card reads its scroll position through the bridge, not Ticker directly", () => {
	const card = readProjectFile("components/visual/scrolling/scrolling-card.tsx");
	assert.match(card, /const cardTop = useCardTop\(\);/u);
	// Destructuring Ticker's own `offset` / `projection` here would put motion 12
	// values back inside a motion 13 `useTransform` and refreeze the tail.
	const tickerItem = /useTickerItem\(\)/u;
	assert.match(card, tickerItem);
	assert.doesNotMatch(card, /offset: itemOffset/u);
	assert.doesNotMatch(card, /\bprojection,[^\n]*\} = useTickerItem\(\)/u);
});

test("the focus reveal only ever fires for keyboard focus", () => {
	// `focusin` fires for a MOUSE press too. Revealing there scrolled the list
	// out from under the pointer between `pointerdown` and `pointerup`, so a
	// click on a card action near the bottom fade was silently swallowed.
	// `isKeyboardFocus` is the shared `:focus-visible` discrimination, and
	// `use-scrolling-gestures.ts` gates its wheel engagement on the same rule.
	const focus = readProjectFile("components/visual/scrolling/use-scrolling-focus.ts");
	assert.match(focus, /if \(!isKeyboardFocus\(target\)\) return;/u);
	assert.match(
		readProjectFile("components/visual/scrolling/use-scrolling-gestures.ts"),
		/isKeyboardFocus\(target\)/u,
	);
	// One authority, not a copy per listener.
	assert.match(readProjectFile("components/visual/scrolling/lib.ts"), /export function isKeyboardFocus/u);
});

test("the paint order follows the loop, not the static item index", () => {
	// The z-ladder has to be monotonic across the wrap: keyed on `itemIndex` it
	// resets from itemCount-1 back to 0 once per period, so exactly one adjacent
	// pair paints inverted wherever the depth tail has made them overlap.
	const card = readProjectFile("components/visual/scrolling/scrolling-card.tsx");
	assert.match(card, /const loopPosition = useCardLoopPosition\(\);/u);
	assert.match(card, /useStackOrder\(wrapperRef, stackOrder, loopPosition\)/u);
	assert.doesNotMatch(card, /stackZIndex\([^)]*itemIndex/u);
	// Live order means a live write: routing it through a prop would re-render
	// the whole AgentSession subtree every time a card wrapped, mid-drag, and
	// deriving it through a combined MotionValue first left every clone on the
	// seed layer (see `use-stack-order.ts`).
	const stack = readProjectFile("components/visual/scrolling/use-stack-order.ts");
	assert.match(stack, /loopPosition\.on\("change", apply\)/u);
	assert.match(stack, /stackZIndex\(order, position\)/u);
});

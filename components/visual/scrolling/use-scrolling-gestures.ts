"use client";

import {
	useCallback,
	useEffect,
	useRef,
	type MouseEvent as ReactMouseEvent,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
} from "react";

import { isKeyboardFocus, shouldCaptureWheel } from "./lib";
import type { ScrollingOffset } from "./scrolling-offset-bridge";

/**
 * Pointer travel (px) beyond which a press is treated as a pan rather than a
 * click. Below this, the press falls through to whatever it landed on.
 */
const DRAG_THRESHOLD_PX = 5;

export interface ScrollingGestures {
	onClickCapture: (event: ReactMouseEvent<HTMLElement>) => void;
	onPointerCancelCapture: (event: ReactPointerEvent<HTMLElement>) => void;
	onPointerDownCapture: (event: ReactPointerEvent<HTMLElement>) => void;
	onPointerMoveCapture: (event: ReactPointerEvent<HTMLElement>) => void;
	onPointerUpCapture: (event: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * Wheel scrolling, touch/wheel engagement, and drag/click disambiguation for
 * the Scrolling scroller.
 *
 * Ticker owns the drag gesture itself (Motion's `drag` on its root, throwing our
 * `offset` with its own inertia on release), so this hook only covers the three
 * things Ticker cannot: writing `offset` from the wheel, publishing the
 * `data-engaged` state the wheel listener and the coarse-pointer `touch-action`
 * override both key on, and stopping the click that trails a drag from
 * activating whatever card was under the pointer.
 *
 * ## Engagement, and why touch needs it
 *
 * Motion writes `touch-action: pan-x` inline on Ticker's root for `drag="y"`,
 * and that root fills the whole scrollport. On a touch device that hands EVERY
 * vertical gesture over the component to the drag; a normal vertical scroller
 * would hand the axis back by scroll-chaining at its end, but this list loops
 * forever so there is no end and no handoff. Measured at 390x780: a touch scroll
 * starting on the component moved the page 0px, the same gesture 260px below it
 * moved the page 249px.
 *
 * `scrolling-viewport.tsx` overrides `touch-action` to `pan-y` while
 * `data-engaged="false"` on coarse pointers, so a passing reader keeps their
 * page scroll and a deliberate tap hands the list its axis. `touch-action` is
 * latched by the compositor at gesture start, so engagement can only ever
 * affect the NEXT gesture — which is why the viewport also renders a
 * coarse-pointer-only "Tap, then drag" hint while disengaged.
 *
 * ## Why the drag/click half is a copy of `use-drag-scroll.ts`
 *
 * `components/blocks/gallery/hooks/use-drag-scroll.ts` solves the same
 * disambiguation with the same 5px threshold and the same rAF-deferred reset,
 * and the reset comment there explains the hazard both need to avoid. It is
 * deliberately NOT reused, because the two hooks only LOOK alike:
 *
 * - That hook OWNS the pan. It takes pointer capture on the container and writes
 *   `container.scrollLeft` itself. Here Motion's `drag` on Ticker's root owns
 *   the gesture, including its own pointer capture; a second capture-taking hook
 *   on the same element would fight it and break the inertia throw.
 * - It therefore also refuses non-mouse pointers (touch keeps native momentum),
 *   while Ticker's drag is the only scroll touch users get here.
 * - Its axis is `clientX`; ours is `clientY`. Extracting a shared hook would mean
 *   parameterising the axis AND making the pan itself pluggable (native
 *   `scrollLeft` vs a `MotionValue`) plus optional pointer capture — three
 *   options for two callers, which is a worse abstraction than the ~15 duplicated
 *   lines. What is genuinely shared is the RULE (5px, rAF-deferred reset), and
 *   that is what these comments pin.
 */
export function useScrollingGestures({
	containerRef,
	offset,
	wheel,
}: Readonly<{
	containerRef: RefObject<HTMLElement | null>;
	/** `null` until the ticker's offset has been lifted out of its context. */
	offset: ScrollingOffset | null;
	wheel: boolean;
}>): ScrollingGestures {
	const wasDraggedRef = useRef(false);
	const isPressedRef = useRef(false);
	const startYRef = useRef(0);

	useEffect(() => {
		const container = containerRef.current;
		if (container === null || offset === null) return;

		// Two INDEPENDENT reasons to be engaged; engaged = pointer || focus.
		// Keeping them apart is what lets a mouse user disengage by leaving while
		// a keyboard user who still has focus inside keeps the wheel.
		let pointerEngaged = false;
		let focusEngaged = false;
		let attached = false;

		const handleWheel = (event: WheelEvent) => {
			// `true` because the listener is only ever attached while engaged;
			// the predicate still owns the axis rule and the non-finite guard.
			if (!shouldCaptureWheel(true, event.deltaX, event.deltaY)) return;
			event.preventDefault();
			// A drag throw is a running inertia animation writing `offset` every
			// frame; `set` alone would be overwritten immediately.
			offset.stop();
			// 1:1 with the wheel delta. The OS already supplies trackpad momentum,
			// so layering a glide of our own would double it.
			offset.set(offset.get() - event.deltaY);
		};

		// The wheel listener is ADDED and REMOVED on engagement rather than left
		// in place with a branch inside. A passive listener cannot `preventDefault`
		// at all and there is no per-event opt-in, so it has to be non-passive —
		// and a permanently registered non-passive wheel listener costs the page
		// its compositor fast path over this box even when the reader is only
		// scrolling past it. Attaching on engagement is the only wiring where a
		// disengaged component is genuinely zero-cost.
		//
		// `data-engaged` is written on EVERY sync, including when `wheel` is
		// false. It is not just wheel bookkeeping: the coarse-pointer
		// `touch-action` override in `scrolling-viewport.tsx` is keyed on it, and
		// gating the attribute on `wheel` would silently re-open the touch trap
		// for any consumer that passes `wheel={false}`.
		const sync = () => {
			const next = pointerEngaged || focusEngaged;
			// Written imperatively, NOT through React state: engagement flips on
			// `pointerdown`, and re-rendering `<Ticker>` on the press that starts
			// a drag is exactly the kind of thing that disturbs its gesture.
			container.dataset.engaged = next ? "true" : "false";
			if (!wheel || next === attached) return;
			attached = next;
			if (next) container.addEventListener("wheel", handleWheel, { passive: false });
			else container.removeEventListener("wheel", handleWheel);
		};

		// One document-level press covers both directions: inside engages,
		// outside disengages. Touch needs the outside half — see `onPointerLeave`
		// — and a mouse user gets a second, equally correct way to hand scrolling
		// back to the page.
		const onPointerDown = (event: PointerEvent) => {
			pointerEngaged = container.contains(event.target as Node | null);
			sync();
		};
		const onPointerLeave = (event: PointerEvent) => {
			// A Motion drag that leaves the box fires `pointerleave` with
			// `buttons === 1`. Disengaging there would drop the wheel mid-gesture.
			if (event.buttons !== 0) return;
			// A touch pointer is DESTROYED on release, which fires `pointerleave`
			// immediately afterwards. Honouring it would disengage after every
			// single touch, and since `touch-action` is latched by the compositor
			// at gesture start, the list could then never be dragged by touch at
			// all. Touch disengages on a press outside instead.
			if (event.pointerType === "touch") return;
			pointerEngaged = false;
			sync();
		};
		const onPointerRelease = (event: PointerEvent) => {
			if (event.pointerType === "touch") return;
			// A drag released OUTSIDE the box produces no further `pointerleave`,
			// so the leave-based reset never runs. Re-check on release.
			if (container.contains(event.target as Node | null)) return;
			pointerEngaged = false;
			sync();
		};
		const onFocusIn = (event: FocusEvent) => {
			const target = event.target;
			// Keyboard focus only. A mouse click on a card action focuses the
			// button in Chrome; that must not silently install wheel capture that
			// outlives the pointer leaving. `isKeyboardFocus` is the shared
			// authority for that rule — `use-scrolling-focus.ts` needs the same
			// discrimination for its reveal.
			if (!(target instanceof Element) || !isKeyboardFocus(target)) return;
			focusEngaged = true;
			sync();
		};
		const onFocusOut = (event: FocusEvent) => {
			if (container.contains(event.relatedTarget as Node | null)) return;
			focusEngaged = false;
			sync();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			// After a mouse click inside, `document.activeElement` is `<body>`, so
			// a container-scoped keydown listener would never see Escape. It has
			// to live on the document. Deliberately no `preventDefault` and no
			// `stopPropagation` — Escape still belongs to any open dialog.
			pointerEngaged = false;
			focusEngaged = false;
			sync();
		};

		container.dataset.engaged = "false";
		container.addEventListener("pointerleave", onPointerLeave, { passive: true });
		container.addEventListener("focusin", onFocusIn);
		container.addEventListener("focusout", onFocusOut);
		document.addEventListener("pointerdown", onPointerDown, { passive: true });
		window.addEventListener("pointerup", onPointerRelease, { passive: true });
		window.addEventListener("pointercancel", onPointerRelease, { passive: true });
		document.addEventListener("keydown", onKeyDown);

		return () => {
			container.removeEventListener("pointerleave", onPointerLeave);
			container.removeEventListener("focusin", onFocusIn);
			container.removeEventListener("focusout", onFocusOut);
			document.removeEventListener("pointerdown", onPointerDown);
			window.removeEventListener("pointerup", onPointerRelease);
			window.removeEventListener("pointercancel", onPointerRelease);
			document.removeEventListener("keydown", onKeyDown);
			if (attached) container.removeEventListener("wheel", handleWheel);
			// Left at "false", not deleted: the `touch-action` override is keyed
			// on the attribute being present and disengaged.
			container.dataset.engaged = "false";
		};
	}, [containerRef, offset, wheel]);

	const onPointerDownCapture = useCallback((event: ReactPointerEvent<HTMLElement>) => {
		isPressedRef.current = true;
		// Reset on each fresh press so a prior pan cannot swallow this click.
		wasDraggedRef.current = false;
		startYRef.current = event.clientY;
	}, []);

	const onPointerMoveCapture = useCallback((event: ReactPointerEvent<HTMLElement>) => {
		if (!isPressedRef.current || wasDraggedRef.current) return;
		if (Math.abs(event.clientY - startYRef.current) > DRAG_THRESHOLD_PX) {
			wasDraggedRef.current = true;
		}
	}, []);

	const endPress = useCallback(() => {
		isPressedRef.current = false;
		if (typeof requestAnimationFrame === "undefined") {
			wasDraggedRef.current = false;
			return;
		}
		// Clear AFTER the trailing synthetic click (dispatched in the same task as
		// pointerup, well before the next frame), but before any later interaction.
		requestAnimationFrame(() => {
			wasDraggedRef.current = false;
		});
	}, []);

	const onClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
		if (!wasDraggedRef.current) return;
		// Capture phase, so this beats every card handler below. Keyboard
		// activation is untouched: it never sets the flag in the first place.
		event.preventDefault();
		event.stopPropagation();
	}, []);

	return {
		onClickCapture,
		onPointerCancelCapture: endPress,
		onPointerDownCapture,
		onPointerMoveCapture,
		onPointerUpCapture: endPress,
	};
}

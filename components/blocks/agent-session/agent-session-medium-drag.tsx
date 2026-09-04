"use client";

import {
	useEffect,
	useRef,
	useState,
	type MouseEvent as ReactMouseEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";

import {
	sessionDragChipViewportStyle,
	type JiraIssueAgentSessionDragBinding,
	type JiraIssueAgentSessionDragSource,
} from "@/components/blocks/jira-issue/agent-session-drag";
import { AgentSessionMentionChip } from "@/components/blocks/jira-issue/agent-session-mention-chip";
import { useSessionDragChipPointer } from "@/components/blocks/jira-issue/use-session-drag-chip-pointer";
import {
	usePointerDrag,
	type PointerDragPosition,
} from "@/components/ui-custom/hooks/use-pointer-drag";
import { cn } from "@/lib/utils";

import { toJiraIssueAgentActivityFromSession } from "./agent-session-work-item";
import type { AgentSessionItem } from "./agent-session-types";

const SESSION_DRAG_ORIGIN: PointerDragPosition = { x: 0, y: 0 };
/** Same 2px threshold as `usePointerDrag` — publish/arm only after a real move. */
const SESSION_DRAG_PUBLISH_THRESHOLD_PX = 2;
const SESSION_DRAG_CHIP_DISTANCE_PX = 12;
export const SESSION_DRAG_INTERACTIVE_SELECTOR = [
	"button",
	"a",
	"input",
	"select",
	"textarea",
	"[role=menuitem]",
	"[data-session-drag-ignore]",
].join(", ");

export function AgentSessionMediumDrag({
	item,
	preserveSourceFootprint = false,
	sessionDrag,
	shouldReduceMotion,
	source = "detached",
	children,
}: Readonly<{
	item: AgentSessionItem;
	preserveSourceFootprint?: boolean;
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	shouldReduceMotion: boolean | null;
	source?: JiraIssueAgentSessionDragSource;
	children: (bind: Record<string, unknown> | undefined) => ReactElement;
}>) {
	const activity = toJiraIssueAgentActivityFromSession(item);
	const [dragOffset, setDragOffset] = useState<PointerDragPosition>(SESSION_DRAG_ORIGIN);
	const [publishedDragging, setPublishedDragging] = useState(false);
	const [sourceHeight, setSourceHeight] = useState<number | undefined>(undefined);
	const drag = usePointerDrag(dragOffset, setDragOffset, sessionDrag?.bounds);
	const chipPointer = useSessionDragChipPointer(shouldReduceMotion);
	const isDragging = Boolean(sessionDrag) && drag.dragging && publishedDragging;
	const isDraggedOut = isDragging
		&& Math.hypot(drag.position.x, drag.position.y) >= SESSION_DRAG_CHIP_DISTANCE_PX;

	const pointerOriginRef = useRef<PointerDragPosition | null>(null);
	const didPublishDragRef = useRef(false);
	const dragTargetRef = useRef<HTMLElement | null>(null);

	function publishSessionDrag(
		dragging: boolean,
		event?: ReactPointerEvent<HTMLElement>,
		cancelled = false,
	) {
		sessionDrag?.onDragStateChange({
			activities: [activity],
			cancelled,
			dragging,
			pointer: event ? { x: event.clientX, y: event.clientY } : null,
			source: source,
		});
	}

	function endSessionDrag(event: ReactPointerEvent<HTMLElement>) {
		if (pointerOriginRef.current === null) {
			return;
		}
		drag.bind.onPointerUp(event);
		pointerOriginRef.current = null;
		dragTargetRef.current = null;
		setPublishedDragging(false);
		setSourceHeight(undefined);
		setDragOffset(SESSION_DRAG_ORIGIN);
		publishSessionDrag(false, event);
	}

	function cancelSessionDrag(event: ReactPointerEvent<HTMLElement>) {
		if (pointerOriginRef.current === null) {
			return;
		}
		drag.bind.onPointerCancel(event);
		drag.bind.onClick();
		pointerOriginRef.current = null;
		dragTargetRef.current = null;
		didPublishDragRef.current = false;
		setPublishedDragging(false);
		setSourceHeight(undefined);
		setDragOffset(SESSION_DRAG_ORIGIN);
		publishSessionDrag(false, undefined, true);
	}

	const endSessionDragRef = useRef(endSessionDrag);
	const cancelSessionDragRef = useRef(cancelSessionDrag);

	useEffect(() => {
		endSessionDragRef.current = endSessionDrag;
		cancelSessionDragRef.current = cancelSessionDrag;
	});

	// Capture lives on this host. If a descendant unmounts or CDP drops the
	// element listener, window still ends the gesture so the card cannot stick
	// in the attach-chin preview.
	useEffect(() => {
		if (!isDragging) {
			return undefined;
		}

		function toHostEvent(event: PointerEvent): ReactPointerEvent<HTMLElement> {
			return {
				currentTarget: dragTargetRef.current ?? (event.target as HTMLElement),
				pointerId: event.pointerId,
				clientX: event.clientX,
				clientY: event.clientY,
			} as ReactPointerEvent<HTMLElement>;
		}

		function onPointerUp(event: PointerEvent) {
			endSessionDragRef.current(toHostEvent(event));
		}

		function onPointerCancel(event: PointerEvent) {
			cancelSessionDragRef.current(toHostEvent(event));
		}

		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("pointercancel", onPointerCancel);
		return () => {
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("pointercancel", onPointerCancel);
		};
	}, [isDragging]);

	const { onKeyDown: _ignoredPointerDragKeyDown, ...dragBindWithoutKeyboard } = drag.bind;
	void _ignoredPointerDragKeyDown;
	const sessionDragBind = sessionDrag
		? {
			...dragBindWithoutKeyboard,
			onFocus: () => sessionDrag.onFocusedActivitiesChange([activity]),
			onMouseDown: (event: ReactMouseEvent<HTMLElement>) => {
				const interactiveTarget = event.target instanceof Element
					? event.target.closest(SESSION_DRAG_INTERACTIVE_SELECTOR)
					: null;
				if (interactiveTarget !== null && interactiveTarget !== event.currentTarget) {
					return;
				}
				event.preventDefault();
			},
			onClickCapture: (event: ReactMouseEvent<HTMLElement>) => {
				if (!didPublishDragRef.current) {
					return;
				}
				didPublishDragRef.current = false;
				drag.bind.onClick();
				event.preventDefault();
				event.stopPropagation();
			},
			onPointerCancel: cancelSessionDrag,
			onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
				const interactiveTarget = event.target instanceof Element
					? event.target.closest(SESSION_DRAG_INTERACTIVE_SELECTOR)
					: null;
				if (interactiveTarget !== null && interactiveTarget !== event.currentTarget) {
					return;
				}
				didPublishDragRef.current = false;
				dragTargetRef.current = event.currentTarget;
				setSourceHeight(event.currentTarget.getBoundingClientRect().height);
				drag.bind.onPointerDown(event);
				pointerOriginRef.current = { x: event.clientX, y: event.clientY };
				chipPointer.snapToPointer(
					{ x: event.clientX, y: event.clientY },
				);
			},
			onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
				drag.bind.onPointerMove(event);
				chipPointer.followPointer(
					{ x: event.clientX, y: event.clientY },
				);
				const origin = pointerOriginRef.current;
				const moved = Boolean(
					origin
					&& (
						Math.abs(event.clientX - origin.x) > SESSION_DRAG_PUBLISH_THRESHOLD_PX
						|| Math.abs(event.clientY - origin.y) > SESSION_DRAG_PUBLISH_THRESHOLD_PX
					),
				);
				if (moved) {
					didPublishDragRef.current = true;
					setPublishedDragging(true);
					publishSessionDrag(true, event);
				}
			},
			onPointerUp: endSessionDrag,
		}
		: undefined;

	if (!sessionDrag) {
		return children(undefined);
	}

	const chip = (
		<div
			aria-hidden
			className="pointer-events-none flex w-fit max-w-full -translate-x-1/2 -translate-y-1/2 items-center justify-start"
			data-session-chip-centered=""
		>
			<AgentSessionMentionChip
				avatarSrc={item.agent.avatarSrc}
				brandName={item.agent.brandName}
				elevated
				name={item.agent.name}
				vpkLogo={item.agent.vpkLogo}
			/>
		</div>
	);

	return (
		<div
			className={cn(
				"min-w-0",
				isDragging && "relative w-full",
				isDragging && !preserveSourceFootprint && (isDraggedOut ? "h-0" : "h-[33px]"),
			)}
			data-session-chip-out={isDraggedOut || undefined}
			data-session-drag-placeholder={preserveSourceFootprint || undefined}
			style={{ height: isDragging && preserveSourceFootprint ? sourceHeight : undefined }}
		>
			{/* The bound source stays mounted (but transparent) for the whole
			    gesture, preserving pointer capture while the chip travels. */}
			<div
				className={cn(
					"min-w-0",
					isDragging && "pointer-events-none absolute inset-x-0 top-0 opacity-0",
					sessionDragBind && "cursor-grab touch-none select-none",
					isDragging && "cursor-grabbing [&_article]:cursor-grabbing",
				)}
			>
				{children(sessionDragBind)}
			</div>
			{isDragging ? createPortal(
				<motion.div
					aria-hidden
					// Above the docked panel (z-40) and session hover flyout (z-200).
					className="pointer-events-none left-0 top-0 z-[400] w-fit"
					data-session-chip-out={isDraggedOut || undefined}
					data-session-drag-overlay=""
					data-session-dragging=""
					style={{
						x: chipPointer.x,
						y: chipPointer.y,
						...sessionDragChipViewportStyle(true),
					}}
				>
					{chip}
				</motion.div>,
				document.body,
			) : null}
		</div>
	);
}

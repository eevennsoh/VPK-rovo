"use client";

import {
	useEffect,
	useRef,
	useState,
	type MouseEvent as ReactMouseEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactElement,
} from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

import type { JiraIssueAgentSessionDragBinding } from "@/components/blocks/jira-issue/agent-session-drag";
import { AgentSessionMentionChip } from "@/components/blocks/jira-issue/agent-session-mention-chip";
import {
	usePointerDrag,
	type PointerDragPosition,
} from "@/components/ui-custom/hooks/use-pointer-drag";
import { Gooey } from "@/components/visual/gooey";
import { cn } from "@/lib/utils";

import { toJiraIssueAgentActivityFromSession } from "./agent-session-work-item";
import type { AgentSessionItem } from "./agent-session-types";

const SESSION_DRAG_ORIGIN: PointerDragPosition = { x: 0, y: 0 };
const SESSION_DRAG_DISSOLVE_FADE_MS = 240;
const SESSION_DRAG_DISSOLVE_SINK = 0.8;
const SESSION_DRAG_MORPH = { advanced: { blobInset: 3, bridgeGrow: 7 } } as const;
const SESSION_DRAG_CHIP_MORPH = { advanced: { blobInset: 14, bridgeGrow: 0 } } as const;
const SESSION_DRAG_CHIP_DISTANCE_PX = 12;
const SESSION_DRAG_SPRING = { damping: 26, mass: 0.6, stiffness: 420, restDelta: 0.01 } as const;

export function AgentSessionMediumDrag({
	item,
	sessionDrag,
	shouldReduceMotion,
	children,
}: Readonly<{
	item: AgentSessionItem;
	sessionDrag?: JiraIssueAgentSessionDragBinding;
	shouldReduceMotion: boolean | null;
	children: (bind: Record<string, unknown> | undefined) => ReactElement;
}>) {
	const activity = toJiraIssueAgentActivityFromSession(item);
	const [dragOffset, setDragOffset] = useState<PointerDragPosition>(SESSION_DRAG_ORIGIN);
	const drag = usePointerDrag(dragOffset, setDragOffset, sessionDrag?.bounds);
	const dragOffsetX = useMotionValue(0);
	const dragOffsetY = useMotionValue(0);
	const springX = useSpring(dragOffsetX, SESSION_DRAG_SPRING);
	const springY = useSpring(dragOffsetY, SESSION_DRAG_SPRING);
	const dragX = shouldReduceMotion ? dragOffsetX : springX;
	const dragY = shouldReduceMotion ? dragOffsetY : springY;
	const isDragging = Boolean(sessionDrag) && drag.dragging;
	const isDraggedOut = isDragging
		&& Math.hypot(drag.position.x, drag.position.y) >= SESSION_DRAG_CHIP_DISTANCE_PX;

	useEffect(() => {
		dragOffsetX.set(drag.position.x);
		dragOffsetY.set(drag.position.y);
	}, [dragOffsetX, dragOffsetY, drag.position.x, drag.position.y]);

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
			source: "detached",
		});
	}

	function endSessionDrag(event: ReactPointerEvent<HTMLElement>) {
		drag.bind.onPointerUp(event);
		setDragOffset(SESSION_DRAG_ORIGIN);
		publishSessionDrag(false, event);
	}

	function cancelSessionDrag(event: ReactPointerEvent<HTMLElement>) {
		drag.bind.onPointerCancel(event);
		setDragOffset(SESSION_DRAG_ORIGIN);
		publishSessionDrag(false, undefined, true);
	}

	const hostRef = useRef<HTMLDivElement | null>(null);
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
				currentTarget: hostRef.current ?? (event.target as HTMLElement),
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
	const sessionDragBind = sessionDrag
		? {
			...dragBindWithoutKeyboard,
			onFocus: () => sessionDrag.onFocusedActivitiesChange([activity]),
			onMouseDown: (event: ReactMouseEvent<HTMLElement>) => {
				event.preventDefault();
			},
			onPointerCancel: cancelSessionDrag,
			onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
				drag.bind.onPointerDown(event);
				publishSessionDrag(true, event);
			},
			onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
				drag.bind.onPointerMove(event);
				if (drag.dragging) {
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
			className="pointer-events-none flex w-fit max-w-full items-center justify-start"
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
				isDragging && (isDraggedOut ? "h-0" : "h-[33px]"),
			)}
			data-session-chip-out={isDraggedOut || undefined}
		>
			{isDragging && !isDraggedOut ? (
				<Gooey.Item observe>
					<div aria-hidden className="pointer-events-none h-[33px] w-full rounded-[10px]" />
				</Gooey.Item>
			) : null}
			<Gooey.Item
				observe
				dissolve={{
					active: !shouldReduceMotion && drag.dragging && !isDraggedOut,
					fadeMs: SESSION_DRAG_DISSOLVE_FADE_MS,
					sink: SESSION_DRAG_DISSOLVE_SINK,
				}}
				morph={isDraggedOut ? SESSION_DRAG_CHIP_MORPH : SESSION_DRAG_MORPH}
			>
				{/* Bind stays on this host for the whole gesture. Swapping in a
				    new chip button on drag-start dropped pointer capture, so
				    pointerup never fired and the card stuck on an empty chin. */}
				<motion.div
					ref={hostRef}
					aria-label={isDragging ? `Attach ${item.agent.name} to this work item` : undefined}
					aria-roledescription={isDragging ? "Draggable agent session" : undefined}
					className={cn(
						"min-w-0 outline-none",
						isDragging && "absolute top-0 z-20",
						isDragging && (isDraggedOut ? "left-0 w-fit" : "inset-x-0"),
						sessionDragBind && "touch-none select-none",
					)}
					data-session-chip-out={isDraggedOut || undefined}
					data-session-dragging={isDragging || undefined}
					data-slot="jira-issue-agent-row"
					style={{ x: dragX, y: dragY }}
					{...sessionDragBind}
				>
					{isDragging ? chip : children(undefined)}
				</motion.div>
			</Gooey.Item>
		</div>
	);
}

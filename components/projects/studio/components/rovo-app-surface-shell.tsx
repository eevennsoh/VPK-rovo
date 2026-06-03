"use client";

import type { ReactNode } from "react";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import TopNavigation, {
	type ShellSidebarSlotState,
} from "@/components/blocks/top-navigation/page";
import { RovoAppSidebar } from "@/components/projects/studio/components/rovo-app-sidebar";
import { useRovoAppThreadList } from "@/components/projects/studio/hooks/use-rovo-app-thread-list";
import { buildRovoAppThreadPath } from "@/components/projects/studio/lib/rovo-app-thread-route-sync";

const SIDEBAR_MOTION_DURATION_CSS_VARIABLE = "--duration-medium";
const SIDEBAR_MOTION_FALLBACK_MS = 200;

function getCssDurationTokenMs(tokenName: string, fallbackMs: number): number {
	if (typeof window === "undefined") {
		return fallbackMs;
	}
	const tokenValue = window
		.getComputedStyle(document.documentElement)
		.getPropertyValue(tokenName);
	const parsed = Number.parseFloat(tokenValue);
	return Number.isFinite(parsed) ? parsed : fallbackMs;
}

interface RovoAppSurfaceShellProps {
	children: ReactNode;
}

export function RovoAppSurfaceShell({ children }: Readonly<RovoAppSurfaceShellProps>) {
	const router = useRouter();
	const { deleteThread, threads, threadsLoaded } = useRovoAppThreadList();

	// Hover-reveal sidebar
	const [hoverRevealActive, setHoverRevealActive] = useState(false);
	const hoverLeaveTimerRef = useRef<number | null>(null);

	const clearHoverTimer = useCallback(() => {
		if (hoverLeaveTimerRef.current) {
			window.clearTimeout(hoverLeaveTimerRef.current);
			hoverLeaveTimerRef.current = null;
		}
	}, []);

	const scheduleSidebarHoverClose = useCallback(() => {
		clearHoverTimer();
		hoverLeaveTimerRef.current = window.setTimeout(() => {
			setHoverRevealActive(false);
		}, getCssDurationTokenMs(SIDEBAR_MOTION_DURATION_CSS_VARIABLE, SIDEBAR_MOTION_FALLBACK_MS));
	}, [clearHoverTimer]);

	const handleSidebarContentMouseEnter = useCallback(() => {
		clearHoverTimer();
	}, [clearHoverTimer]);

	const handleSidebarContentMouseLeave = useCallback(() => {
		scheduleSidebarHoverClose();
	}, [scheduleSidebarHoverClose]);

	useEffect(() => {
		return () => clearHoverTimer();
	}, [clearHoverTimer]);

	return (
		<TopNavigation
			variant="shell"
			product="studio"
			sidebar={(slot: ShellSidebarSlotState) => (
				<RovoAppSidebar
					activeThreadId={null}
					headerOffsetPx={slot.headerOffsetPx}
					hoverOpen={hoverRevealActive}
					isResizing={slot.isResizing}
					onCancelThreadRun={() => Promise.resolve()}
					onDeleteThread={async (threadId) => {
						startTransition(() => {
							void deleteThread(threadId);
						});
					}}
					onNewChat={() => {
						router.push("/studio");
					}}
					onSelectThread={async (threadId) => {
						router.push(buildRovoAppThreadPath(threadId));
					}}
					onSidebarMouseEnter={handleSidebarContentMouseEnter}
					onSidebarMouseLeave={handleSidebarContentMouseLeave}
					resizeHandle={slot.resizeHandle}
					threads={threads}
					threadsLoaded={threadsLoaded}
					topOffset
				/>
			)}
		>
			{children}
		</TopNavigation>
	);
}

"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import {
	AGENT_SESSION_ITEMS,
	AgentSessionCard,
	toJiraIssueAgentActivityFromSession,
	type AgentSessionItem,
} from "@/components/blocks/agent-session";
import { toAgentSessionUntrackedWorkFlyoutItem } from "@/components/blocks/agent-session/agent-session-work-item";
import { createJiraSessionFlyoutHandle } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import {
	JiraIssue,
	type JiraIssueAgentLinkFlash,
	type JiraIssueAgentSessionDragControl,
} from "@/components/blocks/jira-issue";
import {
	AGENT_BRAND_TINT_FALLBACK,
	resolveAgentBrandTint,
	resolveAgentBrandTintHex,
} from "@/components/blocks/jira-kanban/experimental/lib/agent-brand-tint";
import {
	JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	type JiraIssueAgentSessionDragState,
} from "@/components/blocks/jira-issue/agent-session-drag";
import type { PointerDragPosition } from "@/components/ui-custom/hooks/use-pointer-drag";
import { Button } from "@/components/ui/button";
import {
	JiraLinking,
	resolveJiraLinkingNearness,
	type JiraLinkingIdentity,
	type JiraLinkingTarget,
} from "@/components/blocks/jira-linking";

/**
 * The travelling at-mention chip `AgentSessionMediumDrag` portals to the body.
 *
 * The same selector `jira-golden-journeys-v4` measures. Only one drag can be in
 * flight at a time, so a document-wide selector is correct here even with
 * several stages on the page — the chip exists only while a gesture is running.
 */
const CHIP_SELECTOR = "[data-session-drag-overlay] [data-session-fusion-chip]";

/**
 * The card's own agent shell — the grey backdrop the session is absorbed into.
 * v4 targets this exact node, so the demo measures it the same way instead of
 * approximating with the wrapper's rect.
 */
const SHELL_SELECTOR = '[data-slot="jira-issue-agent-shell"]';

/** Matches `AGENT_ACTIVITY_SHELL_STYLE.borderRadius` on the real card. */
const SHELL_RADIUS_PX = 10;

interface Rect {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

interface Approach {
	inside: boolean;
	nearness: number;
	/** The whole shell — what the field grows into during the approach. */
	target: JiraLinkingTarget | null;
}

const IDLE_APPROACH: Approach = {
	inside: false,
	nearness: 0,
	target: null,
};

function distanceToRect(point: PointerDragPosition, rect: Rect): number {
	const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
	const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
	return Math.hypot(dx, dy);
}

function toRect(node: Element | null | undefined): Rect | null {
	if (!node) {
		return null;
	}
	const { bottom, height, left, right, top, width } = node.getBoundingClientRect();
	if (width <= 0 || height <= 0) {
		return null;
	}
	return { bottom, left, right, top };
}

function toTarget(shell: Rect): JiraLinkingTarget {
	return {
		anchor: { x: (shell.left + shell.right) / 2, y: (shell.top + shell.bottom) / 2 },
		height: shell.bottom - shell.top,
		radius: SHELL_RADIUS_PX,
		width: shell.right - shell.left,
	};
}

function toIdentities(
	sessions: readonly AgentSessionItem[],
): readonly JiraLinkingIdentity[] {
	return sessions.map((session) => ({
		id: session.id,
		imageSrc: session.agent.avatarSrc,
		tint: resolveAgentBrandTint(session.agent.brandName),
		tintSeed: session.agent.brandName ?? session.agent.name,
	}));
}

function ExampleStage({ children, label }: Readonly<{ children: ReactNode; label: string }>) {
	return (
		<section
			aria-label={label}
			className="relative flex min-h-[352px] w-full flex-1 items-center justify-center self-stretch rounded-lg bg-bg-neutral-subtle p-0 sm:p-6"
		>
			{children}
		</section>
	);
}

interface JiraLinkingStageProps {
	label: string;
	/** The first session leads the drag; every session tints the field. */
	sessions: readonly AgentSessionItem[];
}

/**
 * A real untracked-work session dragged onto a real experimental Jira issue.
 *
 * These are the components `jira-golden-journeys-v4` links between, wired the
 * way v4 wires them: `AgentSessionMediumDrag` leaves the card in place and
 * travels an at-mention chip, and the card supplies its own grey shell, attach
 * chin and chin row. The effect only has to supply the goo.
 */
function JiraLinkingStage({ label, sessions }: Readonly<JiraLinkingStageProps>) {
	// `AgentSessionCard` owns a hover flyout, so it needs a handle and a session
	// even though this stage never opens one. Both are per-stage and stable.
	const [flyoutHandle] = useState(createJiraSessionFlyoutHandle);
	const [approach, setApproach] = useState<Approach>(IDLE_APPROACH);
	const [linkFlash, setLinkFlash] = useState<JiraIssueAgentLinkFlash | null>(null);
	const [linked, setLinked] = useState(false);
	const issueRef = useRef<HTMLDivElement>(null);
	const approachRef = useRef<Approach>(IDLE_APPROACH);
	const flashTokenRef = useRef(0);

	const leadSession = sessions[0];
	const flyoutSession = useMemo(
		() => toAgentSessionUntrackedWorkFlyoutItem(leadSession, undefined),
		[leadSession],
	);
	const identities = useMemo(() => toIdentities(sessions), [sessions]);
	/**
	 * A freshly linked session shows as working on the board, the way any newly
	 * attached run does. The fixture sessions are `complete`, and the card filters
	 * completed activities out of its chin, so the state is overridden here rather
	 * than letting the row silently not render.
	 */
	const linkedActivity = useMemo(
		() => ({ ...toJiraIssueAgentActivityFromSession(leadSession), state: "working" as const }),
		[leadSession],
	);

	/**
	 * Re-measured on every pointer move, exactly as the board's `collectDropZones`
	 * does: the shell grows when its attach chin opens, so a rect snapshotted at
	 * drag start would leave the goo aiming at stale geometry.
	 */
	const handleDragStateChange = useCallback((state: JiraIssueAgentSessionDragState) => {
		if (state.dragging) {
			const shell = toRect(issueRef.current?.querySelector(SHELL_SELECTOR));
			const distance = shell ? distanceToRect(state.pointer, shell) : Number.POSITIVE_INFINITY;
			const next = shell
				? {
					inside: distance === 0,
					nearness: resolveJiraLinkingNearness(distance),
					target: toTarget(shell),
				}
				: IDLE_APPROACH;
			approachRef.current = next;
			setApproach(next);
			return;
		}

		const settled = approachRef.current;
		if (!state.cancelled && settled.inside) {
			// The link commits here, so the row already exists. Nothing travels to
			// reach it — the row itself sweeps to say it is the thing that changed.
			flashTokenRef.current += 1;
			setLinked(true);
			setLinkFlash({
				activityIds: [leadSession.id],
				tint: resolveAgentBrandTintHex(leadSession.agent.brandName)
					?? AGENT_BRAND_TINT_FALLBACK,
				token: flashTokenRef.current,
			});
		}
		approachRef.current = IDLE_APPROACH;
		setApproach(IDLE_APPROACH);
	}, [leadSession]);

	/**
	 * Put the stage back to its pre-drag state so the link can be tried again.
	 *
	 * `flashTokenRef` deliberately keeps counting: the token has to be monotonic
	 * or re-linking the same session reuses the previous one and the sweep never
	 * re-keys, so it silently does not replay.
	 */
	function handleReset() {
		approachRef.current = IDLE_APPROACH;
		setApproach(IDLE_APPROACH);
		setLinkFlash(null);
		setLinked(false);
	}

	/**
	 * The same control the board hands each card: a continuous `attachNearness`
	 * for the backdrop ramp, and `dropTarget` only once the pointer is actually
	 * inside the rect. The binding is inert because the drag is published by the
	 * session card, not by the issue.
	 */
	const agentSessionDragControl: JiraIssueAgentSessionDragControl = {
		attachNearness: linked ? 0 : approach.nearness,
		binding: {
			onDragStateChange: () => {},
			onFocusedActivitiesChange: () => {},
		},
		dropTarget: !linked && approach.inside ? "attach" : null,
		sourceActive: false,
		state: JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE,
	};

	return (
		<ExampleStage label={label}>
			<div className="relative flex w-full max-w-[660px] items-center justify-between gap-4">
				<div className="w-[280px] shrink-0">
					<AgentSessionCard
						flyoutHandle={flyoutHandle}
						flyoutSession={flyoutSession}
						item={leadSession}
						sessionDrag={{
							onDragStateChange: handleDragStateChange,
							onFocusedActivitiesChange: () => {},
						}}
					/>
				</div>

				<div ref={issueRef} className="w-[268px] shrink-0">
					<JiraIssue
						agentActivities={linked ? [linkedActivity] : undefined}
						agentActivityLayout="split"
						agentLinkFlash={linkFlash ?? undefined}
						agentActivityMode={linked ? "working" : undefined}
						agentSessionDragControl={agentSessionDragControl}
						chrome="stroke"
						issueKey="PAY-118"
						summary="Carry card-artwork metadata into the next wallet epic"
						tags={[{ color: "purple", text: "wallet" }]}
					/>
				</div>
			</div>

			<JiraLinking
				identities={identities}
				nearness={linked ? 0 : approach.nearness}
				// Approach only. The drop is acknowledged by the chin row's own
				// sweep, so the field never runs its release fuse.
				release={null}
				sourceSelector={CHIP_SELECTOR}
				target={approach.target}
			/>

			<div className="absolute bottom-6 flex items-center gap-3">
				<p className="text-xs text-text-subtle">
					{linked
						? "Linked — the session now sits in the card's chin row"
						: "Drag the session card onto the work item"}
				</p>
				{linked ? (
					<Button onClick={handleReset} size="compact" variant="outline">
						Reset
					</Button>
				) : null}
			</div>
		</ExampleStage>
	);
}

const LEAD_SESSION = AGENT_SESSION_ITEMS[0];
/**
 * Distinct from the lead stage's session on purpose. The docs page mounts every
 * example at once, and two stages sharing one session id put two drag sources
 * behind the same identity.
 */
const COHORT = AGENT_SESSION_ITEMS.slice(1, 4);

export function JiraLinkingDragToLinkExample() {
	return <JiraLinkingStage label="Drag to link" sessions={[LEAD_SESSION]} />;
}

export function JiraLinkingColourMeltExample() {
	return <JiraLinkingStage label="Multi-subject colour melt" sessions={COHORT} />;
}

export default function JiraLinkingDemo() {
	return <JiraLinkingDragToLinkExample />;
}

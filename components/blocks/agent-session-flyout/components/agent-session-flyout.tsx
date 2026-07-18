"use client";

import {
	JiraSessionLabel,
	JiraSessionLifecycle,
	type JiraSidebarSessionItem,
	type JiraSidebarSessionStatus,
} from "@/components/blocks/product-sidebar/variants/jira";
import { JiraSessionFlyoutBody } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import {
	ASX_QUEUE_SESSION_SEEDS,
	createAsxQueueSidebarSessionItem,
} from "@/components/projects/jira-queue/data/queue-sessions";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

/**
 * The `/asx` queue session flyout showcase. Each session lifecycle state gets
 * its own section whose trigger opens the real anchored `HoverCard` popover,
 * rendering the shared `JiraSessionFlyoutBody` — the exact rich flyout body used
 * by the live Jira product sidebar. This block only supplies the demo chrome
 * (section heading + trigger row) around that shared body, so the showcase and
 * the live sidebar can never drift apart.
 */

/** Section heading + trigger copy for each session lifecycle state. */
const STATUS_META: Record<JiraSidebarSessionStatus, { label: string; blurb: string }> = {
	"awaiting-input": {
		label: "Awaiting user response",
		blurb: "The agent is paused for input and surfaces its status in the flyout.",
	},
	running: {
		label: "In progress",
		blurb: "The agent is actively working; the flyout shows session, agent, and work item.",
	},
	"pr-open": {
		label: "PR open",
		blurb: "A pull request is open; the Development block adds the PR and repository.",
	},
	merged: {
		label: "PR merged",
		blurb: "The pull request has merged; the Development block keeps the delivery trail.",
	},
	stopped: {
		label: "Stopped",
		blurb: "The session was stopped before completing.",
	},
};

/** The four demo sessions from the `/asx` queue, mapped to sidebar items. */
export const AGENT_SESSION_FLYOUT_SESSIONS: readonly JiraSidebarSessionItem[] =
	ASX_QUEUE_SESSION_SEEDS.map(createAsxQueueSidebarSessionItem);

export interface AgentSessionFlyoutProps {
	/** Sessions to render, one section per item. Defaults to the `/asx` queue seeds. */
	sessions?: readonly JiraSidebarSessionItem[];
	/** Additional classes applied to the outer sections container. */
	className?: string;
}

/** A session-row trigger styled like the live Jira sidebar row. */
function AgentSessionFlyoutTrigger({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	return (
		<button
			className="group/session flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-fast ease-out hover:bg-surface-hovered focus-visible:bg-surface-hovered focus-visible:outline-none"
			type="button"
		>
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="min-w-0 text-sm font-medium text-text">
					<JiraSessionLabel session={session} />
				</span>
				<span className="min-w-0 text-xs text-text-subtlest">
					{session.issueKey}: {session.issueSummary}
				</span>
			</span>
			<span className="grid size-6 shrink-0 place-items-center">
				<JiraSessionLifecycle status={session.status} />
			</span>
		</button>
	);
}

/** A single lifecycle section: heading, blurb, and the anchored flyout. */
function AgentSessionFlyoutSection({ session }: Readonly<{ session: JiraSidebarSessionItem }>) {
	const meta = STATUS_META[session.status];

	return (
		<section className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<h3 className="text-sm font-semibold text-text">{meta.label}</h3>
				<p className="text-xs text-text-subtlest">{meta.blurb}</p>
			</div>
			<div className="max-w-sm rounded-lg border border-border bg-surface p-1">
				<HoverCard closeDelay={80} openDelay={160}>
					<HoverCardTrigger render={<div className="w-full" />}>
						<AgentSessionFlyoutTrigger session={session} />
					</HoverCardTrigger>
					<HoverCardContent
						align="start"
						alignOffset={0}
						className="w-[400px] border-0 bg-surface-overlay p-4 text-text shadow-overlay"
						side="right"
						sideOffset={8}
					>
						<JiraSessionFlyoutBody session={session} />
					</HoverCardContent>
				</HoverCard>
			</div>
		</section>
	);
}

/**
 * Renders the queue session flyout as one section per session state. By default
 * it shows the four `/asx` sessions (awaiting input, in progress, PR open, and
 * PR merged); hover a row to open its redesigned flyout card.
 */
export function AgentSessionFlyout({
	sessions = AGENT_SESSION_FLYOUT_SESSIONS,
	className,
}: Readonly<AgentSessionFlyoutProps>) {
	return (
		<div className={cn("flex flex-col gap-8", className)}>
			{sessions.map((session) => (
				<AgentSessionFlyoutSection key={session.id} session={session} />
			))}
		</div>
	);
}

export default AgentSessionFlyout;

"use client";

import { useState, type ComponentProps } from "react";

import {
	JiraSessionLabel,
	JiraSessionLifecycle,
	type JiraSidebarSessionItem,
} from "@/components/blocks/product-sidebar/variants/jira";
import {
	JiraSessionFlyoutSurface,
	JiraSessionFlyoutTrigger,
	createJiraSessionFlyoutHandle,
	type JiraSessionFlyoutContent,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { AGENT_SESSION_FLYOUT_SESSIONS } from "@/components/blocks/agent-session-flyout/agent-session-flyout-data";
import { cn } from "@/lib/utils";

/**
 * The `/jira-golden-journeys-v0` queue session flyout showcase. The compact session list feeds the
 * shared `JiraSessionFlyoutSurface` — the exact direction-aware flyout used by
 * the live Jira product sidebar. It defaults to session details and can opt
 * into the Agent States composer or an untracked-work suggestion.
 */

export interface AgentSessionFlyoutProps {
	/** Sessions to render in the compact list. Defaults to the `/jira-golden-journeys-v0` queue seeds. */
	sessions?: readonly JiraSidebarSessionItem[];
	/**
	 * Hover flyout body. Defaults to session details; pass `"composer"` for the
	 * Agent States card or `"untracked-work"` for a suggested Jira relationship.
	 */
	content?: JiraSessionFlyoutContent;
	/** Additional classes applied to the outer session list. */
	className?: string;
}

interface AgentSessionFlyoutTriggerProps extends Omit<ComponentProps<"button">, "children"> {
	session: JiraSidebarSessionItem;
}

/** A session-row trigger styled like the live Jira sidebar row. */
function AgentSessionFlyoutTrigger({
	className,
	session,
	type = "button",
	...props
}: Readonly<AgentSessionFlyoutTriggerProps>) {
	return (
		<button
			className={cn(
				"group/session flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-fast ease-out hover:bg-surface-hovered focus-visible:bg-surface-hovered focus-visible:outline-none",
				className,
			)}
			type={type}
			{...props}
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

/**
 * Renders the queue sessions as one continuous list, matching the way the
 * triggers appear in a real chat history. Hover a row to open its flyout, then
 * move directly up or down the list to exercise the directional transition.
 */
export function AgentSessionFlyout({
	className,
	content = "details",
	sessions = AGENT_SESSION_FLYOUT_SESSIONS,
}: Readonly<AgentSessionFlyoutProps>) {
	const [flyoutHandle] = useState(createJiraSessionFlyoutHandle);

	return (
		<div className={cn("flex max-w-sm flex-col gap-0.5 rounded-lg border border-border bg-surface p-1", className)}>
			{sessions.map((session) => (
				<JiraSessionFlyoutTrigger
					closeDelay={160}
					handle={flyoutHandle}
					key={session.id}
					render={<div className="w-full" />}
					session={session}
				>
					<AgentSessionFlyoutTrigger session={session} />
				</JiraSessionFlyoutTrigger>
			))}
			<JiraSessionFlyoutSurface content={content} handle={flyoutHandle} />
		</div>
	);
}

export default AgentSessionFlyout;

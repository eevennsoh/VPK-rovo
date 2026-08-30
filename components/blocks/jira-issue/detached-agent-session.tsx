"use client";

import CrossIcon from "@atlaskit/icon/core/cross";

import { UncapturedWorkChin } from "@/components/blocks/jira-issue/uncaptured-work-chin";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Button } from "@/components/ui/button";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface JiraIssueDetachedAgentSessionAgent {
	id: string;
	name: string;
	title: string;
	avatarSrc?: string;
	agentBrandName?: ThirdPartyLogoName;
}

export interface JiraIssueDetachedAgentSessionProps {
	/** Identity plus display title for the session that detached from the card. */
	session: JiraIssueDetachedAgentSessionAgent;
	/** Host-supplied confidence copy, e.g. a match strength line. */
	confidenceLabel: string;
	/** Host-supplied explanation of why this session was surfaced. */
	reason: string;
	/** Work item the chin offers to link against. */
	suggestedWorkItemKey?: string;
	onLinkWorkItem?: () => void;
	onCreateWorkItem?: () => void;
	onDismiss?: () => void;
	/** Compact stroke chrome matching the jira-issue agent row density. */
	usesStrokeChrome?: boolean;
}

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

/**
 * A detached agent session presented as its own dashed uncaptured-work card.
 *
 * The dashed card chrome below is duplicated from
 * `components/blocks/agent-session/agent-session-card.tsx` on purpose: a peer
 * branch owns the consolidation of that shared chrome, so extracting it here
 * would collide head-on with their change.
 */
export function JiraIssueDetachedAgentSession({
	session,
	confidenceLabel,
	reason,
	suggestedWorkItemKey,
	onLinkWorkItem,
	onCreateWorkItem,
	onDismiss,
	usesStrokeChrome = false,
}: Readonly<JiraIssueDetachedAgentSessionProps>) {
	const textSizeClassName = usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5";

	return (
		<article
			className="flex w-full flex-col overflow-hidden rounded-lg border border-dashed border-border-disabled bg-surface text-left"
			data-slot="jira-issue-detached-agent-session"
			data-session-id={session.id}
			data-variant="uncaptured-work"
		>
			<div className="flex items-center gap-2 bg-surface-sunken p-3">
				<div className={cn("flex min-w-0 flex-1 items-center", usesStrokeChrome ? "gap-1.5" : "gap-2")}>
					<AgentAvatarVisual
						avatarClassName="shrink-0"
						avatarSrc={session.avatarSrc}
						brandName={session.agentBrandName}
						fallbackText={getAgentInitial(session.name)}
						label={session.name}
						sizePx={16}
					/>
					<span className={cn("block min-w-0 flex-1 truncate text-text-subtlest", textSizeClassName)}>
						{session.title}
					</span>
				</div>
				{onDismiss === undefined ? null : (
					<Button
						aria-label={`Dismiss ${session.title}`}
						className="-my-1 shrink-0"
						onClick={() => {
							onDismiss();
						}}
						size="icon-compact"
						type="button"
						variant="ghost"
					>
						<Icon aria-hidden render={<CrossIcon label="" />} />
					</Button>
				)}
			</div>
			<div className="flex flex-col gap-1 bg-surface px-3 py-2.5">
				<p className="text-xs leading-4 text-text-subtlest">{confidenceLabel}</p>
				<p className={cn("text-text", textSizeClassName)}>{reason}</p>
			</div>
			{/* A detached session is by definition not yet captured. */}
			<UncapturedWorkChin
				captured={false}
				createUnavailable={onCreateWorkItem === undefined}
				linkUnavailable={onLinkWorkItem === undefined}
				onCreateWorkItem={onCreateWorkItem}
				onLinkWorkItem={onLinkWorkItem}
				suggestedWorkItemKey={suggestedWorkItemKey}
				summary={session.title}
			/>
		</article>
	);
}

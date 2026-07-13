"use client";

import { useMemo } from "react";

import { getAgentsWorkItemForCard } from "@/components/projects/jira/data/rfp-work-items";
import { WorkItemModalProvider } from "@/app/contexts/context-work-item-modal";
import type { AgentSessionsPreset } from "@/components/blocks/agent-sessions/data/session-state";
import { AgentSessionsProvider } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { ExperimentalWorkItemDialog } from "@/components/blocks/agent-sessions/experimental/components/experimental-work-item-dialog";
import { ExperimentalWorkItemLayout } from "@/components/blocks/agent-sessions/experimental/components/experimental-work-item-layout";
import { ContextPanel } from "@/components/blocks/agent-sessions/experimental/components/context-panel";
import { ActivityPanel } from "@/components/blocks/agent-sessions/experimental/components/activity-panel";
import { SessionsRail } from "@/components/blocks/agent-sessions/experimental/components/sessions-rail";
import { MetadataRail } from "@/components/blocks/agent-sessions/experimental/components/metadata-rail";
import { FloatingSessionSurface } from "@/components/blocks/agent-sessions/experimental/components/floating-session-surface";

export interface ExperimentalAgentSessionsProps {
	open: boolean;
	onClose: () => void;
	initialPreset: AgentSessionsPreset;
}

/**
 * Composition root for the experimental Agent Sessions surface.
 *
 * Wraps the whole experience in the block-local `AgentSessionsProvider` (one
 * shared session-state instance) so the launcher, the floating session panel,
 * and the Activity `@`-reply composer all act on the same sessions. The floating
 * session surface is mounted INSIDE the dialog subtree so Base UI's modal `inert`
 * treatment does not disable it.
 */
export function ExperimentalAgentSessions({ open, onClose, initialPreset }: Readonly<ExperimentalAgentSessionsProps>) {
	const workItem = useMemo(
		() =>
			getAgentsWorkItemForCard({
				title: "Acmecorp: Prepare for bid recommendation for ESM RFP",
				code: "RFP-101",
			}),
		[],
	);

	return (
		// Keep the WorkItemModalProvider mounted (isOpen always true) so the reused
		// standard ModalHeader has its context and the Base UI dialog owns its own
		// open/close lifecycle + enter/exit animation. Read-only reuse — the standard
		// modal itself is untouched.
		<WorkItemModalProvider isOpen onClose={onClose} workItem={workItem}>
			<AgentSessionsProvider initialPreset={initialPreset} workItem={workItem}>
				<ExperimentalWorkItemDialog
					open={open}
					onClose={onClose}
					workItemCode={workItem.code}
					workItemTitle={workItem.title}
				>
					<ExperimentalWorkItemLayout
						context={<ContextPanel />}
						activity={<ActivityPanel />}
						sessions={<SessionsRail />}
						metadata={<MetadataRail />}
					/>
					<FloatingSessionSurface />
				</ExperimentalWorkItemDialog>
			</AgentSessionsProvider>
		</WorkItemModalProvider>
	);
}

export default ExperimentalAgentSessions;

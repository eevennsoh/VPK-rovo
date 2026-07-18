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
import { ActivityComposer } from "@/components/blocks/agent-sessions/experimental/components/activity-composer";
import { MetadataRail } from "@/components/blocks/agent-sessions/experimental/components/metadata-rail";
import { FloatingSessionSurface } from "@/components/blocks/agent-sessions/experimental/components/floating-session-surface";

interface ExperimentalAgentSessionsBaseProps {
	initialPreset: AgentSessionsPreset;
}

export type ExperimentalAgentSessionsProps = ExperimentalAgentSessionsBaseProps & (
	| { presentation?: "modal"; open: boolean; onClose: () => void }
	| { presentation: "inline"; open?: never; onClose?: never }
);

const NOOP = () => undefined;

/**
 * Composition root for the experimental Agent Sessions surface.
 *
 * Wraps the whole experience in the block-local `AgentSessionsProvider` (one
 * shared session-state instance) so the launcher, the floating session panel,
 * and the Activity `@`-reply composer all act on the same sessions. The floating
 * session surface is mounted INSIDE the dialog subtree so Base UI's modal `inert`
 * treatment does not disable it.
 */
export function ExperimentalAgentSessions(props: Readonly<ExperimentalAgentSessionsProps>) {
	const { initialPreset } = props;
	let presentation: "modal" | "inline";
	let open: boolean;
	let onClose: () => void;
	if (props.presentation === "inline") {
		presentation = "inline";
		open = true;
		onClose = NOOP;
	} else {
		presentation = "modal";
		open = props.open;
		onClose = props.onClose;
	}
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
			<AgentSessionsProvider initialPreset={initialPreset} workItem={workItem} active={open}>
				<ExperimentalWorkItemDialog
					open={open}
					onClose={onClose}
					presentation={presentation}
					workItemCode={workItem.code}
					workItemTitle={workItem.title}
				>
					<ExperimentalWorkItemLayout
						context={<ContextPanel />}
						activity={<ActivityPanel />}
						composer={<ActivityComposer />}
						metadata={<MetadataRail />}
					/>
					<FloatingSessionSurface portalToViewport={presentation === "inline"} />
				</ExperimentalWorkItemDialog>
			</AgentSessionsProvider>
		</WorkItemModalProvider>
	);
}

export default ExperimentalAgentSessions;

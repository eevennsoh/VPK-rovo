"use client";

import { LayoutGroup } from "motion/react";
import { useId, useMemo } from "react";

import { getAgentsWorkItemForCard } from "@/components/projects/jira/data/rfp-work-items";
import { WorkItemModalProvider } from "@/app/contexts/context-work-item-modal";
import type { AgentSessionsPreset } from "@/components/blocks/agent-sessions/data/session-state";
import type { AgentSessionsState } from "@/components/blocks/agent-sessions/data/session-state";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { AgentSessionsProvider } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { PanelLayoutProvider } from "@/components/blocks/agent-sessions/experimental/context-panel-layout";
import { ExperimentalWorkItemDialog } from "@/components/blocks/agent-sessions/experimental/components/experimental-work-item-dialog";
import { ExperimentalWorkItemLayout } from "@/components/blocks/agent-sessions/experimental/components/experimental-work-item-layout";
import { ContextPanel } from "@/components/blocks/agent-sessions/experimental/components/context-panel";
import { ActivityPanel } from "@/components/blocks/agent-sessions/experimental/components/activity-panel";
import { ActivityComposer } from "@/components/blocks/agent-sessions/experimental/components/activity-composer";
import { MetadataRail } from "@/components/blocks/agent-sessions/experimental/components/metadata-rail";
import { FloatingSessionSurface } from "@/components/blocks/agent-sessions/experimental/components/floating-session-surface";
import type { CodingAgentId } from "@/components/blocks/agent-sessions/experimental/components/context-title-actions";

interface ExperimentalAgentSessionsBaseProps {
	defaultMetadataCollapsed?: boolean;
	initialPreset: AgentSessionsPreset;
	initialState?: AgentSessionsState;
	primaryCodingAgentId?: CodingAgentId;
	workItem?: WorkItemData;
}

export type ExperimentalAgentSessionsProps = ExperimentalAgentSessionsBaseProps & (
	| { presentation?: "modal"; open: boolean; onClose: () => void }
	| {
		presentation: "inline";
		inlineSurface?: "card" | "fill";
		open?: never;
		onClose?: never;
	}
);

const NOOP = () => undefined;

/**
 * Composition root for the experimental Agent Sessions surface.
 *
 * Wraps the whole experience in the block-local `AgentSessionsProvider` (one
 * shared session-state instance) so the launcher, the floating session panel,
 * and the Activity `@`-reply composer all act on the same sessions. The floating
 * session surface is mounted in the dialog portal but outside the popup, keeping
 * it interactive on the blanket without making the modal its positioning root.
 */
export function ExperimentalAgentSessions(props: Readonly<ExperimentalAgentSessionsProps>) {
	const composerLayoutGroupId = useId();
	const { initialPreset, initialState } = props;
	let presentation: "modal" | "inline";
	let inlineSurface: "card" | "fill" = "card";
	let open: boolean;
	let onClose: () => void;
	if (props.presentation === "inline") {
		presentation = "inline";
		inlineSurface = props.inlineSurface ?? "card";
		open = true;
		onClose = NOOP;
	} else {
		presentation = "modal";
		open = props.open;
		onClose = props.onClose;
	}
	const defaultWorkItem = useMemo(
		() => getAgentsWorkItemForCard({
				title: "Acmecorp: Prepare for bid recommendation for ESM RFP",
				code: "RFP-101",
			}),
		[],
	);
	const workItem = props.workItem ?? defaultWorkItem;

	return (
		// Keep the WorkItemModalProvider mounted (isOpen always true) so the reused
		// standard ModalHeader has its context and the Base UI dialog owns its own
		// open/close lifecycle + enter/exit animation. Read-only reuse — the standard
		// modal itself is untouched.
		<WorkItemModalProvider isOpen onClose={onClose} workItem={workItem}>
			<AgentSessionsProvider initialPreset={initialPreset} initialState={initialState} workItem={workItem} active={open}>
				<PanelLayoutProvider defaultMetadataCollapsed={props.defaultMetadataCollapsed ?? false}>
					<LayoutGroup id={composerLayoutGroupId}>
						<ExperimentalWorkItemDialog
							inlineSurface={inlineSurface}
							open={open}
							onClose={onClose}
							presentation={presentation}
							primaryCodingAgentId={props.primaryCodingAgentId}
							workItemCode={workItem.code}
							workItemTitle={workItem.title}
							blanketContent={
								<FloatingSessionSurface portalToViewport={presentation === "inline"} />
							}
						>
							<ExperimentalWorkItemLayout
								context={<ContextPanel />}
								activity={<ActivityPanel />}
								composer={<ActivityComposer />}
								fillContainer={inlineSurface === "fill"}
								metadata={<MetadataRail />}
							/>
						</ExperimentalWorkItemDialog>
					</LayoutGroup>
				</PanelLayoutProvider>
			</AgentSessionsProvider>
		</WorkItemModalProvider>
	);
}

export default ExperimentalAgentSessions;

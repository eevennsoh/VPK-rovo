"use client";

import { LayoutGroup } from "motion/react";
import { useId, useMemo } from "react";

import { getAgentsWorkItemForCard } from "@/components/projects/jira/data/rfp-work-items";
import { WorkItemModalProvider } from "@/app/contexts/context-work-item-modal";
import type { JiraWorkItemPreset } from "@/components/blocks/jira-work-item/data/session-state";
import type { JiraWorkItemState } from "@/components/blocks/jira-work-item/data/session-state";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { JiraWorkItemProvider } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { PanelLayoutProvider } from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout";
import { ExperimentalWorkItemDialog } from "@/components/blocks/jira-work-item/experimental-v2/components/experimental-work-item-dialog";
import { ExperimentalWorkItemLayout } from "@/components/blocks/jira-work-item/experimental-v2/components/experimental-work-item-layout";
import { ContextPanel } from "@/components/blocks/jira-work-item/experimental-v2/components/context-panel";
import { ActivityPanel } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-panel";
import { ActivityComposer } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-composer";
import { MetadataRail } from "@/components/blocks/jira-work-item/experimental-v2/components/metadata-rail";
import { FloatingSessionSurface } from "@/components/blocks/jira-work-item/experimental-v2/components/floating-session-surface";
import type { CodingAgentId } from "@/components/blocks/jira-work-item/experimental-v2/components/context-title-actions";

interface ExperimentalV2JiraWorkItemBaseProps {
	initialPreset: JiraWorkItemPreset;
	initialState?: JiraWorkItemState;
	outputs?: readonly string[];
	primaryCodingAgentId?: CodingAgentId;
	workItem?: WorkItemData;
}

export type ExperimentalV2JiraWorkItemProps = ExperimentalV2JiraWorkItemBaseProps & (
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
 * Composition root for the experimental **v2** Jira Work Item surface.
 *
 * Forked from `experimental/` so v2 can diverge freely without touching v1. The
 * two trees are byte-identical apart from import paths and this root's name;
 * the session/planner model under `data/` is deliberately shared, so model
 * changes reach both variants.
 *
 * Wraps the whole experience in the block-local `JiraWorkItemProvider` (one
 * shared session-state instance) so the launcher, the floating session panel,
 * and the Activity `@`-reply composer all act on the same sessions. The floating
 * session surface is mounted in the dialog portal but outside the popup, keeping
 * it interactive on the blanket without making the modal its positioning root.
 */
export function ExperimentalV2JiraWorkItem(props: Readonly<ExperimentalV2JiraWorkItemProps>) {
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
			<JiraWorkItemProvider initialPreset={initialPreset} initialState={initialState} workItem={workItem} active={open}>
				<PanelLayoutProvider>
					<LayoutGroup id={composerLayoutGroupId}>
						<ExperimentalWorkItemDialog
							inlineSurface={inlineSurface}
							open={open}
							onClose={onClose}
							presentation={presentation}
							workItemCode={workItem.code}
							workItemTitle={workItem.title}
							blanketContent={
								<FloatingSessionSurface portalToViewport={presentation === "inline"} />
							}
						>
							<ExperimentalWorkItemLayout
								context={(
									<ContextPanel
										outputs={props.outputs}
										primaryCodingAgentId={props.primaryCodingAgentId}
									/>
								)}
								activity={<ActivityPanel />}
								composer={<ActivityComposer />}
								fillContainer={inlineSurface === "fill"}
								metadata={<MetadataRail />}
							/>
						</ExperimentalWorkItemDialog>
					</LayoutGroup>
				</PanelLayoutProvider>
			</JiraWorkItemProvider>
		</WorkItemModalProvider>
	);
}

export default ExperimentalV2JiraWorkItem;

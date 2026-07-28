import type { RovoAgentProfile } from "@/app/data/directory/agents";
import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { SmartLinkItem } from "@/components/blocks/smart-link/components/smart-link";
import type {
	JiraSidebarSessionItem,
	JiraSidebarSessionStatus,
} from "@/components/blocks/product-sidebar/variants/jira";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/types";

import type { JiraForYouItem } from "./jira-for-you-types";

export interface JiraForYouWorkspaceOutput {
	id: string;
	illustration: string;
	title: string;
}

export interface JiraForYouWorkspaceAgentSession {
	activityTitle: string;
	awaitingQuestions?: readonly QuestionCardQuestion[];
	composerPlaceholder: string;
	id: string;
	messages: readonly RovoUIMessage[];
	profile: RovoAgentProfile;
	status: JiraSidebarSessionStatus;
}

export interface JiraForYouWorkspaceItemDetails {
	outputs: readonly JiraForYouWorkspaceOutput[];
	session: JiraSidebarSessionItem;
	sources: readonly SmartLinkItem[];
}

export interface JiraForYouAssignedWorkspaceItemData {
	kind: "assigned";
	agentSessions: readonly JiraForYouWorkspaceAgentSession[];
	defaultAgentId: string;
	details: JiraForYouWorkspaceItemDetails;
	item: JiraForYouItem;
}

export interface JiraForYouUnassignedWorkspaceItemData {
	kind: "unassigned";
	item: JiraForYouItem;
	workItem: WorkItemData;
}

export type JiraForYouWorkspaceItemData =
	| JiraForYouAssignedWorkspaceItemData
	| JiraForYouUnassignedWorkspaceItemData;

export interface JiraForYouWorkspaceData {
	itemIds: readonly string[];
	itemsById: Readonly<Record<string, JiraForYouWorkspaceItemData>>;
}

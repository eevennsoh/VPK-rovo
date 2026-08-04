"use client";

import { useState } from "react";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import EpicIcon from "@atlaskit/icon/core/epic";
import PersonIcon from "@atlaskit/icon/core/person";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import ProjectIcon from "@atlaskit/icon/core/project";
import ProjectStatusIcon from "@atlaskit/icon/core/project-status";
import TagIcon from "@atlaskit/icon/core/tag";

import { ArtifactPanePropertyRow } from "@/components/blocks/artifact-pane";
import { ArtifactPaneAgentsField } from "@/components/blocks/artifact-pane/artifact-agents-field";
import { ArtifactParentField } from "@/components/blocks/artifact-pane/artifact-parent-field";
import { ArtifactLabelsField } from "@/components/blocks/artifact-pane/artifact-labels-field";
import { ArtifactProjectField } from "@/components/blocks/artifact-pane/artifact-project-field";
import { METADATA_PEOPLE, getMetadataPerson } from "@/components/blocks/jira-work-item/data/metadata-people";
import type { AgentPlannerAssignee } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	DateRowField,
	PersonRowField,
	PriorityRowField,
	StatusPill,
	type PriorityValue,
} from "@/components/blocks/jira-work-item/experimental/components/detail-field-editors";
import { Calendar } from "@/components/ui/calendar";
const INITIAL_AGENT_IDS = ["meeting-insights-reporter", "readiness-checker"];

interface ArtifactMetadata {
	agentIds: string[];
	assignee: AgentPlannerAssignee | null;
	dueDate?: Date;
	labels: string[];
	parent: string | null;
	priority: PriorityValue | null;
	projectId: string | null;
	reporter: AgentPlannerAssignee | null;
	startDate?: Date;
	status: string;
}

const INITIAL_METADATA: ArtifactMetadata = {
	agentIds: INITIAL_AGENT_IDS,
	assignee: getMetadataPerson("Maya Chen") ?? null,
	dueDate: new Date(2026, 7, 14),
	labels: ["enterprise-rfp", "esm"],
	parent: "RFP-100",
	priority: "High",
	projectId: "esm-rfp-response",
	reporter: getMetadataPerson("Jordan Lee") ?? null,
	startDate: new Date(2026, 7, 3),
	status: "RFP Intake",
};

export function ArtifactDetailsDemo() {
	const [metadata, setMetadata] = useState<ArtifactMetadata>(INITIAL_METADATA);
	const [showMore, setShowMore] = useState(false);
	const update = (patch: Partial<ArtifactMetadata>) => setMetadata((current) => ({ ...current, ...patch }));

	return (
		<div className="flex flex-col gap-2">
			<ArtifactPanePropertyRow editable={false} icon={<ProjectStatusIcon label="" size="small" />} label="Status">
				<StatusPill onChange={(status) => update({ status })} value={metadata.status} />
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow icon={<ProjectIcon label="" size="small" />} label="Project">
				<ArtifactProjectField onChange={(projectId) => update({ projectId })} value={metadata.projectId} />
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow icon={<PersonIcon label="" size="small" />} label="Assignee">
				<PersonRowField
					ariaLabel="Change assignee"
					onChange={(assignee) => update({ assignee })}
					people={METADATA_PEOPLE}
					placeholder="Unassigned"
					value={metadata.assignee}
				/>
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow icon={<PersonIcon label="" size="small" />} label="Reporter">
				<PersonRowField
					ariaLabel="Change reporter"
					onChange={(reporter) => update({ reporter })}
					people={METADATA_PEOPLE}
					placeholder="Unassigned"
					value={metadata.reporter}
				/>
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow icon={<AiAgentIcon label="" size="small" />} label="Agents">
				<ArtifactPaneAgentsField onChange={(agentIds) => update({ agentIds })} value={metadata.agentIds} />
			</ArtifactPanePropertyRow>

			{showMore ? (
				<>
					<ArtifactPanePropertyRow icon={<PriorityMediumIcon label="" size="small" />} label="Priority">
						<PriorityRowField onChange={(priority) => update({ priority })} value={metadata.priority} />
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<CalendarIcon label="" size="small" />} label="Start date">
						<DateRowField
							ariaLabel="Change start date"
							CalendarComponent={Calendar}
							onChange={(startDate) => update({ startDate })}
							placeholder="Add start date"
							value={metadata.startDate}
						/>
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<CalendarIcon label="" size="small" />} label="Due date">
						<DateRowField
							ariaLabel="Change due date"
							CalendarComponent={Calendar}
							onChange={(dueDate) => update({ dueDate })}
							placeholder="Add due date"
							value={metadata.dueDate}
						/>
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<EpicIcon label="" size="small" />} label="Parent">
						<ArtifactParentField onChange={(parent) => update({ parent })} value={metadata.parent} />
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<TagIcon label="" size="small" />} label="Labels">
						<ArtifactLabelsField onChange={(labels) => update({ labels })} value={metadata.labels} />
					</ArtifactPanePropertyRow>
				</>
			) : null}

			<button
				className="mt-1 self-start text-xs leading-5 text-text-subtle underline-offset-2 hover:underline focus-visible:underline"
				onClick={() => setShowMore((current) => !current)}
				type="button"
			>
				{showMore ? "See less" : "See more"}
			</button>
		</div>
	);
}

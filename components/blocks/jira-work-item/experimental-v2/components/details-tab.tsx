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

import type { WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import { ArtifactPanePropertyRow } from "@/components/blocks/artifact-pane";
import { ArtifactPaneAgentsField } from "@/components/blocks/artifact-pane/artifact-agents-field";
import { CREW_ROSTER, type CrewMember } from "@/components/blocks/jira-work-item/data/metadata-crew";
import { PROJECT_OPTIONS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import type { AgentPlannerMetadata } from "@/components/blocks/jira-work-item/data/planner-state";
import { DetailValueTrigger } from "@/components/blocks/jira-work-item/experimental-v2/components/detail-field-row";
import {
	DateRowField,
	LabelsRowField,
	METADATA_PICKER_POPOVER_CLASS,
	METADATA_PICKER_POSITIONER_CLASS,
	MetadataSearchPicker,
	ParentRowField,
	PersonReadOnlyValue,
	PersonRowField,
	PriorityRowField,
	StatusPill,
} from "@/components/blocks/jira-work-item/experimental-v2/components/detail-field-editors";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RichTextSuggestionMenuItem } from "@/components/ui-custom/rich-text-editor";

export { seedMetadataDraft } from "@/components/blocks/jira-work-item/data/planner-state";

export type MetadataDraft = AgentPlannerMetadata;

const ARTIFACT_AGENT_CREW_BY_ID = new Map(
	CREW_ROSTER.filter((member) => member.kind === "agent").map((member) => [member.id, member]),
);

function AtlassianProjectEditor({ value, onChange }: Readonly<{ value: string | null; onChange: (id: string) => void }>) {
	const [open, setOpen] = useState(false);
	const selected = PROJECT_OPTIONS.find((project) => project.id === value);
	const items = PROJECT_OPTIONS.map((project): RichTextSuggestionMenuItem => ({
		description: project.team,
		icon: <ProjectIcon label="" size="small" />,
		id: project.id,
		label: project.name,
	}));

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label={selected ? "Change project" : "Add project"} />}>
				{selected ? (
					<span className="truncate text-sm text-text">{selected.name}</span>
				) : (
					<span className="text-sm text-text-subtlest">Select project</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className={METADATA_PICKER_POPOVER_CLASS} positionerClassName={METADATA_PICKER_POSITIONER_CLASS}>
				<MetadataSearchPicker
					emptyLabel="No projects found"
					items={items}
					onEscape={() => setOpen(false)}
					onSelect={(item) => {
						onChange(item.id);
						setOpen(false);
					}}
					placeholder="Search projects or paste link"
				/>
			</PopoverContent>
		</Popover>
	);
}

/** The ArtifactPane-aligned Details body for the experimental v2 work item. */
export function DetailsTab({
	draft,
	onChange,
	people,
}: Readonly<{
	draft: MetadataDraft;
	onChange: (patch: Partial<MetadataDraft>) => void;
	people: readonly WorkItemPerson[];
}>) {
	const [showMore, setShowMore] = useState(false);
	const selectedAgentIds = draft.crew
		.filter((member) => member.kind === "agent")
		.map((member) => member.id);
	const hasAgents = selectedAgentIds.length > 0;
	const agentsField = (
		<ArtifactPanePropertyRow icon={<AiAgentIcon label="" size="small" />} label="Agents">
			<ArtifactPaneAgentsField
				onChange={(agentIds) => onChange({
					crew: agentIds
						.map((id) => ARTIFACT_AGENT_CREW_BY_ID.get(id))
						.filter((member): member is CrewMember => Boolean(member)),
				})}
				value={selectedAgentIds}
			/>
		</ArtifactPanePropertyRow>
	);

	return (
		<div className="flex flex-col gap-2">
			<ArtifactPanePropertyRow editable={false} icon={<ProjectStatusIcon label="" size="small" />} label="Status">
				<StatusPill onChange={(next) => onChange({ status: next })} value={draft.status} />
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow icon={<ProjectIcon label="" size="small" />} label="Project">
				<AtlassianProjectEditor onChange={(id) => onChange({ atlassianProject: id })} value={draft.atlassianProject} />
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow icon={<PersonIcon label="" size="small" />} label="Assignee">
				<PersonRowField
					ariaLabel="Change assignee"
					onChange={(person) => onChange({ assignee: person })}
					people={people}
					placeholder="Unassigned"
					value={draft.assignee}
				/>
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow editable={false} icon={<PersonIcon label="" size="small" />} label="Reporter">
				<PersonReadOnlyValue placeholder="Unassigned" value={draft.reporter} />
			</ArtifactPanePropertyRow>
			{hasAgents ? agentsField : null}
			{showMore ? (
				<>
					{hasAgents ? null : agentsField}
					<ArtifactPanePropertyRow icon={<PriorityMediumIcon label="" size="small" />} label="Priority">
						<PriorityRowField onChange={(next) => onChange({ priority: next })} value={draft.priority} />
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<CalendarIcon label="" size="small" />} label="Start date">
						<DateRowField
							ariaLabel="Change start date"
							CalendarComponent={Calendar}
							onChange={(next) => onChange({ startDate: next })}
							placeholder="Add start date"
							value={draft.startDate}
						/>
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<CalendarIcon label="" size="small" />} label="Due date">
						<DateRowField
							ariaLabel="Change due date"
							CalendarComponent={Calendar}
							onChange={(next) => onChange({ dueDate: next })}
							placeholder="Add due date"
							value={draft.dueDate}
						/>
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<EpicIcon label="" size="small" />} label="Parent">
						<ParentRowField onChange={(key) => onChange({ parent: key })} value={draft.parent} />
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<TagIcon label="" size="small" />} label="Labels">
						<LabelsRowField onChange={(next) => onChange({ labels: next })} value={draft.labels} />
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

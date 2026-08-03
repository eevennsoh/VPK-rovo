"use client";

import { useState } from "react";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import EpicIcon from "@atlaskit/icon/core/epic";
import PersonIcon from "@atlaskit/icon/core/person";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import ProjectIcon from "@atlaskit/icon/core/project";
import TagIcon from "@atlaskit/icon/core/tag";

import type { WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import { PROJECT_OPTIONS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import type { AgentPlannerMetadata } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	DetailFieldRow,
	DetailValueTrigger,
} from "@/components/blocks/jira-work-item/experimental-v2/components/detail-field-row";
import { FloatingField } from "@/components/blocks/jira-work-item/experimental-v2/components/floating-field";
import {
	AgentsRowField,
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

/** Project editor (project search); value trigger only — the row chrome is supplied by FloatingField. */
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

/**
 * The Details tab body. Every optional field is a `FloatingField`: it shows a
 * single `icon + label` line while empty/idle and floats the label up to reveal
 * the value/editor once it has a value or is being edited (video-matched). Status
 * always has a value, so it stays in the expanded `DetailFieldRow` form.
 */
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
	const hasAgents = draft.crew.some((member) => member.kind === "agent");
	const agentsField = (
		<FloatingField filled={hasAgents} icon={AiAgentIcon} label="Agents">
			<AgentsRowField onChange={(next) => onChange({ crew: next })} value={draft.crew} />
		</FloatingField>
	);

	return (
		<div className="flex flex-col">
			<DetailFieldRow
				label="Status"
				value={<StatusPill onChange={(next) => onChange({ status: next })} value={draft.status} />}
			/>

			<FloatingField filled={draft.atlassianProject !== null} icon={ProjectIcon} label="Project">
				<AtlassianProjectEditor onChange={(id) => onChange({ atlassianProject: id })} value={draft.atlassianProject} />
			</FloatingField>

			<FloatingField filled={draft.assignee !== null} icon={PersonIcon} label="Assignee">
				<PersonRowField
					ariaLabel="Change assignee"
					onChange={(person) => onChange({ assignee: person })}
					people={people}
					placeholder="Unassigned"
					value={draft.assignee}
				/>
			</FloatingField>

			<FloatingField filled={draft.reporter !== null} icon={PersonIcon} label="Reporter" readOnly>
				<PersonReadOnlyValue placeholder="Unassigned" value={draft.reporter} />
			</FloatingField>

			{hasAgents ? agentsField : null}

			{showMore ? (
				<>
					{!hasAgents ? agentsField : null}

					<FloatingField filled={draft.priority !== null} icon={PriorityMediumIcon} label="Priority">
						<PriorityRowField onChange={(next) => onChange({ priority: next })} value={draft.priority} />
					</FloatingField>

					<FloatingField filled={draft.startDate !== undefined} icon={CalendarIcon} label="Start date">
						<DateRowField
							ariaLabel="Change start date"
							CalendarComponent={Calendar}
							onChange={(next) => onChange({ startDate: next })}
							placeholder="Add start date"
							value={draft.startDate}
						/>
					</FloatingField>

					<FloatingField filled={draft.dueDate !== undefined} icon={CalendarIcon} label="Due date">
						<DateRowField
							ariaLabel="Change due date"
							CalendarComponent={Calendar}
							onChange={(next) => onChange({ dueDate: next })}
							placeholder="Add due date"
							value={draft.dueDate}
						/>
					</FloatingField>

					<FloatingField filled={draft.parent !== null} icon={EpicIcon} label="Parent">
						<ParentRowField onChange={(key) => onChange({ parent: key })} value={draft.parent} />
					</FloatingField>

					<FloatingField filled={draft.labels.length > 0} icon={TagIcon} label="Labels">
						<LabelsRowField onChange={(next) => onChange({ labels: next })} value={draft.labels} />
					</FloatingField>
				</>
			) : null}

			<button
				className="-mx-2 mt-1 self-start rounded-md px-2 py-1 text-sm font-medium text-text-subtle outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-ring"
				onClick={() => setShowMore((previous) => !previous)}
				type="button"
			>
				{showMore ? "See less" : "See more"}
			</button>
		</div>
	);
}

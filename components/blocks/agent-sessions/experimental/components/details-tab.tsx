"use client";

import { useState } from "react";

import BoardIcon from "@atlaskit/icon/core/board";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import EpicIcon from "@atlaskit/icon/core/epic";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import PersonIcon from "@atlaskit/icon/core/person";
import PersonAddIcon from "@atlaskit/icon/core/person-add";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import TagIcon from "@atlaskit/icon/core/tag";

import type { WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import { PROJECT_OPTIONS } from "@/components/blocks/agent-sessions/data/metadata-fixtures";
import type { AgentPlannerMetadata } from "@/components/blocks/agent-sessions/data/planner-state";
import {
	DetailFieldRow,
	DetailValueTrigger,
} from "@/components/blocks/agent-sessions/experimental/components/detail-field-row";
import { FloatingField } from "@/components/blocks/agent-sessions/experimental/components/floating-field";
import {
	CrewRowField,
	DateRowField,
	LabelsRowField,
	ParentRowField,
	PersonRowField,
	PriorityRowField,
	StatusPill,
} from "@/components/blocks/agent-sessions/experimental/components/detail-field-editors";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export { seedMetadataDraft } from "@/components/blocks/agent-sessions/data/planner-state";

export type MetadataDraft = AgentPlannerMetadata;

/** Atlassian Project editor (rocket row + project search); value trigger only — the row chrome is supplied by FloatingField. */
function AtlassianProjectEditor({ value, onChange }: Readonly<{ value: string | null; onChange: (id: string) => void }>) {
	const [open, setOpen] = useState(false);
	const selected = PROJECT_OPTIONS.find((project) => project.id === value);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label={selected ? "Change Atlassian Project" : "Add Atlassian Project"} />}>
				{selected ? (
					<span className="truncate text-sm text-text">{selected.name}</span>
				) : (
					<span className="text-sm text-text-subtlest">Select project</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[18rem] p-0" positionerClassName="z-[502]">
				<Command>
					<CommandInput placeholder="Search projects or paste link" />
					<CommandList>
						<CommandEmpty>No projects found.</CommandEmpty>
						<CommandGroup heading="Recent projects">
							{PROJECT_OPTIONS.map((project) => (
								<CommandItem
									key={project.id}
									onSelect={() => {
										onChange(project.id);
										setOpen(false);
									}}
									showCheckIcon={false}
									value={project.name}
								>
									<span className="flex min-w-0 flex-col">
										<span className="truncate text-sm">{project.name}</span>
										<span className="truncate text-xs text-text-subtlest">{project.team}</span>
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
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
	const assignToMeTarget = people[0];

	return (
		<div className="flex flex-col">
			<DetailFieldRow
				label="Status"
				value={<StatusPill onChange={(next) => onChange({ status: next })} value={draft.status} />}
			/>

			<FloatingField
				filled={draft.atlassianProject !== null}
				icon={BoardIcon}
				label="Atlassian Project"
				onClear={() => onChange({ atlassianProject: null })}
			>
				<AtlassianProjectEditor onChange={(id) => onChange({ atlassianProject: id })} value={draft.atlassianProject} />
			</FloatingField>

			<FloatingField
				actions={
					assignToMeTarget ? (
						<Button
							aria-label="Assign to me"
							onClick={() => onChange({ assignee: assignToMeTarget })}
							size="icon-compact"
							variant="ghost"
						>
							<PersonAddIcon label="" size="small" />
						</Button>
					) : null
				}
				filled={draft.assignee !== null}
				icon={PersonIcon}
				label="Assignee"
				onClear={() => onChange({ assignee: null })}
			>
				<PersonRowField
					ariaLabel="Change assignee"
					onChange={(person) => onChange({ assignee: person })}
					people={people}
					placeholder="Unassigned"
					value={draft.assignee}
				/>
			</FloatingField>

			<FloatingField filled={draft.reporter !== null} icon={PersonIcon} label="Reporter" onClear={() => onChange({ reporter: null })}>
				<PersonRowField
					ariaLabel="Change reporter"
					onChange={(person) => onChange({ reporter: person })}
					people={people}
					placeholder="Unassigned"
					value={draft.reporter}
				/>
			</FloatingField>

			<FloatingField filled={draft.crew.length > 0} icon={PeopleGroupIcon} label="Crew" onClear={() => onChange({ crew: [] })}>
				<CrewRowField onChange={(next) => onChange({ crew: next })} value={draft.crew} />
			</FloatingField>

			<FloatingField filled={draft.priority !== null} icon={PriorityMediumIcon} label="Priority" onClear={() => onChange({ priority: null })}>
				<PriorityRowField onChange={(next) => onChange({ priority: next })} value={draft.priority} />
			</FloatingField>

			<FloatingField filled={draft.startDate !== undefined} icon={CalendarIcon} label="Start date" onClear={() => onChange({ startDate: undefined })}>
				<DateRowField
					ariaLabel="Change start date"
					CalendarComponent={Calendar}
					onChange={(next) => onChange({ startDate: next })}
					placeholder="Add start date"
					value={draft.startDate}
				/>
			</FloatingField>

			<FloatingField filled={draft.dueDate !== undefined} icon={CalendarIcon} label="Due date" onClear={() => onChange({ dueDate: undefined })}>
				<DateRowField
					ariaLabel="Change due date"
					CalendarComponent={Calendar}
					onChange={(next) => onChange({ dueDate: next })}
					placeholder="Add due date"
					value={draft.dueDate}
				/>
			</FloatingField>

			<FloatingField filled={draft.parent !== null} icon={EpicIcon} label="Parent" onClear={() => onChange({ parent: null })}>
				<ParentRowField onChange={(key) => onChange({ parent: key })} value={draft.parent} />
			</FloatingField>

			{showMore ? (
				<FloatingField filled={draft.labels.length > 0} icon={TagIcon} label="Labels" onClear={() => onChange({ labels: [] })}>
					<LabelsRowField onChange={(next) => onChange({ labels: next })} value={draft.labels} />
				</FloatingField>
			) : null}

			<button
				className="mt-1 self-start rounded-md px-2 py-1 text-sm font-medium text-text-subtle outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-ring"
				onClick={() => setShowMore((previous) => !previous)}
				type="button"
			>
				{showMore ? "See less" : "See more"}
			</button>
		</div>
	);
}

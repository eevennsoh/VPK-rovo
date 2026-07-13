"use client";

import { useState } from "react";

import BoardIcon from "@atlaskit/icon/core/board";
import PersonAddIcon from "@atlaskit/icon/core/person-add";

import type { WorkItemData, WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import { PROJECT_OPTIONS } from "@/components/blocks/agent-sessions/data/metadata-fixtures";
import {
	DetailEmptyRow,
	DetailFieldRow,
	DetailValueTrigger,
} from "@/components/blocks/agent-sessions/experimental/components/detail-field-row";
import {
	DateRowField,
	LabelsRowField,
	ParentRowField,
	PersonRowField,
	PriorityRowField,
	STATUS_PHASES,
	type PriorityValue,
} from "@/components/blocks/agent-sessions/experimental/components/detail-field-editors";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface MetadataDraft {
	status: string;
	priority: PriorityValue;
	assignee: WorkItemPerson | null;
	reporter: WorkItemPerson | null;
	startDate?: Date;
	dueDate?: Date;
	parent: string | null;
	labels: string[];
	atlassianProject: string | null;
}

function parseSeedDate(value?: string): Date | undefined {
	if (!value) return undefined;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function seedMetadataDraft(workItem: WorkItemData): MetadataDraft {
	return {
		status: workItem.status ?? STATUS_PHASES[0] ?? "To do",
		priority: workItem.priority ?? "Medium",
		assignee: workItem.assignee ?? null,
		reporter: workItem.reporter ?? null,
		startDate: parseSeedDate(workItem.startDate),
		dueDate: parseSeedDate(workItem.dueDate),
		parent: workItem.parent?.code ?? null,
		labels: workItem.labels ? [...workItem.labels] : [],
		atlassianProject: null,
	};
}

/** The empty-to-add "Atlassian Project" row (video's rocket row + project search). */
function AtlassianProjectRow({ value, onChange }: Readonly<{ value: string | null; onChange: (id: string) => void }>) {
	const [open, setOpen] = useState(false);
	const selected = PROJECT_OPTIONS.find((project) => project.id === value);

	const picker = (
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
	);

	if (!selected) {
		return (
			<Popover onOpenChange={setOpen} open={open}>
				<DetailEmptyRow
					icon={BoardIcon}
					label="Atlassian Project"
					trigger={
						<PopoverTrigger
							render={
								<button
									aria-label="Add Atlassian Project"
									className="group/detail-empty flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
									type="button"
								/>
							}
						>
							<Icon aria-hidden className="text-icon-subtle" render={<BoardIcon label="" size="small" />} />
							<span className="min-w-0 flex-1 truncate text-sm text-text-subtle">Atlassian Project</span>
						</PopoverTrigger>
					}
				/>
				{picker}
			</Popover>
		);
	}

	return (
		<DetailFieldRow
			label="Atlassian Project"
			value={
				<Popover onOpenChange={setOpen} open={open}>
					<PopoverTrigger render={<DetailValueTrigger aria-label="Change Atlassian Project" />}>
						<span className="truncate text-sm text-text">{selected.name}</span>
					</PopoverTrigger>
					{picker}
				</Popover>
			}
		/>
	);
}

/**
 * The Details tab body: video-matched field rows (empty-to-add + inline-edit
 * filled rows with hover actions) and a See more/less toggle for the long tail.
 * All state is owned by the parent rail and passed via `draft` + `onChange`.
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
			<AtlassianProjectRow onChange={(id) => onChange({ atlassianProject: id })} value={draft.atlassianProject} />

			<DetailFieldRow
				label="Assignee"
				value={
					<PersonRowField
						ariaLabel="Change assignee"
						onChange={(person) => onChange({ assignee: person })}
						people={people}
						placeholder="Unassigned"
						value={draft.assignee}
					/>
				}
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
			/>

			<DetailFieldRow
				label="Reporter"
				value={
					<PersonRowField
						ariaLabel="Change reporter"
						onChange={(person) => onChange({ reporter: person })}
						people={people}
						placeholder="Unassigned"
						value={draft.reporter}
					/>
				}
			/>

			<DetailFieldRow
				label="Priority"
				value={<PriorityRowField onChange={(next) => onChange({ priority: next })} value={draft.priority} />}
			/>

			<DetailFieldRow
				label="Start date"
				value={
					<DateRowField
						ariaLabel="Change start date"
						CalendarComponent={Calendar}
						onChange={(next) => onChange({ startDate: next })}
						placeholder="Add start date"
						value={draft.startDate}
					/>
				}
			/>

			<DetailFieldRow
				label="Due date"
				value={
					<DateRowField
						ariaLabel="Change due date"
						CalendarComponent={Calendar}
						onChange={(next) => onChange({ dueDate: next })}
						placeholder="Add due date"
						value={draft.dueDate}
					/>
				}
			/>

			<DetailFieldRow
				label="Parent"
				value={<ParentRowField onChange={(key) => onChange({ parent: key })} value={draft.parent} />}
			/>

			{showMore ? (
				<DetailFieldRow
					label="Labels"
					value={<LabelsRowField onChange={(next) => onChange({ labels: next })} value={draft.labels} />}
				/>
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

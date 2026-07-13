"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import PriorityHighIcon from "@atlaskit/icon/core/priority-high";
import PriorityHighestIcon from "@atlaskit/icon/core/priority-highest";
import PriorityLowIcon from "@atlaskit/icon/core/priority-low";
import PriorityLowestIcon from "@atlaskit/icon/core/priority-lowest";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import { useMemo, useState } from "react";

import { METADATA_PEOPLE } from "@/components/blocks/agent-sessions/data/metadata-people";
import { MetadataFieldRow } from "@/components/blocks/agent-sessions/experimental/components/metadata-field-row";
import { useAgentSessionsMeta } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import type { WorkItemData, WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heading } from "@/components/ui/heading";
import { Lozenge, LozengeDropdownTrigger, type LozengeProps } from "@/components/ui/lozenge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PriorityValue = NonNullable<WorkItemData["priority"]>;
type LozengeVariant = NonNullable<LozengeProps["variant"]>;

const METADATA_HEADING_ID = "agent-sessions-metadata-title";
const STATUS_PHASES: readonly string[] = BOARD_COLUMNS.map((column) => column.title);
const PRIORITY_OPTIONS: readonly PriorityValue[] = ["Highest", "High", "Medium", "Low", "Lowest"];

const PRIORITY_ICONS: Record<PriorityValue, typeof PriorityMediumIcon> = {
	Highest: PriorityHighestIcon,
	High: PriorityHighIcon,
	Medium: PriorityMediumIcon,
	Low: PriorityLowIcon,
	Lowest: PriorityLowestIcon,
};

const PRIORITY_COLOR_CLASSES: Record<PriorityValue, string> = {
	Highest: "text-icon-danger",
	High: "text-icon-danger",
	Medium: "text-icon-warning",
	Low: "text-icon-information",
	Lowest: "text-icon-information",
};

interface MetadataDraft {
	status: string;
	priority: PriorityValue;
	assignee: WorkItemPerson | null;
	reporter: WorkItemPerson | null;
	dueDate?: Date;
}

function statusVariant(status: string): LozengeVariant {
	const index = STATUS_PHASES.indexOf(status);
	if (index >= 0 && index === STATUS_PHASES.length - 1) {
		return "success";
	}
	if (index <= 0) {
		return "neutral";
	}
	return "information";
}

function parseSeedDate(value?: string): Date | undefined {
	if (!value) {
		return undefined;
	}
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function seedDraft(workItem: WorkItemData): MetadataDraft {
	return {
		status: workItem.status ?? STATUS_PHASES[0] ?? "To do",
		priority: workItem.priority ?? "Medium",
		assignee: workItem.assignee ?? null,
		reporter: workItem.reporter ?? null,
		dueDate: parseSeedDate(workItem.dueDate),
	};
}

function mergePeople(...seed: readonly (WorkItemPerson | null | undefined)[]): WorkItemPerson[] {
	const byName = new Map<string, WorkItemPerson>();
	for (const person of METADATA_PEOPLE) {
		byName.set(person.name, person);
	}
	for (const person of seed) {
		if (person && !byName.has(person.name)) {
			byName.set(person.name, person);
		}
	}
	return [...byName.values()];
}

function PersonLabel({ person }: Readonly<{ person: WorkItemPerson }>) {
	return (
		<span className="flex min-w-0 items-center gap-2">
			<Avatar className="shrink-0" size="xs">
				{person.avatarUrl ? <AvatarImage alt="" src={person.avatarUrl} /> : null}
				<AvatarFallback>{person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>
			<span className="min-w-0 truncate text-sm">{person.name}</span>
		</span>
	);
}

function PriorityLabel({ value }: Readonly<{ value: PriorityValue }>) {
	const IconComponent = PRIORITY_ICONS[value];
	return (
		<span className="flex min-w-0 items-center gap-1.5">
			<span className={cn("flex shrink-0", PRIORITY_COLOR_CLASSES[value])}>
				<IconComponent color="currentColor" label="" />
			</span>
			<span className="truncate text-sm">{value}</span>
		</span>
	);
}

function StatusField({ value, onChange }: Readonly<{ value: string; onChange: (next: string) => void }>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<LozengeDropdownTrigger
						aria-label={`Change status. Current status: ${value}`}
						size="spacious"
						variant={statusVariant(value)}
					/>
				}
			>
				{value}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56" positionerClassName="z-[502]" sideOffset={8}>
				{STATUS_PHASES.map((phase) => (
					<DropdownMenuItem
						aria-current={phase === value ? "true" : undefined}
						key={phase}
						onSelect={() => onChange(phase)}
						selected={phase === value}
					>
						<Lozenge variant={statusVariant(phase)}>{phase}</Lozenge>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function PriorityField({ value, onChange }: Readonly<{ value: PriorityValue; onChange: (next: PriorityValue) => void }>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`Change priority. Current priority: ${value}`}
						className="w-full justify-between gap-2 font-normal"
						variant="outline"
					/>
				}
			>
				<PriorityLabel value={value} />
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56" positionerClassName="z-[502]" sideOffset={8}>
				{PRIORITY_OPTIONS.map((option) => (
					<DropdownMenuItem key={option} onSelect={() => onChange(option)} selected={option === value}>
						<PriorityLabel value={option} />
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function PersonPickerField({
	ariaLabel,
	people,
	placeholder,
	value,
	onChange,
}: Readonly<{
	ariaLabel: string;
	people: readonly WorkItemPerson[];
	placeholder: string;
	value: WorkItemPerson | null;
	onChange: (person: WorkItemPerson) => void;
}>) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) {
			setQuery("");
		}
	};

	const handleSelect = (person: WorkItemPerson) => {
		onChange(person);
		handleOpenChange(false);
	};

	return (
		<Popover onOpenChange={handleOpenChange} open={open}>
			<PopoverTrigger
				render={<Button aria-label={ariaLabel} className="w-full justify-start gap-2 font-normal" variant="outline" />}
			>
				{value ? <PersonLabel person={value} /> : <span className="text-text-subtlest">{placeholder}</span>}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[16rem] p-0" positionerClassName="z-[502]">
				<Command>
					<CommandInput onValueChange={setQuery} placeholder="Search people" value={query} />
					<CommandList>
						<CommandEmpty>No people found.</CommandEmpty>
						<CommandGroup>
							{people.map((person) => (
								<CommandItem
									key={person.name}
									onSelect={() => handleSelect(person)}
									showCheckIcon={false}
									value={person.name}
								>
									<PersonLabel person={person} />
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function DueDateField({ value, onChange }: Readonly<{ value?: Date; onChange: (next: Date | undefined) => void }>) {
	const [open, setOpen] = useState(false);
	const label = value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(value) : "Set due date";

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				render={
					<Button
						aria-label="Change due date"
						className="w-full justify-start font-normal data-[empty=true]:text-text-subtlest"
						data-empty={value ? undefined : true}
						variant="outline"
					/>
				}
			>
				{label}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-2" positionerClassName="z-[502]">
				<Calendar
					mode="single"
					onSelect={(next) => {
						onChange(next);
						setOpen(false);
					}}
					selected={value}
				/>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Locally-editable work-item metadata (status, priority, assignee, reporter,
 * due date). This is presentation-only draft state keyed by `workItem.code`
 * (the StatusHeader pattern) — it does NOT touch the foundation reducer.
 */
export function MetadataRail() {
	const { workItem } = useAgentSessionsMeta();
	const code = workItem.code;
	const [draftByCode, setDraftByCode] = useState<Record<string, MetadataDraft>>({});
	const draft = draftByCode[code] ?? seedDraft(workItem);
	const people = useMemo(
		() => mergePeople(workItem.assignee, workItem.reporter),
		[workItem.assignee, workItem.reporter],
	);

	const updateDraft = (patch: Partial<MetadataDraft>) => {
		setDraftByCode((previous) => ({
			...previous,
			[code]: { ...(previous[code] ?? seedDraft(workItem)), ...patch },
		}));
	};

	return (
		<section aria-labelledby={METADATA_HEADING_ID} className="flex flex-col gap-2">
			<Heading as="h3" id={METADATA_HEADING_ID} size="small">
				Details
			</Heading>
			<div className="flex flex-col">
				<MetadataFieldRow label="Status">
					<StatusField onChange={(next) => updateDraft({ status: next })} value={draft.status} />
				</MetadataFieldRow>
				<MetadataFieldRow label="Priority">
					<PriorityField onChange={(next) => updateDraft({ priority: next })} value={draft.priority} />
				</MetadataFieldRow>
				<MetadataFieldRow label="Assignee">
					<PersonPickerField
						ariaLabel="Change assignee"
						onChange={(person) => updateDraft({ assignee: person })}
						people={people}
						placeholder="Unassigned"
						value={draft.assignee}
					/>
				</MetadataFieldRow>
				<MetadataFieldRow label="Reporter">
					<PersonPickerField
						ariaLabel="Change reporter"
						onChange={(person) => updateDraft({ reporter: person })}
						people={people}
						placeholder="Unassigned"
						value={draft.reporter}
					/>
				</MetadataFieldRow>
				<MetadataFieldRow label="Due date">
					<DueDateField onChange={(next) => updateDraft({ dueDate: next })} value={draft.dueDate} />
				</MetadataFieldRow>
			</div>
		</section>
	);
}

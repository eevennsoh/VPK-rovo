"use client";

import { useState } from "react";

import PriorityHighIcon from "@atlaskit/icon/core/priority-high";
import PriorityHighestIcon from "@atlaskit/icon/core/priority-highest";
import PriorityLowIcon from "@atlaskit/icon/core/priority-low";
import PriorityLowestIcon from "@atlaskit/icon/core/priority-lowest";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";

import type { WorkItemData, WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";
import { CREW_ROSTER, type CrewMember } from "@/components/blocks/agent-sessions/data/metadata-crew";
import { LABEL_OPTIONS, PARENT_OPTIONS } from "@/components/blocks/agent-sessions/data/metadata-fixtures";
import { DetailValueTrigger } from "@/components/blocks/agent-sessions/experimental/components/detail-field-row";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lozenge, LozengeDropdownTrigger, type LozengeProps } from "@/components/ui/lozenge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, TagGroup } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

export type PriorityValue = NonNullable<WorkItemData["priority"]>;
type LozengeVariant = NonNullable<LozengeProps["variant"]>;

export const STATUS_PHASES: readonly string[] = BOARD_COLUMNS.map((column) => column.title);
export const PRIORITY_OPTIONS: readonly PriorityValue[] = ["Highest", "High", "Medium", "Low", "Lowest"];

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

export function statusVariant(status: string): LozengeVariant {
	const index = STATUS_PHASES.indexOf(status);
	if (index >= 0 && index === STATUS_PHASES.length - 1) {
		return "success";
	}
	if (index <= 0) {
		return "neutral";
	}
	return "information";
}

export function PersonLabel({ person }: Readonly<{ person: WorkItemPerson }>) {
	return (
		<span className="flex min-w-0 items-center gap-2">
			<Avatar className="shrink-0" size="xs">
				{person.avatarUrl ? <AvatarImage alt="" src={person.avatarUrl} /> : null}
				<AvatarFallback>{person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
			</Avatar>
			<span className="min-w-0 truncate text-sm text-text">{person.name}</span>
		</span>
	);
}

export function PriorityLabel({ value }: Readonly<{ value: PriorityValue }>) {
	const IconComponent = PRIORITY_ICONS[value];
	return (
		<span className="flex min-w-0 items-center gap-1.5">
			<span className={cn("flex shrink-0", PRIORITY_COLOR_CLASSES[value])}>
				<IconComponent color="currentColor" label="" />
			</span>
			<span className="truncate text-sm text-text">{value}</span>
		</span>
	);
}

/** Status pill for the Details header bar (video's "To Do ▾"). */
export function StatusPill({ value, onChange }: Readonly<{ value: string; onChange: (next: string) => void }>) {
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
					<DropdownMenuItem key={phase} onSelect={() => onChange(phase)} selected={phase === value}>
						<Lozenge variant={statusVariant(phase)}>{phase}</Lozenge>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function PriorityRowField({ value, onChange }: Readonly<{ value: PriorityValue | null; onChange: (next: PriorityValue) => void }>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<DetailValueTrigger aria-label={value ? `Change priority. Current priority: ${value}` : "Add priority"} />}>
				{value ? <PriorityLabel value={value} /> : <span className="text-sm text-text-subtlest">Add priority</span>}
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

export function PersonRowField({
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
		if (!next) setQuery("");
	};

	return (
		<Popover onOpenChange={handleOpenChange} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label={ariaLabel} />}>
				{value ? <PersonLabel person={value} /> : <span className="text-sm text-text-subtlest">{placeholder}</span>}
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
									onSelect={() => {
										onChange(person);
										handleOpenChange(false);
									}}
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

export function DateRowField({
	ariaLabel,
	placeholder,
	value,
	onChange,
	CalendarComponent,
}: Readonly<{
	ariaLabel: string;
	placeholder: string;
	value?: Date;
	onChange: (next: Date | undefined) => void;
	// Injected to keep this module free of a direct calendar import at the top;
	// callers pass the shared Calendar.
	CalendarComponent: React.ComponentType<{ mode: "single"; selected?: Date; onSelect: (d: Date | undefined) => void }>;
}>) {
	const [open, setOpen] = useState(false);
	const label = value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(value) : placeholder;

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label={ariaLabel} />}>
				<span className={cn("text-sm", value ? "text-text" : "text-text-subtlest")}>{label}</span>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto p-2" positionerClassName="z-[502]">
				<CalendarComponent
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

export function ParentRowField({ value, onChange }: Readonly<{ value: string | null; onChange: (key: string) => void }>) {
	const [open, setOpen] = useState(false);
	const selected = PARENT_OPTIONS.find((option) => option.key === value);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label="Change parent" />}>
				{selected ? (
					<span className="flex min-w-0 items-center gap-1.5 text-sm text-text">
						<span className="shrink-0 font-medium text-text-subtle">{selected.key}</span>
						<span className="min-w-0 truncate text-text-subtle">{selected.summary}</span>
					</span>
				) : (
					<span className="text-sm text-text-subtlest">Add parent</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[18rem] p-0" positionerClassName="z-[502]">
				<Command>
					<CommandInput placeholder="Search work items" />
					<CommandList>
						<CommandEmpty>No work items found.</CommandEmpty>
						<CommandGroup heading="Recent">
							{PARENT_OPTIONS.map((option) => (
								<CommandItem
									key={option.key}
									onSelect={() => {
										onChange(option.key);
										setOpen(false);
									}}
									showCheckIcon={false}
									value={`${option.key} ${option.summary}`}
								>
									<span className="flex min-w-0 items-center gap-1.5">
										<span className="shrink-0 text-xs font-medium text-text-subtle">{option.key}</span>
										<span className="min-w-0 truncate text-sm">{option.summary}</span>
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

export function LabelsRowField({ value, onChange }: Readonly<{ value: readonly string[]; onChange: (next: string[]) => void }>) {
	const [open, setOpen] = useState(false);

	const toggle = (label: string) => {
		onChange(value.includes(label) ? value.filter((item) => item !== label) : [...value, label]);
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label="Edit labels" />}>
				{value.length > 0 ? (
					<TagGroup className="gap-1">
						{value.map((label) => (
							<Tag color="gray" key={label}>
								{label}
							</Tag>
						))}
					</TagGroup>
				) : (
					<span className="text-sm text-text-subtlest">Add label</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[16rem] p-0" positionerClassName="z-[502]">
				<Command>
					<CommandInput placeholder="Search labels" />
					<CommandList>
						<CommandEmpty>No labels found.</CommandEmpty>
						<CommandGroup>
							{LABEL_OPTIONS.map((label) => (
								<CommandItem
									aria-checked={value.includes(label)}
									key={label}
									onSelect={() => toggle(label)}
									showCheckIcon
									value={label}
								>
									{label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

const MAX_CREW_AVATARS = 3;

/** A single crew avatar: hexagon for agents, circle for people (mirrors the working stack). */
function CrewAvatar({ member }: Readonly<{ member: CrewMember }>) {
	const isAgent = member.kind === "agent";
	return (
		<Avatar className="shrink-0" shape={isAgent ? "hexagon" : "circle"} size="sm">
			{member.avatarUrl ? (
				<AvatarImage alt="" className={isAgent ? "object-contain" : undefined} src={member.avatarUrl} />
			) : null}
			<AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
		</Avatar>
	);
}

/** Multi-select of people + agents, grouped in the popover; trigger shows a mixed avatar stack. */
export function CrewRowField({ value, onChange }: Readonly<{ value: readonly CrewMember[]; onChange: (next: CrewMember[]) => void }>) {
	const [open, setOpen] = useState(false);

	const toggle = (member: CrewMember) => {
		onChange(
			value.some((item) => item.id === member.id)
				? value.filter((item) => item.id !== member.id)
				: [...value, member],
		);
	};

	const people = CREW_ROSTER.filter((member) => member.kind === "person");
	const agents = CREW_ROSTER.filter((member) => member.kind === "agent");
	const shown = value.slice(0, MAX_CREW_AVATARS);
	const overflow = value.length - shown.length;

	const renderOption = (member: CrewMember) => (
		<CommandItem
			aria-checked={value.some((item) => item.id === member.id)}
			key={member.id}
			onSelect={() => toggle(member)}
			showCheckIcon
			value={member.name}
		>
			<span className="flex min-w-0 items-center gap-2">
				<CrewAvatar member={member} />
				<span className="min-w-0 truncate text-sm text-text">{member.name}</span>
			</span>
		</CommandItem>
	);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label="Edit crew" />}>
				{value.length > 0 ? (
					<AvatarGroup className="shrink-0" label={`${value.length} crew members`}>
						{shown.map((member) => (
							<CrewAvatar key={member.id} member={member} />
						))}
						{overflow > 0 ? <AvatarGroupCount>+{overflow}</AvatarGroupCount> : null}
					</AvatarGroup>
				) : (
					<span className="text-sm text-text-subtlest">Add crew</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[16rem] p-0" positionerClassName="z-[502]">
				<Command>
					<CommandInput placeholder="Search people and agents" />
					<CommandList>
						<CommandEmpty>No crew found.</CommandEmpty>
						<CommandGroup heading="People">{people.map(renderOption)}</CommandGroup>
						<CommandGroup heading="Agents">{agents.map(renderOption)}</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

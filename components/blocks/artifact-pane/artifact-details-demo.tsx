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
import { ArtifactLabelsField } from "@/components/blocks/artifact-pane/artifact-labels-field";
import { PARENT_OPTIONS, PROJECT_OPTIONS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import { METADATA_PEOPLE, getMetadataPerson } from "@/components/blocks/jira-work-item/data/metadata-people";
import type { AgentPlannerAssignee } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	DateRowField,
	METADATA_PICKER_POPOVER_CLASS,
	METADATA_PICKER_POSITIONER_CLASS,
	MetadataSearchPicker,
	PersonRowField,
	PriorityRowField,
	StatusPill,
	type PriorityValue,
} from "@/components/blocks/jira-work-item/experimental/components/detail-field-editors";
import { DetailValueTrigger } from "@/components/blocks/jira-work-item/experimental/components/detail-field-row";
import { Calendar } from "@/components/ui/calendar";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag } from "@/components/ui/tag";
import { Tile, TileAvatar } from "@/components/ui/tile";
import type { RichTextSuggestionMenuItem } from "@/components/ui-custom/rich-text-editor";
const INITIAL_AGENT_IDS = ["meeting-insights-reporter", "readiness-checker"];
const PROJECT_AVATAR_SRCS: Readonly<Record<string, string>> = {
	"assets-cmdb": "/avatar-project/gears.svg",
	"esm-rfp-response": "/avatar-project/rocket.svg",
	"rovo-brand-council": "/avatar-project/compass.svg",
};
const ARTIFACT_PROJECT_OPTIONS = PROJECT_OPTIONS.map((project) => ({
	...project,
	avatarSrc: PROJECT_AVATAR_SRCS[project.id],
}));

function ProjectAvatar({ name, src }: Readonly<{ name: string; src: string }>) {
	return (
		<Tile aria-hidden className="p-0" isSnug label={name} size="small" variant="transparent">
			<TileAvatar alt="" aria-hidden shape="square" src={src} />
		</Tile>
	);
}

function ProjectField({ value, onChange }: Readonly<{ value: string | null; onChange: (id: string) => void }>) {
	const [open, setOpen] = useState(false);
	const selected = ARTIFACT_PROJECT_OPTIONS.find((project) => project.id === value);
	const items = ARTIFACT_PROJECT_OPTIONS.map((project): RichTextSuggestionMenuItem => ({
		description: project.team,
		icon: null,
		id: project.id,
		label: project.name,
		visual: { kind: "avatar", shape: "square", src: project.avatarSrc },
	}));

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label={selected ? "Change project" : "Add project"} />}>
				{selected ? (
					<span className="flex min-w-0 items-center gap-2">
						<ProjectAvatar name={selected.name} src={selected.avatarSrc} />
						<span className="truncate text-sm text-text">{selected.name}</span>
					</span>
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

type ArtifactEpicColor = "blue" | "green" | "purple";

const ARTIFACT_EPIC_COLORS: Readonly<Record<string, ArtifactEpicColor>> = {
	"RFP-100": "purple",
	"RFP-102": "blue",
	"RFP-103": "green",
};

function artifactEpicColor(key: string): ArtifactEpicColor {
	return ARTIFACT_EPIC_COLORS[key] ?? "purple";
}

function ArtifactEpicIcon() {
	return (
		<Icon
			aria-hidden
			render={<EpicIcon color="currentColor" label="" size="medium" spacing="none" />}
		/>
	);
}

function ArtifactEpicMenuIcon({ color }: Readonly<{ color: ArtifactEpicColor }>) {
	return (
		<IconTile
			aria-hidden
			as="span"
			icon={<ArtifactEpicIcon />}
			label=""
			size="small"
			variant={color}
		/>
	);
}

function ArtifactParentField({ value, onChange }: Readonly<{ value: string | null; onChange: (key: string) => void }>) {
	const [open, setOpen] = useState(false);
	const selected = PARENT_OPTIONS.find((option) => option.key === value);
	const items = PARENT_OPTIONS.map((option): RichTextSuggestionMenuItem => ({
		description: option.key,
		icon: null,
		id: option.key,
		label: option.summary,
		leadingVisual: <ArtifactEpicMenuIcon color={artifactEpicColor(option.key)} />,
	}));

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label="Change parent" />}>
				{selected ? (
					<Tag
						className="max-w-full self-center"
						color={artifactEpicColor(selected.key)}
						elemBefore={<ArtifactEpicIcon />}
					>
						{selected.summary}
					</Tag>
				) : (
					<span className="text-sm text-text-subtlest">Add parent</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className={METADATA_PICKER_POPOVER_CLASS} positionerClassName={METADATA_PICKER_POSITIONER_CLASS}>
				<div className="[&_.rich-text-command-menu-item:hover]:bg-bg-neutral-subtle-hovered!">
					<MetadataSearchPicker
						emptyLabel="No work items found"
						items={items}
						onEscape={() => setOpen(false)}
						onSelect={(item) => {
							onChange(item.id);
							setOpen(false);
						}}
						placeholder="Search work items"
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}

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
				<ProjectField onChange={(projectId) => update({ projectId })} value={metadata.projectId} />
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

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
import { ArtifactLabelsField } from "@/components/blocks/artifact-pane/artifact-labels-field";
import { PROJECT_OPTIONS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import { METADATA_PEOPLE, getMetadataPerson } from "@/components/blocks/jira-work-item/data/metadata-people";
import type { AgentPlannerAssignee } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	DateRowField,
	filterMetadataSearchItems,
	METADATA_PICKER_POPOVER_CLASS,
	METADATA_PICKER_POSITIONER_CLASS,
	MetadataSearchPicker,
	ParentRowField,
	PersonRowField,
	PriorityRowField,
	StatusPill,
	type PriorityValue,
} from "@/components/blocks/jira-work-item/experimental/components/detail-field-editors";
import { DetailValueTrigger } from "@/components/blocks/jira-work-item/experimental/components/detail-field-row";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tile, TileAvatar } from "@/components/ui/tile";
import { CheckIcon, SearchIcon } from "@/components/ui/vpk-icons";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import {
	RichTextCommandMenuSearchField,
	RichTextSuggestionEmptyState,
	RichTextSuggestionMenu,
	type RichTextSuggestionMenuItem,
} from "@/components/ui-custom/rich-text-editor";

const ARTIFACT_AGENTS = BOARD_AGENTS.filter((agent) => Boolean(agent.avatarSrc || agent.brandName));
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

function ArtifactAgentsSearchPicker({
	items,
	onEscape,
	onSelect,
	selectedItemIds,
}: Readonly<{
	items: readonly RichTextSuggestionMenuItem[];
	onEscape: () => void;
	onSelect: (item: RichTextSuggestionMenuItem) => void;
	selectedItemIds: ReadonlySet<string>;
}>) {
	const [query, setQuery] = useState("");
	const visibleItems = filterMetadataSearchItems(items, query);

	return (
		<RichTextSuggestionMenu
			className="rich-text-command-menu-borderless"
			emptyLabel="No agents found"
			emptyState={<RichTextSuggestionEmptyState label="No agents found" />}
			header={(
				<RichTextCommandMenuSearchField
					autoFocus
					icon={<SearchIcon className="size-4 text-icon-subtle" />}
					label="Search agents"
					onClear={() => setQuery("")}
					onEscape={onEscape}
					onValueChange={setQuery}
					value={query}
				/>
			)}
			items={visibleItems}
			onSelect={onSelect}
			selectedIndex={-1}
			selectedItemIds={selectedItemIds}
			title="Search agents"
		/>
	);
}

function AgentsField({ value, onChange }: Readonly<{ value: readonly string[]; onChange: (ids: string[]) => void }>) {
	const [open, setOpen] = useState(false);
	const items = ARTIFACT_AGENTS.map((agent): RichTextSuggestionMenuItem => ({
		description: agent.byline,
		icon: <AiAgentIcon label="" size="small" />,
		id: agent.id,
		label: agent.name,
		leadingVisual: (
			<AgentAvatarVisual
				avatarSrc={agent.avatarSrc}
				brandName={agent.brandName}
				fallbackText={agent.name.slice(0, 2).toUpperCase()}
				sizePx={24}
			/>
		),
		trailing: value.includes(agent.id) ? <CheckIcon className="size-4 text-icon-success" /> : undefined,
	}));
	const selectedAgents = value
		.map((id) => ARTIFACT_AGENTS.find((agent) => agent.id === id))
		.filter((agent): agent is (typeof ARTIFACT_AGENTS)[number] => Boolean(agent));

	const toggleAgent = (id: string) => {
		onChange(value.includes(id) ? value.filter((agentId) => agentId !== id) : [...value, id]);
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label="Edit agents" />}>
				{selectedAgents.length > 0 ? (
					<AvatarGroup className="relative shrink-0" label={`${selectedAgents.length} agents`}>
						{selectedAgents.slice(0, 3).map((agent) => (
							<AgentAvatarVisual
								avatarClassName="shrink-0"
								avatarSrc={agent.avatarSrc}
								brandName={agent.brandName}
								fallbackText={agent.name.slice(0, 2).toUpperCase()}
								key={agent.id}
								sizePx={16}
							/>
						))}
						{selectedAgents.length > 3 ? (
							<AvatarGroupCount>+{selectedAgents.length - 3}</AvatarGroupCount>
						) : null}
					</AvatarGroup>
				) : (
					<span className="text-sm text-text-subtlest">Add agents</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className={METADATA_PICKER_POPOVER_CLASS} positionerClassName={METADATA_PICKER_POSITIONER_CLASS}>
				<ArtifactAgentsSearchPicker
					items={items}
					onEscape={() => setOpen(false)}
					onSelect={(item) => toggleAgent(item.id)}
					selectedItemIds={new Set(value)}
				/>
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
				<AgentsField onChange={(agentIds) => update({ agentIds })} value={metadata.agentIds} />
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
						<ParentRowField onChange={(parent) => update({ parent })} value={metadata.parent} />
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

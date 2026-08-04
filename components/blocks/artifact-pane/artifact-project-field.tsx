"use client";

import { useState } from "react";

import { PROJECT_OPTIONS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import {
	METADATA_PICKER_POPOVER_CLASS,
	METADATA_PICKER_POSITIONER_CLASS,
	MetadataSearchPicker,
} from "@/components/blocks/jira-work-item/experimental/components/detail-field-editors";
import { DetailValueTrigger } from "@/components/blocks/jira-work-item/experimental/components/detail-field-row";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tile, TileAvatar } from "@/components/ui/tile";
import type { RichTextSuggestionMenuItem } from "@/components/ui-custom/rich-text-editor";

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

/** Shared Artifact Pane project trigger, branded avatar, and project picker. */
export function ArtifactProjectField({ value, onChange }: Readonly<{ value: string | null; onChange: (id: string) => void }>) {
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

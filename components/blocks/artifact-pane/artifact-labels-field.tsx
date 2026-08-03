"use client";

import { useState } from "react";

import { LABEL_OPTIONS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import {
	METADATA_PICKER_POPOVER_CLASS,
	METADATA_PICKER_POSITIONER_CLASS,
} from "@/components/blocks/jira-work-item/experimental/components/detail-field-editors";
import { DetailValueTrigger } from "@/components/blocks/jira-work-item/experimental/components/detail-field-row";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, TagGroup, type TagColor } from "@/components/ui/tag";
import { SearchIcon } from "@/components/ui/vpk-icons";
import {
	RichTextCommandMenuSearchField,
	RichTextSuggestionEmptyState,
} from "@/components/ui-custom/rich-text-editor";

const LABEL_COLORS = ["blue", "green", "purple", "orange", "teal", "magenta", "yellow"] as const satisfies readonly TagColor[];

function labelColor(label: string): TagColor {
	const optionIndex = LABEL_OPTIONS.indexOf(label);
	if (optionIndex >= 0) {
		return LABEL_COLORS[(optionIndex * 3 + 1) % LABEL_COLORS.length];
	}

	const hash = Array.from(label).reduce((total, character) => total + character.codePointAt(0)!, 0);
	return LABEL_COLORS[hash % LABEL_COLORS.length];
}

function LabelOptionGroup({
	heading,
	labels,
	onToggle,
	selected,
}: Readonly<{
	heading: string;
	labels: readonly string[];
	onToggle: (label: string) => void;
	selected: boolean;
}>) {
	if (labels.length === 0) {
		return null;
	}

	return (
		<>
			<div className="rich-text-command-menu-heading" role="presentation">
				{heading}
			</div>
			{labels.map((label) => (
				<button
					aria-selected={selected}
					className="rich-text-command-menu-item grid-cols-1!"
					key={label}
					onClick={() => onToggle(label)}
					onMouseDown={(event) => event.preventDefault()}
					role="option"
					type="button"
				>
					<Tag className="justify-self-start" color={labelColor(label)}>{label}</Tag>
				</button>
			))}
		</>
	);
}

export function ArtifactLabelsField({
	onChange,
	value,
}: Readonly<{ onChange: (next: string[]) => void; value: readonly string[] }>) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const normalizedQuery = query.trim().toLowerCase();
	const visibleLabels = LABEL_OPTIONS.filter((label) => label.toLowerCase().includes(normalizedQuery));
	const selectedLabels = visibleLabels.filter((label) => value.includes(label));
	const moreLabels = visibleLabels.filter((label) => !value.includes(label));
	const firstVisibleLabel = moreLabels[0] ?? selectedLabels[0];

	const toggle = (label: string) => {
		onChange(value.includes(label) ? value.filter((item) => item !== label) : [...value, label]);
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger render={<DetailValueTrigger aria-label="Edit labels" />}>
				{value.length > 0 ? (
					<TagGroup className="gap-1">
						{value.map((label) => (
							<Tag color={labelColor(label)} key={label}>
								{label}
							</Tag>
						))}
					</TagGroup>
				) : (
					<span className="text-sm text-text-subtlest">Add label</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="start" className={METADATA_PICKER_POPOVER_CLASS} positionerClassName={METADATA_PICKER_POSITIONER_CLASS}>
				<div
					aria-label="Search labels"
					className="rich-text-command-menu rich-text-command-menu-borderless"
					data-has-header="true"
					role="listbox"
				>
					<RichTextCommandMenuSearchField
						autoFocus
						icon={<SearchIcon className="size-4 text-icon-subtle" />}
						label="Search labels"
						onClear={() => setQuery("")}
						onEscape={() => setOpen(false)}
						onSubmit={() => {
							if (firstVisibleLabel) {
								toggle(firstVisibleLabel);
							}
						}}
						onValueChange={setQuery}
						value={query}
					/>
					<div className="rich-text-command-menu-list">
						{visibleLabels.length > 0 ? (
							<>
								<LabelOptionGroup heading="Selected" labels={selectedLabels} onToggle={toggle} selected />
								<LabelOptionGroup heading="More labels" labels={moreLabels} onToggle={toggle} selected={false} />
							</>
						) : (
							<RichTextSuggestionEmptyState label="No labels found" />
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

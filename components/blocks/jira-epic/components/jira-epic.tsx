"use client";

import AddIcon from "@atlaskit/icon/core/add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import EpicIcon from "@atlaskit/icon/core/epic";
import LinkIcon from "@atlaskit/icon/core/link";
import { useMemo, useState, type ComponentProps, type ReactElement } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

export type JiraEpicColor = "purple" | "magenta" | "blue" | "sky" | "green";

export interface JiraEpicOption {
	id: string;
	issueKey: string;
	name: string;
	color: JiraEpicColor;
}

export interface JiraEpicProps extends Omit<ComponentProps<"div">, "children" | "onSelect"> {
	epics: readonly JiraEpicOption[];
	addParentLabel?: string;
	className?: string;
	contentClassName?: string;
	defaultOpen?: boolean;
	defaultSelectedEpicId?: string | null;
	label?: string;
	onAddParent?: () => void;
	onEpicSelect?: (epicId: string, epic: JiraEpicOption) => void;
	onOpenChange?: (open: boolean) => void;
	onRemoveParent?: () => void;
	onViewParent?: () => void;
	open?: boolean;
	placeholder?: string;
	removeParentLabel?: string;
	selectedEpicId?: string | null;
	showLabel?: boolean;
	triggerLabel?: string;
	viewParentLabel?: string;
}

const EPIC_ICON_COLOR_CLASSES: Record<JiraEpicColor, string> = {
	purple: "text-icon-accent-purple",
	magenta: "text-icon-accent-magenta",
	blue: "text-icon-accent-blue",
	sky: "text-icon-information",
	green: "text-icon-accent-green",
};

const EPIC_TAG_COLORS: Record<JiraEpicColor, "blue" | "green" | "magenta" | "purple"> = {
	purple: "purple",
	magenta: "magenta",
	blue: "blue",
	sky: "blue",
	green: "green",
};

function EpicGlyph({ className }: Readonly<{ className?: string }>): ReactElement {
	return (
		<Icon
			aria-hidden
			className={cn("size-4", className)}
			render={<EpicIcon label="" size="medium" spacing="none" color="currentColor" />}
		/>
	);
}

function EpicTagIcon(): ReactElement {
	return (
		<IconTile
			aria-hidden
			as="span"
			className="text-current"
			icon={<EpicGlyph />}
			iconSize="medium"
			label=""
			size="xxsmall"
			variant="transparent"
		/>
	);
}

function EpicMenuIcon({ color }: Readonly<{ color: JiraEpicColor }>): ReactElement {
	return <EpicGlyph className={EPIC_ICON_COLOR_CLASSES[color]} />;
}

export function JiraEpic({
	addParentLabel = "Add parent",
	className,
	contentClassName,
	defaultOpen = false,
	defaultSelectedEpicId,
	epics,
	label = "Parent",
	onAddParent,
	onEpicSelect,
	onOpenChange,
	onRemoveParent,
	onViewParent,
	open,
	placeholder = "Add parent",
	removeParentLabel = "Remove parent",
	selectedEpicId,
	showLabel = true,
	triggerLabel = "Select parent epic",
	viewParentLabel = "View parent",
	...props
}: Readonly<JiraEpicProps>): ReactElement {
	const firstEpicId = epics[0]?.id ?? null;
	const initialSelectedEpicId = defaultSelectedEpicId === undefined ? firstEpicId : defaultSelectedEpicId;
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const [internalSelectedEpicId, setInternalSelectedEpicId] = useState<string | null>(initialSelectedEpicId);
	const resolvedOpen = open ?? internalOpen;
	const resolvedSelectedEpicId = selectedEpicId === undefined ? internalSelectedEpicId : selectedEpicId;
	const selectedEpic = useMemo(
		() => (resolvedSelectedEpicId ? epics.find((epic) => epic.id === resolvedSelectedEpicId) ?? null : null),
		[epics, resolvedSelectedEpicId],
	);

	function handleOpenChange(nextOpen: boolean) {
		if (open === undefined) {
			setInternalOpen(nextOpen);
		}
		onOpenChange?.(nextOpen);
	}

	function handleEpicSelect(epic: JiraEpicOption) {
		if (selectedEpicId === undefined) {
			setInternalSelectedEpicId(epic.id);
		}
		onEpicSelect?.(epic.id, epic);
		handleOpenChange(false);
	}

	function handleAddParent() {
		onAddParent?.();
		handleOpenChange(false);
	}

	function handleViewParent() {
		onViewParent?.();
		handleOpenChange(false);
	}

	function handleRemoveParent() {
		if (selectedEpicId === undefined) {
			setInternalSelectedEpicId(null);
		}
		onRemoveParent?.();
		handleOpenChange(false);
	}

	return (
		<div className={cn("inline-flex min-w-0 flex-col items-start", className)} {...props}>
			{showLabel ? <p className="mb-1 text-xs font-semibold leading-4 text-text-subtlest">{label}</p> : null}
			<DropdownMenu open={resolvedOpen} onOpenChange={handleOpenChange}>
				<DropdownMenuTrigger
					render={
						<button
							type="button"
							className="inline-flex min-w-0 items-center rounded-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
							aria-label={triggerLabel}
						/>
					}
				>
					<Tag
						className="pointer-events-none max-w-none text-sm"
						color={selectedEpic ? EPIC_TAG_COLORS[selectedEpic.color] : "gray"}
						elemBefore={selectedEpic ? <EpicTagIcon /> : null}
					>
						<span className="inline-flex min-w-0 items-center gap-1">
							<span className="truncate">{selectedEpic ? selectedEpic.name : placeholder}</span>
							<ChevronDownIcon label="" size="small" />
						</span>
					</Tag>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className={cn("w-[356px] p-2", contentClassName)} sideOffset={8}>
					<DropdownMenuGroup>
						{epics.map((epic) => (
							<DropdownMenuItem
								className="h-11 gap-3 pl-2 pr-3"
								elemBefore={<EpicMenuIcon color={epic.color} />}
								key={epic.id}
								onSelect={() => handleEpicSelect(epic)}
								selected={epic.id === selectedEpic?.id}
							>
								<span className="truncate">
									{epic.issueKey} {epic.name}
								</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem elemBefore={<Icon render={<AddIcon label="" />} aria-hidden />} onSelect={handleAddParent}>
							{addParentLabel}
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!selectedEpic}
							elemBefore={<Icon render={<LinkIcon label="" />} aria-hidden />}
							onSelect={handleViewParent}
						>
							{viewParentLabel}
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={!selectedEpic}
							elemBefore={<Icon render={<CrossIcon label="" />} aria-hidden />}
							onSelect={handleRemoveParent}
						>
							{removeParentLabel}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

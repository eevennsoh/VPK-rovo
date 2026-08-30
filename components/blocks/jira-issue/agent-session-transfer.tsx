"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import BugIcon from "@atlaskit/icon/core/bug";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import EpicIcon from "@atlaskit/icon/core/epic";
import StoryIcon from "@atlaskit/icon/core/story";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";

import {
	getJiraIssueMoveMenuRows,
	resolveNearestDropZone,
	type JiraIssueMoveWorkItem,
	type JiraIssueSessionDropZone,
	type JiraIssueSessionDropZoneTarget,
	type JiraIssueSessionPointer,
} from "@/components/blocks/jira-issue/agent-session-transfer-model";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchIcon } from "@/components/ui/vpk-icons";
import {
	RichTextCommandMenuSearchField,
	RichTextSuggestionEmptyState,
	RichTextSuggestionMenu,
	type RichTextSuggestionMenuItem,
} from "@/components/ui-custom/rich-text-editor";
// suggestion-menu.tsx ships no styles of its own; without this it renders bare.
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { cn } from "@/lib/utils";

/** Keeps the Base UI popup transparent so the editor-palette menu owns the surface. */
const TRANSFER_POPOVER_CLASS =
	"w-auto gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none dark:shadow-none [[data-color-mode=dark]_&]:shadow-none";
const TRANSFER_POSITIONER_CLASS = "z-[700]";
const TRANSFER_SIDE_OFFSET = 8;
/** Slack around a zone rect that still counts as a drop, so the edges are forgiving. */
const TRANSFER_DROP_HALO_PX = 24;
/**
 * Hidden at rest, revealed on hover or keyboard focus anywhere inside the host
 * card. `translate` rides the same declaration as `opacity` on purpose: two
 * `transition-*` utilities on one element collapse to the last one, so the
 * drag shift would snap if it declared its own.
 */
const TRANSFER_REVEAL_CLASS =
	"opacity-0 transition-[opacity,translate] duration-fast ease-out-practical motion-reduce:transition-none group-hover/jira-issue-transfer:pointer-events-auto group-hover/jira-issue-transfer:opacity-100 group-has-[:focus-visible]/jira-issue-transfer:pointer-events-auto group-has-[:focus-visible]/jira-issue-transfer:opacity-100";
const TRANSFER_ZONE_BASE_CLASS =
	"flex select-none items-center justify-center rounded-lg border px-3 text-center outline-none transition-[flex-grow,height,background-color,border-color,color] duration-medium ease-in-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none";
/** Resting affordance: compact 24px row with a solid stroke. */
const TRANSFER_ZONE_REST_CLASS =
	"h-6 border-solid border-border text-xs leading-4 text-text-subtle hover:bg-bg-neutral-subtle-hovered";
/** Once a session is pulled out the targets grow into 48px dashed drop wells. */
const TRANSFER_ZONE_DRAG_CLASS = "h-12 border-dashed border-border-bold text-sm leading-5 text-text-subtle";
/** Pointer is over this well: blue stroke, fill, and label together. */
const TRANSFER_ZONE_ARMED_CLASS = "border-dashed border-border-selected bg-bg-selected text-text-selected";
/**
 * Both wells share the row evenly until one arms, then it takes roughly a
 * two-thirds share. Widening the live target is the whole hit-feedback story —
 * it grows toward the cursor instead of the wells leaning at it, so the drop
 * rects stay where the user aimed.
 */
const TRANSFER_ZONE_SHARE_REST_CLASS = "flex-1";
const TRANSFER_ZONE_SHARE_ARMED_CLASS = "flex-[1.7_1_0%]";
/** The whole region eases down as the session leaves the chin, opening a gap. */
const TRANSFER_DRAG_SHIFT_CLASS = "translate-y-2";

/** The host card must carry this; the reveal keys off hover/focus of this group. */
export const JIRA_ISSUE_SESSION_TRANSFER_GROUP_CLASS = "group/jira-issue-transfer";

/** Glyph + hue pairing per work item type, kept at the 16px new-core default. */
const WORK_ITEM_TYPE_ICON: Record<string, readonly [typeof TaskIcon, string]> = {
	Bug: [BugIcon, "text-icon-accent-red"],
	Epic: [EpicIcon, "text-icon-accent-purple"],
	Story: [StoryIcon, "text-icon-accent-green"],
	Subtask: [SubtasksIcon, "text-icon-accent-blue"],
	Task: [TaskIcon, "text-icon-accent-blue"],
};

function MoveWorkItemTypeIcon({ type }: Readonly<{ type?: string }>) {
	const [Glyph, tone] = WORK_ITEM_TYPE_ICON[type ?? "Task"] ?? WORK_ITEM_TYPE_ICON.Task;
	return (
		<span className={cn("shrink-0", tone)}>
			<Glyph color="currentColor" label="" />
		</span>
	);
}

/** Demo-owned copy and commit handlers. Every label has a neutral default. */
export interface JiraIssueAgentSessionTransferConfig {
	emptyLabel?: string;
	headingLabel?: string;
	moveLabel?: string;
	moveWorkItems: readonly JiraIssueMoveWorkItem[];
	onMove?: (workItemKey: string) => void;
	onUnlink?: () => void;
	prompt?: string;
	searchPlaceholder?: string;
	unlinkLabel?: string;
}

export interface JiraIssueAgentSessionTransferProps {
	config: Readonly<JiraIssueAgentSessionTransferConfig>;
	/** True while a session row is dragged; keeps the region revealed. */
	dragging?: boolean;
	onMenuOpenChange?: (open: boolean) => void;
	/** Viewport-space pointer while dragging; drives the drop-zone hit test. */
	pointer?: JiraIssueSessionPointer | null;
	sessionLabel?: string;
}

function readDropZones(
	...refs: readonly [JiraIssueSessionDropZone, React.RefObject<HTMLButtonElement | null>][]
): readonly JiraIssueSessionDropZoneTarget[] {
	return refs.flatMap(([id, ref]) => (ref.current ? [{ id, rect: ref.current.getBoundingClientRect() }] : []));
}

type TransferDropZoneProps = Readonly<
	Omit<ComponentProps<"button">, "children" | "ref"> & {
		armed: boolean;
		description: string;
		/** True once a session is out of the chin: grow the wells and go dashed. */
		dragging: boolean;
		label: string;
		/** Read by the drop-zone hit test. */
		measureRef: React.RefObject<HTMLButtonElement | null>;
		/** Injected by Base UI on the Move popover trigger. */
		ref?: React.Ref<HTMLButtonElement>;
	}
>;

function TransferDropZone({
	armed,
	description,
	dragging,
	label,
	measureRef,
	ref,
	...buttonProps
}: TransferDropZoneProps) {
	const attachRef = (node: HTMLButtonElement | null) => {
		measureRef.current = node;
		if (typeof ref === "function") ref(node);
		else if (ref) ref.current = node;
	};

	return (
		<button
			aria-label={description}
			className={cn(
				TRANSFER_ZONE_BASE_CLASS,
				armed ? TRANSFER_ZONE_SHARE_ARMED_CLASS : TRANSFER_ZONE_SHARE_REST_CLASS,
				dragging ? TRANSFER_ZONE_DRAG_CLASS : TRANSFER_ZONE_REST_CLASS,
				armed ? TRANSFER_ZONE_ARMED_CLASS : null,
			)}
			data-armed={armed || undefined}
			data-dragging={dragging || undefined}
			type="button"
			{...buttonProps}
			ref={attachRef}
		>
			{label}
		</button>
	);
}

function MoveMenu({
	config,
	onEscape,
	onSelectKey,
}: Readonly<{
	config: Readonly<JiraIssueAgentSessionTransferConfig>;
	onEscape: () => void;
	onSelectKey: (workItemKey: string) => void;
}>) {
	const [query, setQuery] = useState("");
	const placeholder = config.searchPlaceholder ?? "Type, search or paste URL";
	const emptyLabel = config.emptyLabel ?? "No work items found";

	// A `headingLabel` entry renders as a standalone, non-interactive heading
	// *instead of* an option row, so it is prepended as its own entry.
	const items = useMemo((): readonly RichTextSuggestionMenuItem[] => {
		const heading = config.headingLabel ?? "Recently viewed";
		const typeByKey = new Map(config.moveWorkItems.map((item) => [item.key, item.type]));
		const options = getJiraIssueMoveMenuRows(config.moveWorkItems, query, heading).map(
			(row): RichTextSuggestionMenuItem => ({
				description: row.description,
				icon: null,
				id: row.id,
				label: row.label,
				leadingVisual: <MoveWorkItemTypeIcon type={typeByKey.get(row.id)} />,
			}),
		);
		return options.length > 0
			? [{ headingLabel: heading, icon: null, id: "move-heading", label: heading }, ...options]
			: options;
	}, [config.headingLabel, config.moveWorkItems, query]);

	const firstSelectable = items.find((item) => item.headingLabel === undefined);

	return (
		<RichTextSuggestionMenu
			className="rich-text-command-menu-borderless"
			emptyLabel={emptyLabel}
			emptyState={<RichTextSuggestionEmptyState label={emptyLabel} />}
			header={
				<RichTextCommandMenuSearchField
					autoFocus
					icon={<SearchIcon className="size-4 text-icon-subtle" />}
					label={placeholder}
					onClear={() => setQuery("")}
					// The field stops propagation on every key, so Base UI never sees Escape.
					onEscape={onEscape}
					onSubmit={() => {
						if (firstSelectable) onSelectKey(firstSelectable.id);
					}}
					onValueChange={setQuery}
					value={query}
				/>
			}
			items={items}
			onSelect={(item) => onSelectKey(item.id)}
			selectedIndex={-1}
			title={placeholder}
		/>
	);
}

export function JiraIssueAgentSessionTransfer({
	config,
	dragging = false,
	onMenuOpenChange,
	pointer,
	sessionLabel = "agent session",
}: Readonly<JiraIssueAgentSessionTransferProps>) {
	const unlinkRef = useRef<HTMLButtonElement | null>(null);
	const moveRef = useRef<HTMLButtonElement | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const [armed, setArmed] = useState<JiraIssueSessionDropZone | null>(null);
	const armedRef = useRef<JiraIssueSessionDropZone | null>(null);

	const setMenu = (open: boolean) => {
		setMenuOpen(open);
		onMenuOpenChange?.(open);
	};

	// The two commit handlers change identity on every render, so the drop
	// effect reads them from a committed ref rather than resubscribing (and
	// re-running its arm/commit pass) each time the parent re-renders.
	const commitRef = useRef<{ onUnlink?: () => void; setMenu: (open: boolean) => void } | null>(null);
	useEffect(() => {
		commitRef.current = { onUnlink: config.onUnlink, setMenu };
	});

	// Arms the nearest zone as the pointer moves, then commits on release — a
	// drop runs exactly the callback that zone's click handler runs.
	useEffect(() => {
		const zones = readDropZones(["unlink", unlinkRef], ["move", moveRef]);
		const next = dragging && pointer ? resolveNearestDropZone(pointer, zones, TRANSFER_DROP_HALO_PX) : null;
		const dropped = dragging ? null : armedRef.current;
		armedRef.current = next;
		setArmed(next);
		if (dropped === "unlink") commitRef.current?.onUnlink?.();
		if (dropped === "move") commitRef.current?.setMenu(true);
	}, [dragging, pointer]);

	const revealed = dragging || menuOpen;

	return (
		<div
			className={cn(
				"flex flex-col gap-2 pt-2",
				TRANSFER_REVEAL_CLASS,
				revealed ? "pointer-events-auto opacity-100" : "pointer-events-none",
				dragging ? TRANSFER_DRAG_SHIFT_CLASS : null,
			)}
			data-slot="jira-issue-session-transfer"
		>
			{/* Collapses to zero height once the session is out, so the wells take
			    the space the prompt was holding instead of the region growing. */}
			<div
				aria-hidden
				className={cn(
					"grid overflow-hidden transition-[grid-template-rows,opacity] duration-medium ease-in-out motion-reduce:transition-none",
					dragging ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
				)}
				data-slot="jira-issue-session-transfer-prompt"
			>
				<div className="flex min-h-0 items-center gap-2">
					<span className="h-px flex-1 bg-border" />
					<span className="text-xs leading-4 text-text-subtlest">{config.prompt ?? "Drag here to"}</span>
					<span className="h-px flex-1 bg-border" />
				</div>
			</div>
			<div className="flex items-stretch gap-2">
				<TransferDropZone
					armed={armed === "unlink"}
					description={`Unlink ${sessionLabel} from this work item`}
					dragging={dragging}
					label={config.unlinkLabel ?? "Unlink"}
					measureRef={unlinkRef}
					onClick={() => config.onUnlink?.()}
				/>
				<Popover onOpenChange={setMenu} open={menuOpen}>
					<PopoverTrigger
						render={
							<TransferDropZone
								armed={armed === "move"}
								description={`Move ${sessionLabel} to another work item`}
								dragging={dragging}
								label={config.moveLabel ?? "Move"}
								measureRef={moveRef}
							/>
						}
					/>
					<PopoverContent
						align="start"
						className={TRANSFER_POPOVER_CLASS}
						positionerClassName={TRANSFER_POSITIONER_CLASS}
						sideOffset={TRANSFER_SIDE_OFFSET}
					>
						<MoveMenu
							config={config}
							onEscape={() => setMenu(false)}
							onSelectKey={(key) => {
								setMenu(false);
								config.onMove?.(key);
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}

/** Post-move confirmation, reusing the agent-row chrome so it lands in place. */
export function JiraIssueAgentSessionNotice({ message }: Readonly<{ message: string }>) {
	return (
		<div
			className="flex h-6 w-full min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left"
			data-slot="jira-issue-agent-row"
		>
			<Icon aria-hidden className="shrink-0 text-icon-success" render={<CheckMarkIcon label="" />} />
			<span className="block min-w-0 flex-1 truncate text-sm leading-5 text-text-subtle">{message}</span>
		</div>
	);
}

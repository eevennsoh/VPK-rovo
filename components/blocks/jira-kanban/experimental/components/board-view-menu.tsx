"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- DropdownMenuTrigger uses a render-node so the View button owns the visual state.
import { useState, type ComponentType } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import MergeFailureIcon from "@atlaskit/icon/core/merge-failure";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import MergeQueueIcon from "@atlaskit/icon-lab/core/merge-queue";

import { BOARD_GROUP_DEFAULT_ID, BOARD_GROUP_OPTIONS } from "../data/board-group-options";
import {
	BOARD_SORT_DEFAULT_ID,
	BOARD_SORT_OPTIONS,
	BOARD_SORT_ORDER_DEFAULT_ID,
	BOARD_SORT_ORDER_OPTIONS,
} from "../data/board-sort-options";
import {
	BOARD_AGENT_STATE_OPTIONS,
	BOARD_COLUMN_OPTIONS,
	BOARD_COLUMN_SIZE_DEFAULT_ID,
	BOARD_COLUMN_SIZE_OPTIONS,
	BOARD_FIELD_OPTIONS,
	BOARD_HIDE_DONE_DEFAULT_ID,
	BOARD_HIDE_DONE_OPTIONS,
	BOARD_PR_STATE_OPTIONS,
	type BoardPrStateId,
} from "../data/board-view-options";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { token } from "@/lib/tokens";

interface BoardViewMenuProps {
	compact?: boolean;
	surfaceLabel?: string;
}

interface VisibilityOption {
	id: string;
	label: string;
	shown: boolean;
	locked?: boolean;
}

/**
 * The leading glyph for a state row. Colour rides along with the glyph because
 * ADS ships its icon CSS unlayered, so a Tailwind text utility loses to it —
 * the `color` prop is the only reliable way to tint one of these.
 */
interface StateIcon {
	glyph: ComponentType<NewCoreIconProps>;
	color: NewCoreIconProps["color"];
}

type StateIcons = Readonly<Record<string, StateIcon>>;

/**
 * PR lifecycle glyphs, keyed by the same ids the option list uses. `satisfies
 * Record<BoardPrStateId, …>` makes an unmapped state a compile error rather
 * than a row that silently renders without its icon. Colours follow the
 * lifecycle the way Bitbucket and Jira already read: green while open, quiet
 * while a draft, blue in the queue, purple once merged, red when closed unmerged.
 */
const PR_STATE_ICONS = {
	open: { glyph: PullRequestIcon, color: token("color.icon.success") },
	// Same glyph as Open, just quiet: a draft IS a pull request, so colour alone
	// carries the difference rather than inventing a second shape for it.
	draft: { glyph: PullRequestIcon, color: token("color.icon.subtle") },
	queued: { glyph: MergeQueueIcon, color: token("color.icon.information") },
	merged: { glyph: MergeSuccessIcon, color: token("color.icon.discovery") },
	closed: { glyph: MergeFailureIcon, color: token("color.icon.danger") },
} as const satisfies Record<BoardPrStateId, StateIcon>;

/** The ids a list starts with checked, so state can be seeded once per list. */
function toShownIds(options: readonly VisibilityOption[]) {
	return new Set(options.filter((option) => option.shown).map((option) => option.id));
}

type SetIds = (update: (previous: Set<string>) => Set<string>) => void;

/**
 * Flip one id in a visibility set. Pure and parameterised by its setter, so it
 * lives at module scope rather than being rebuilt on every render.
 */
const toggleIn = (setIds: SetIds) => (id: string) => {
	setIds((previous) => {
		const next = new Set(previous);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		return next;
	});
};

interface VisibilityToggleSubmenuProps {
	label: string;
	options: readonly VisibilityOption[];
	checkedIds: ReadonlySet<string>;
	onToggle: (id: string) => void;
	/** Leading glyphs keyed by option id. Lists without one render label-only. */
	icons?: StateIcons;
}

/**
 * A submenu of show/hide checkboxes. Columns, PR state, Agent, and Show fields
 * are the same control over different lists, so they share one implementation
 * rather than four copies of the same rows.
 *
 * Controlled on purpose. Base UI unmounts a submenu's contents when it closes,
 * so an uncontrolled `defaultChecked` row would rebuild from the hard-coded
 * default on reopen and silently discard the click.
 */
function VisibilityToggleSubmenu({
	label,
	options,
	checkedIds,
	onToggle,
	icons,
}: Readonly<VisibilityToggleSubmenuProps>) {
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{options.map((option) => {
					const stateIcon = icons?.[option.id];
					return (
						<DropdownMenuCheckboxItem
							checked={checkedIds.has(option.id)}
							// `gap-2` only where a glyph is present; the icon-less lists
							// keep their labels flush against the row's own padding.
							className={stateIcon ? "gap-2" : undefined}
							// Some rows are always on — Jira locks Summary, for instance.
							disabled={option.locked}
							indicatorPlacement="end"
							key={option.id}
							onCheckedChange={() => onToggle(option.id)}
						>
							{stateIcon ? (
								// Decorative: the row's own text already names the state.
								<Icon render={<stateIcon.glyph color={stateIcon.color} label="" />} />
							) : null}
							{option.label}
						</DropdownMenuCheckboxItem>
					);
				})}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

/**
 * Production View picker chrome, mirroring Jira's board View settings panel.
 * The top level is three sections: grouping and sorting, then PR and agent
 * state, then column and card chrome. Each dimension lives behind its own
 * submenu so the list stays scannable.
 *
 * The menu owns its own selections and nothing else: it takes no board data and
 * hands nothing back, so a row moves this menu's indicator and never re-groups,
 * re-sorts, or re-renders the board. State lives here rather than on the items
 * because Base UI unmounts both the submenu and the menu on close — this
 * component stays mounted with the trigger, so the choices survive.
 */
export function BoardViewMenu({
	compact = false,
	surfaceLabel = "board",
}: Readonly<BoardViewMenuProps>) {
	const [groupId, setGroupId] = useState<string>(BOARD_GROUP_DEFAULT_ID);
	const [sortId, setSortId] = useState<string>(BOARD_SORT_DEFAULT_ID);
	const [sortOrderId, setSortOrderId] = useState<string>(BOARD_SORT_ORDER_DEFAULT_ID);
	const [hideDoneId, setHideDoneId] = useState<string>(BOARD_HIDE_DONE_DEFAULT_ID);
	const [columnSizeId, setColumnSizeId] = useState<string>(BOARD_COLUMN_SIZE_DEFAULT_ID);
	// One set per list rather than one shared set, so two lists can reuse an id
	// without silently toggling each other.
	const [shownColumnIds, setShownColumnIds] = useState(() => toShownIds(BOARD_COLUMN_OPTIONS));
	const [shownPrStateIds, setShownPrStateIds] = useState(() => toShownIds(BOARD_PR_STATE_OPTIONS));
	const [shownAgentStateIds, setShownAgentStateIds] = useState(() =>
		toShownIds(BOARD_AGENT_STATE_OPTIONS),
	);
	const [shownFieldIds, setShownFieldIds] = useState(() => toShownIds(BOARD_FIELD_OPTIONS));

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`Configure ${surfaceLabel} view`}
						size={compact ? "icon" : undefined}
						variant="outline"
					/>
				}
			>
				<Icon render={<CustomizeIcon label="" />} />
				{compact ? null : "View"}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-56">
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>Group by</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup
							aria-label={`Group ${surfaceLabel} by`}
							onValueChange={setGroupId}
							value={groupId}
						>
							{BOARD_GROUP_OPTIONS.map((option) => (
								<DropdownMenuRadioItem indicatorPlacement="end" key={option.id} value={option.id}>
									{option.label}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger>Sort by</DropdownMenuSubTrigger>
					{/* Two labelled sections push this submenu just past the shared 328px
					    popup cap, so raise it enough to show every row at once.
					    `--available-height` stays inside the `min()` so a short viewport
					    still wins and the list falls back to scrolling. */}
					<DropdownMenuSubContent className="max-h-[min(24rem,var(--available-height,24rem))]">
						<DropdownMenuRadioGroup onValueChange={setSortId} value={sortId}>
							<DropdownMenuLabel>Sort by</DropdownMenuLabel>
							{BOARD_SORT_OPTIONS.map((option) => (
								<DropdownMenuRadioItem indicatorPlacement="end" key={option.id} value={option.id}>
									{option.label}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
						<DropdownMenuSeparator />
						<DropdownMenuRadioGroup onValueChange={setSortOrderId} value={sortOrderId}>
							<DropdownMenuLabel>Order</DropdownMenuLabel>
							{BOARD_SORT_ORDER_OPTIONS.map((option) => (
								<DropdownMenuRadioItem indicatorPlacement="end" key={option.id} value={option.id}>
									{option.label}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSeparator />

				<VisibilityToggleSubmenu
					checkedIds={shownPrStateIds}
					icons={PR_STATE_ICONS}
					label="PR state"
					onToggle={toggleIn(setShownPrStateIds)}
					options={BOARD_PR_STATE_OPTIONS}
				/>

				<VisibilityToggleSubmenu
					checkedIds={shownAgentStateIds}
					label="Agent"
					onToggle={toggleIn(setShownAgentStateIds)}
					options={BOARD_AGENT_STATE_OPTIONS}
				/>

				<DropdownMenuSeparator />

				<DropdownMenuSub>
					<DropdownMenuSubTrigger>Column size</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup
							aria-label="Column size"
							onValueChange={setColumnSizeId}
							value={columnSizeId}
						>
							{BOARD_COLUMN_SIZE_OPTIONS.map((option) => (
								<DropdownMenuRadioItem indicatorPlacement="end" key={option.id} value={option.id}>
									{option.label}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger>Hide done work items</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{/* Single-section submenu: the sub-trigger already names it, so a
						    group label would just repeat itself. The name moves to
						    `aria-label` so the radio group keeps an accessible name. */}
						<DropdownMenuRadioGroup
							aria-label="Hide done work items after"
							onValueChange={setHideDoneId}
							value={hideDoneId}
						>
							{BOARD_HIDE_DONE_OPTIONS.map((option) => (
								<DropdownMenuRadioItem indicatorPlacement="end" key={option.id} value={option.id}>
									{option.label}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				<VisibilityToggleSubmenu
					checkedIds={shownColumnIds}
					label="Columns"
					onToggle={toggleIn(setShownColumnIds)}
					options={BOARD_COLUMN_OPTIONS}
				/>

				<VisibilityToggleSubmenu
					checkedIds={shownFieldIds}
					label="Show fields"
					onToggle={toggleIn(setShownFieldIds)}
					options={BOARD_FIELD_OPTIONS}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

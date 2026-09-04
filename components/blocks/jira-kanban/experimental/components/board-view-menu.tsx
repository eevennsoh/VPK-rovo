"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- DropdownMenuTrigger uses a render-node so the View button owns the visual state.
import { Fragment, useMemo, useState, type ComponentType, type ReactNode } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import DevicesIcon from "@atlaskit/icon/core/devices";
import MergeFailureIcon from "@atlaskit/icon/core/merge-failure";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";
import TaskInProgressIcon from "@atlaskit/icon/core/task-in-progress";
import TaskToDoIcon from "@atlaskit/icon/core/task-to-do";
import CloudIcon from "@atlaskit/icon-lab/core/cloud";
import MergeQueueIcon from "@atlaskit/icon-lab/core/merge-queue";
import QuestionCircleFilledIcon from "@atlaskit/icon-lab/core/question-circle-filled";

import { BOARD_GROUP_DEFAULT_ID, BOARD_GROUP_OPTIONS } from "../data/board-group-options";
import {
	BOARD_AGENT_HOST_DEFAULT_ID,
	BOARD_AGENT_HOST_OPTIONS,
	BOARD_AGENT_SESSION_STATE_IDS,
	BOARD_AGENT_STATE_OPTIONS,
	boardAgentHostFilterLabel,
	type BoardAgentHostId,
	type BoardAgentSessionStateId,
	BOARD_COLUMN_SIZE_DEFAULT_ID,
	BOARD_COLUMN_SIZE_OPTIONS,
	BOARD_FIELD_OPTIONS,
	BOARD_HIDE_DONE_DEFAULT_ID,
	BOARD_HIDE_DONE_OPTIONS,
	BOARD_PR_STATE_OPTIONS,
	isBoardAgentHostId,
	isBoardAgentSessionStateId,
	type BoardPrStateId,
} from "../data/board-view-options";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
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
	/**
	 * Whether Untracked sessions surface next to related Jira cards.
	 * Omit to keep the checkbox local chrome.
	 */
	showUntracked?: boolean;
	/** Writes Untracked. */
	onShowUntrackedChange?: (showUntracked: boolean) => void;
	/**
	 * Which linked session states surface on a card's activity row.
	 * Omit with the writer to keep Working / Needs input / Finished local.
	 */
	shownSessionStateIds?: ReadonlySet<BoardAgentSessionStateId>;
	/** Writes Working / Needs input / Finished. */
	onShownSessionStateIdsChange?: (shownSessionStateIds: Set<BoardAgentSessionStateId>) => void;
}

interface VisibilityOption {
	id: string;
	label: string;
	shown: boolean;
	locked?: boolean;
	separatorBefore?: boolean;
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
 * Leading menu glyph at ADS `small` (12px). The shared item rule forces
 * unclassed SVGs to 16px, so the size class has to win on the wrapper.
 */
function MenuLeadingIcon({ icon }: Readonly<{ icon: StateIcon }>) {
	return (
		<Icon
			className="size-3 [&_svg]:size-3!"
			render={<icon.glyph color={icon.color} label="" size="small" />}
		/>
	);
}

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
	draft: { glyph: PullRequestIcon, color: token("color.icon.subtlest") },
	queued: { glyph: MergeQueueIcon, color: token("color.icon.information") },
	merged: { glyph: MergeSuccessIcon, color: token("color.icon.discovery") },
	closed: { glyph: MergeFailureIcon, color: token("color.icon.danger") },
} as const satisfies Record<BoardPrStateId, StateIcon>;

/**
 * Agent submenu glyphs. Linked states reuse the Team EU chin shapes. Untracked
 * is the empty-task glyph because it is the absence of a session rather than a
 * live one.
 */
const AGENT_STATE_ICONS = {
	working: { glyph: TaskInProgressIcon, color: token("color.icon.subtlest") },
	"needs-input": { glyph: QuestionCircleFilledIcon, color: token("color.icon.information") },
	finished: { glyph: StatusSuccessIcon, color: token("color.icon.success") },
	untracked: { glyph: TaskToDoIcon, color: token("color.icon.subtlest") },
} as const satisfies Record<BoardAgentSessionStateId | "untracked", StateIcon>;

/**
 * Host-scope glyphs for the nested All / Cloud / Local picker. Identity icons,
 * not lifecycle traffic lights, so they share the quiet icon token.
 */
const AGENT_HOST_ICONS = {
	all: { glyph: AiAgentIcon, color: token("color.icon.subtle") },
	cloud: { glyph: CloudIcon, color: token("color.icon.subtle") },
	local: { glyph: DevicesIcon, color: token("color.icon.subtle") },
} as const satisfies Record<BoardAgentHostId, StateIcon>;

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
	/**
	 * Inserted before the first `separatorBefore` row so a different control
	 * (the host-scope picker) can sit as its own section above Untracked.
	 */
	children?: ReactNode;
}

/**
 * A submenu of show/hide checkboxes. Pull request, Agent, and Show fields are
 * the same control over different lists, so they share one implementation
 * rather than three copies of the same rows.
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
	children,
}: Readonly<VisibilityToggleSubmenuProps>) {
	const firstSeparatedIndex = options.findIndex((option) => option.separatorBefore);

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{options.map((option, index) => {
					const stateIcon = icons?.[option.id];
					return (
						<Fragment key={option.id}>
							{index === firstSeparatedIndex ? children : null}
							{option.separatorBefore ? <DropdownMenuSeparator /> : null}
							<DropdownMenuCheckboxItem
								checked={checkedIds.has(option.id)}
								// `gap-2` only where a glyph is present; the icon-less lists
								// keep their labels flush against the row's own padding.
								className={stateIcon ? "gap-2" : undefined}
								// Some rows are always on — Jira locks Summary, for instance.
								disabled={option.locked}
								indicatorPlacement="end"
								onCheckedChange={() => onToggle(option.id)}
							>
								{stateIcon ? (
									// Decorative: the row's own text already names the state.
									<MenuLeadingIcon icon={stateIcon} />
								) : null}
								{option.label}
							</DropdownMenuCheckboxItem>
						</Fragment>
					);
				})}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

interface AgentHostFilterSubmenuProps {
	hostId: BoardAgentHostId;
	onHostIdChange: (hostId: BoardAgentHostId) => void;
}

/**
 * Nested All / Cloud / Local picker. The trigger label and leading glyph both
 * follow the selection so "Show all agents" becomes "Show cloud agents" with
 * the cloud icon after Cloud.
 */
function AgentHostFilterSubmenu({
	hostId,
	onHostIdChange,
}: Readonly<AgentHostFilterSubmenuProps>) {
	const hostIcon = AGENT_HOST_ICONS[hostId];

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<MenuLeadingIcon icon={hostIcon} />
				{boardAgentHostFilterLabel(hostId)}
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<DropdownMenuRadioGroup
					aria-label="Show agents"
					onValueChange={(id) => {
						if (isBoardAgentHostId(id)) {
							onHostIdChange(id);
						}
					}}
					value={hostId}
				>
					{BOARD_AGENT_HOST_OPTIONS.map((option) => {
						const hostIcon = AGENT_HOST_ICONS[option.id];
						return (
							<DropdownMenuRadioItem
								className="gap-2"
								indicatorPlacement="end"
								key={option.id}
								value={option.id}
							>
								<MenuLeadingIcon icon={hostIcon} />
								{option.label}
							</DropdownMenuRadioItem>
						);
					})}
				</DropdownMenuRadioGroup>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

/**
 * Production View picker chrome, mirroring Jira's board View settings panel.
 * The top level is three sections: PR and agent state, then grouping, then
 * column and card chrome. Each dimension lives behind its own submenu so the
 * list stays scannable.
 *
 * The menu owns its own selections except the Agent rows the board can lift:
 * Working / Needs input / Finished hide matching activity chrome on cards, and
 * Untracked hides proximity sessions next to related issues. All / Cloud /
 * Local retitles the nested trigger and swaps its leading glyph. State lives
 * here rather than on the
 * items because Base UI unmounts both the submenu and the menu on close — this
 * component stays mounted with the trigger, so the choices survive.
 */
export function BoardViewMenu({
	compact = false,
	surfaceLabel = "board",
	showUntracked,
	onShowUntrackedChange,
	shownSessionStateIds,
	onShownSessionStateIdsChange,
}: Readonly<BoardViewMenuProps>) {
	const [groupId, setGroupId] = useState<string>(BOARD_GROUP_DEFAULT_ID);
	const [hideDoneId, setHideDoneId] = useState<string>(BOARD_HIDE_DONE_DEFAULT_ID);
	const [columnSizeId, setColumnSizeId] = useState<string>(BOARD_COLUMN_SIZE_DEFAULT_ID);
	// One set per list rather than one shared set, so two lists can reuse an id
	// without silently toggling each other.
	const [shownPrStateIds, setShownPrStateIds] = useState(() => toShownIds(BOARD_PR_STATE_OPTIONS));
	const [shownAgentStateIds, setShownAgentStateIds] = useState(() =>
		toShownIds(BOARD_AGENT_STATE_OPTIONS),
	);
	const [shownFieldIds, setShownFieldIds] = useState(() => toShownIds(BOARD_FIELD_OPTIONS));
	const [agentHostId, setAgentHostId] = useState<BoardAgentHostId>(BOARD_AGENT_HOST_DEFAULT_ID);
	const isUntrackedControlled = showUntracked !== undefined && onShowUntrackedChange !== undefined;
	const isSessionStatesControlled = (
		shownSessionStateIds !== undefined && onShownSessionStateIdsChange !== undefined
	);
	const shownAgentIds = useMemo(() => {
		if (!isSessionStatesControlled && !isUntrackedControlled) {
			return shownAgentStateIds;
		}

		const next = new Set(shownAgentStateIds);
		if (isSessionStatesControlled) {
			for (const id of BOARD_AGENT_SESSION_STATE_IDS) {
				if (shownSessionStateIds.has(id)) {
					next.add(id);
				} else {
					next.delete(id);
				}
			}
		}
		if (isUntrackedControlled) {
			if (showUntracked) {
				next.add("untracked");
			} else {
				next.delete("untracked");
			}
		}
		return next;
	}, [
		isSessionStatesControlled,
		isUntrackedControlled,
		showUntracked,
		shownAgentStateIds,
		shownSessionStateIds,
	]);
	const handleAgentToggle = (id: string) => {
		if (id === "untracked" && isUntrackedControlled) {
			onShowUntrackedChange(!showUntracked);
			return;
		}
		if (
			isBoardAgentSessionStateId(id)
			&& shownSessionStateIds !== undefined
			&& onShownSessionStateIdsChange !== undefined
		) {
			const next = new Set(shownSessionStateIds);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			onShownSessionStateIdsChange(next);
			return;
		}

		toggleIn(setShownAgentStateIds)(id);
	};

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
				<VisibilityToggleSubmenu
					checkedIds={shownPrStateIds}
					icons={PR_STATE_ICONS}
					label="Pull request"
					onToggle={toggleIn(setShownPrStateIds)}
					options={BOARD_PR_STATE_OPTIONS}
				/>

				<VisibilityToggleSubmenu
					checkedIds={shownAgentIds}
					icons={AGENT_STATE_ICONS}
					label="Agent"
					onToggle={handleAgentToggle}
					options={BOARD_AGENT_STATE_OPTIONS}
				>
					<DropdownMenuSeparator />
					<AgentHostFilterSubmenu hostId={agentHostId} onHostIdChange={setAgentHostId} />
				</VisibilityToggleSubmenu>

				<DropdownMenuSeparator />

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
					checkedIds={shownFieldIds}
					label="Show fields"
					onToggle={toggleIn(setShownFieldIds)}
					options={BOARD_FIELD_OPTIONS}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

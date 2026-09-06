"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- DropdownMenuTrigger uses a render-node so the View button owns the visual state.
import { useState, type ComponentType } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import MergeFailureIcon from "@atlaskit/icon/core/merge-failure";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PriorityTrivialIcon from "@atlaskit/icon/core/priority-trivial";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import ScreenIcon from "@atlaskit/icon/core/screen";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";
import TaskInProgressIcon from "@atlaskit/icon/core/task-in-progress";
import CloudIcon from "@atlaskit/icon-lab/core/cloud";
import GroupIcon from "@atlaskit/icon-lab/core/group";
import MergeQueueIcon from "@atlaskit/icon-lab/core/merge-queue";
import QuestionCircleFilledIcon from "@atlaskit/icon-lab/core/question-circle-filled";

import { BOARD_GROUP_OPTIONS, type BoardGroupOptionId } from "../data/board-group-options";
import {
	BOARD_AGENT_HOST_OPTIONS,
	BOARD_AGENT_STATE_OPTIONS,
	type BoardAgentFilterId,
	type BoardAgentSessionStateId,
	BOARD_PR_STATE_OPTIONS,
	type BoardPrStateId,
	isBoardAgentSessionStateId,
} from "../data/board-view-options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
	/** Kept for the experimental header's shared control contract. */
	simpleViews?: boolean;
	surfaceLabel?: string;
	/** Writes Untracked session visibility. */
	showUntracked?: boolean;
	onShowUntrackedChange?: (showUntracked: boolean) => void;
	/** Writes linked session-state visibility. */
	shownSessionStateIds?: ReadonlySet<BoardAgentSessionStateId>;
	onShownSessionStateIdsChange?: (shownSessionStateIds: Set<BoardAgentSessionStateId>) => void;
	/**
	 * Agents focus row. The page owns this so a temporary tab switch does not
	 * drop the overlay or the Clear restore path.
	 */
	agentFilterId?: BoardAgentFilterId | null;
	onAgentFilterIdChange?: (agentFilterId: BoardAgentFilterId | null) => void;
}

type BoardSessionTypeOption = Exclude<(typeof BOARD_AGENT_HOST_OPTIONS)[number], { id: "all" }>;
type BoardSessionTypeId = BoardSessionTypeOption["id"];

const BOARD_SESSION_TYPE_OPTIONS = BOARD_AGENT_HOST_OPTIONS.filter(
	(option): option is BoardSessionTypeOption => option.id !== "all",
);

interface QuickViewOption<TId extends string = string> {
	id: TId;
	label: string;
}

interface StateIcon {
	glyph: ComponentType<NewCoreIconProps>;
	color: NewCoreIconProps["color"];
}

type StateIcons = Readonly<Record<string, StateIcon>>;

function MenuLeadingIcon({ icon }: Readonly<{ icon: StateIcon }>) {
	return (
		<Icon
			className="size-3 [&_svg]:size-3!"
			render={<icon.glyph color={icon.color} label="" size="small" />}
		/>
	);
}

const PR_STATE_ICONS = {
	open: { glyph: PullRequestIcon, color: token("color.icon.success") },
	draft: { glyph: PullRequestIcon, color: token("color.icon.subtlest") },
	queued: { glyph: MergeQueueIcon, color: token("color.icon.information") },
	merged: { glyph: MergeSuccessIcon, color: token("color.icon.discovery") },
	closed: { glyph: MergeFailureIcon, color: token("color.icon.danger") },
} as const satisfies Record<BoardPrStateId, StateIcon>;

const AGENT_STATE_ICONS = {
	working: { glyph: TaskInProgressIcon, color: token("color.icon.subtlest") },
	"needs-input": { glyph: QuestionCircleFilledIcon, color: token("color.icon.information") },
	finished: { glyph: StatusSuccessIcon, color: token("color.icon.success") },
	untracked: { glyph: PriorityTrivialIcon, color: token("color.icon.subtlest") },
} as const satisfies Record<BoardAgentFilterId, StateIcon>;

const SESSION_TYPE_ICONS = {
	cloud: { glyph: CloudIcon, color: token("color.icon.subtle") },
	local: { glyph: ScreenIcon, color: token("color.icon.subtle") },
} as const satisfies Record<BoardSessionTypeId, StateIcon>;

interface QuickViewActionSubmenuProps<TId extends string> {
	label: string;
	options: readonly QuickViewOption<TId>[];
	icons?: StateIcons;
	onSelect: (id: TId) => void;
}

function QuickViewActionSubmenu<TId extends string>({
	label,
	options,
	icons,
	onSelect,
}: Readonly<QuickViewActionSubmenuProps<TId>>) {
	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{options.map((option) => {
					const stateIcon = icons?.[option.id];
					return (
						<DropdownMenuItem
							className={stateIcon ? "gap-2 [&>span:first-child]:size-3" : undefined}
							elemBefore={stateIcon ? <MenuLeadingIcon icon={stateIcon} /> : undefined}
							key={option.id}
							onSelect={() => onSelect(option.id)}
						>
							{option.label}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

export function BoardViewMenu({
	compact = false,
	surfaceLabel = "board",
	agentFilterId: controlledAgentFilterId,
	onAgentFilterIdChange,
}: Readonly<BoardViewMenuProps>) {
	const [pullRequestFilterId, setPullRequestFilterId] = useState<BoardPrStateId | null>(null);
	const [sessionTypeFilterId, setSessionTypeFilterId] = useState<BoardSessionTypeId | null>(null);
	const [uncontrolledAgentFilterId, setUncontrolledAgentFilterId] = useState<BoardAgentFilterId | null>(null);
	const [groupByFilterId, setGroupByFilterId] = useState<BoardGroupOptionId | null>(null);
	const isAgentFilterControlled = onAgentFilterIdChange !== undefined;
	const agentFilterId = isAgentFilterControlled
		? (controlledAgentFilterId ?? null)
		: uncontrolledAgentFilterId;
	const setAgentFilterId = (nextFilterId: BoardAgentFilterId | null) => {
		if (isAgentFilterControlled) {
			onAgentFilterIdChange(nextFilterId);
			return;
		}
		setUncontrolledAgentFilterId(nextFilterId);
	};
	const selectedQuickViewCount = [
		pullRequestFilterId,
		agentFilterId,
		sessionTypeFilterId,
		groupByFilterId,
	].filter((id) => id !== null).length;
	const hasQuickViewSelection = selectedQuickViewCount > 0;

	const handlePullRequestSelect = (id: BoardPrStateId) => {
		setPullRequestFilterId(id);
	};

	const handleSessionTypeSelect = (id: BoardSessionTypeId) => {
		setSessionTypeFilterId(id);
	};

	const handleAgentSelect = (id: string) => {
		if (id !== "untracked" && !isBoardAgentSessionStateId(id)) {
			return;
		}
		setAgentFilterId(id);
	};

	const handleGroupBySelect = (id: BoardGroupOptionId) => {
		setGroupByFilterId(id);
	};

	const clearQuickViewSelection = () => {
		setPullRequestFilterId(null);
		setAgentFilterId(null);
		setSessionTypeFilterId(null);
		setGroupByFilterId(null);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`Configure ${surfaceLabel} view`}
						aria-pressed={hasQuickViewSelection}
						size={compact ? "icon" : undefined}
						variant="outline"
					/>
				}
			>
				<Icon render={<GroupIcon label="" />} />
				{compact ? null : "View"}
				{hasQuickViewSelection && !compact ? (
					<Badge variant="information">{selectedQuickViewCount}</Badge>
				) : null}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-56">
				<QuickViewActionSubmenu
					icons={PR_STATE_ICONS}
					label="Pull request"
					onSelect={handlePullRequestSelect}
					options={BOARD_PR_STATE_OPTIONS}
				/>

				<QuickViewActionSubmenu
					icons={AGENT_STATE_ICONS}
					label="Agents"
					onSelect={handleAgentSelect}
					options={BOARD_AGENT_STATE_OPTIONS}
				/>

				<QuickViewActionSubmenu
					icons={SESSION_TYPE_ICONS}
					label="Session type"
					onSelect={handleSessionTypeSelect}
					options={BOARD_SESSION_TYPE_OPTIONS}
				/>

				<QuickViewActionSubmenu
					label="Group by"
					onSelect={handleGroupBySelect}
					options={BOARD_GROUP_OPTIONS}
				/>

				{hasQuickViewSelection ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={clearQuickViewSelection}>Clear selection</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

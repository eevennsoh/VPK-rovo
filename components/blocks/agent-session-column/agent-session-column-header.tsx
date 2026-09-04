"use client";

import type { ComponentType, ReactElement } from "react";

import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import AddIcon from "@atlaskit/icon/core/add";
import ArchiveBoxIcon from "@atlaskit/icon/core/archive-box";
import CrossIcon from "@atlaskit/icon/core/cross";
import LinkIcon from "@atlaskit/icon/core/link";
import ShrinkHorizontalIcon from "@atlaskit/icon/core/shrink-horizontal";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
	PanelAction,
	PanelActionGroup,
	PanelHeader,
	PanelTitle,
} from "@/components/ui/panel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { SelectionActionId, SelectionActionModel, UntrackedHeaderModel } from "./untracked-selection";

const HEADER_ACTIONS_REVEAL = cn(
	"ms-auto flex shrink-0 items-center",
	"opacity-0 transition-opacity duration-normal ease-out-practical",
	"group-hover/session-column:opacity-100 group-has-[:focus-visible]/session-column:opacity-100",
	"motion-reduce:transition-none",
	"has-[[data-popup-open]]:opacity-100",
);

const HEADER_ACTION_ICON: Record<SelectionActionId, ComponentType<NewCoreIconProps>> = {
	approve: LinkIcon,
	archive: ArchiveBoxIcon,
	clear: CrossIcon,
	create: AddIcon,
};

function headerActionUnavailableReason(action: SelectionActionModel): string | undefined {
	if (action.eligibleCount > 0) {
		return undefined;
	}

	switch (action.id) {
		case "approve":
			return "No selected sessions have a work item to link";
		case "archive":
			return undefined;
		case "clear":
			return undefined;
		case "create":
			return "No selected sessions can create a work item";
		default: {
			const exhaustive: never = action.id;
			return exhaustive;
		}
	}
}

function HeaderIconButton({
	action,
	onAction,
}: Readonly<{
	action: SelectionActionModel;
	onAction: (id: SelectionActionId) => void;
}>): ReactElement {
	const IconComponent = HEADER_ACTION_ICON[action.id];
	const unavailableReason = headerActionUnavailableReason(action);
	const disabled = action.eligibleCount === 0;
	const label = unavailableReason ?? action.label;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							aria-label={label}
							disabled={disabled}
							onClick={() => {
								onAction(action.id);
							}}
							size="icon-compact"
							type="button"
							variant="ghost"
						/>
					}
				>
					<Icon className="text-icon-subtle" render={<IconComponent label="" />} />
				</TooltipTrigger>
				<TooltipContent>{label}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

function CollapseButton({
	label,
	onCollapse,
}: Readonly<{
	label: string;
	onCollapse: () => void;
}>): ReactElement {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							aria-label={label}
							onClick={onCollapse}
							size="icon-compact"
							type="button"
							variant="ghost"
						/>
					}
				>
					<Icon className="text-icon-subtle" render={<ShrinkHorizontalIcon label="" />} />
				</TooltipTrigger>
				<TooltipContent>Collapse</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function AgentSessionColumnHeader({
	collapseLabel,
	model,
	onAction,
	onCollapse,
	overflow,
	surface,
}: Readonly<{
	collapseLabel: string;
	model: UntrackedHeaderModel;
	onAction: (id: SelectionActionId) => void;
	onCollapse: () => void;
	overflow: ReactElement;
	surface: "column" | "panel";
}>): ReactElement {
	switch (surface) {
		case "column":
			return (
				<div
					className="flex min-w-0 items-center gap-1.5"
					style={{ paddingBottom: token("space.100") }}
				>
					{renderColumnChrome({
						collapseLabel,
						model,
						onAction,
						onCollapse,
						overflow,
					})}
				</div>
			);
		case "panel":
			return renderPanelChrome({
				collapseLabel,
				model,
				onAction,
				onCollapse,
				overflow,
			});
		default: {
			const exhaustive: never = surface;
			return exhaustive;
		}
	}
}

function renderColumnChrome({
	collapseLabel,
	model,
	onAction,
	onCollapse,
	overflow,
}: Readonly<{
	collapseLabel: string;
	model: UntrackedHeaderModel;
	onAction: (id: SelectionActionId) => void;
	onCollapse: () => void;
	overflow: ReactElement;
}>): ReactElement {
	switch (model.kind) {
		case "browsing":
			return (
				<>
					<span className="truncate text-xs font-medium leading-4 text-text-subtle">
						{model.title}
					</span>
					<span className="shrink-0 text-xs font-normal text-text-subtlest">
						{model.count}
					</span>
					<div className={HEADER_ACTIONS_REVEAL}>
						{overflow}
						<CollapseButton label={collapseLabel} onCollapse={onCollapse} />
					</div>
				</>
			);
		case "selecting":
			return (
				<>
					<span className="truncate text-xs font-medium leading-4 text-text-subtle">
						Selected
					</span>
					<span className="shrink-0 text-xs font-normal text-text-subtlest">
						{model.count}
					</span>
					<div className="ms-auto flex shrink-0 items-center">
						{model.actions.map((action: SelectionActionModel) => (
							<HeaderIconButton
								action={action}
								key={action.id}
								onAction={onAction}
							/>
						))}
					</div>
				</>
			);
		default: {
			const exhaustive: never = model;
			return exhaustive;
		}
	}
}

function renderPanelChrome({
	collapseLabel,
	model,
	onAction,
	onCollapse,
	overflow,
}: Readonly<{
	collapseLabel: string;
	model: UntrackedHeaderModel;
	onAction: (id: SelectionActionId) => void;
	onCollapse: () => void;
	overflow: ReactElement;
}>): ReactElement {
	switch (model.kind) {
		case "browsing":
			return (
				<PanelHeader>
					<PanelTitle>
						{model.title}
						{" "}
						<span className="ms-1.5 shrink-0 font-normal text-text-subtlest">
							{model.count}
						</span>
					</PanelTitle>
					<PanelActionGroup>
						{overflow}
						<PanelAction
							icon={ShrinkHorizontalIcon}
							label={collapseLabel}
							onClick={onCollapse}
						/>
					</PanelActionGroup>
				</PanelHeader>
			);
		case "selecting":
			return (
				<PanelHeader>
					<PanelTitle>
						Selected
						{" "}
						<span className="ms-1.5 shrink-0 font-normal text-text-subtlest">
							{model.count}
						</span>
					</PanelTitle>
					<PanelActionGroup>
						{model.actions.map((action: SelectionActionModel) => {
							const unavailableReason = headerActionUnavailableReason(action);
							const IconComponent = HEADER_ACTION_ICON[action.id];
							return (
								<PanelAction
									disabled={action.eligibleCount === 0}
									icon={IconComponent}
									key={action.id}
									label={unavailableReason ?? action.label}
									onClick={() => {
										onAction(action.id);
									}}
								/>
							);
						})}
					</PanelActionGroup>
				</PanelHeader>
			);
		default: {
			const exhaustive: never = model;
			return exhaustive;
		}
	}
}

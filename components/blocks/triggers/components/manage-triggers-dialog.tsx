"use client";

import { useMemo } from "react";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AutomationIcon from "@atlaskit/icon/core/automation";
import CrossIcon from "@atlaskit/icon/core/cross";
import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";

import {
	TriggerPicker,
	renderAgentTriggerProviderIcon,
} from "@/components/blocks/triggers/page";
import {
	getAgentTriggerReadableLabel,
	getTriggerEvent,
	getTriggerProvider,
	isAgentTriggerEnabled,
	type AgentTriggerProviderId,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/data/trigger-catalog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { IconTile } from "@/components/ui/icon-tile";
import { Switch } from "@/components/ui/switch";
import { DeleteIcon, GripVerticalIcon } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";

interface ManageTriggersDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	triggers: ReadonlyArray<AgentTriggerValue>;
	/** Picking a provider event from the header "Add trigger event" menu. */
	onAddTrigger: (providerId: AgentTriggerProviderId, eventId: string) => void;
	onReorderTriggers: (activeId: string, overId: string) => void;
	onToggleTrigger: (id: string, enabled: boolean) => void;
	onDeleteTrigger: (id: string) => void;
	/** Row click opens the full automation editor for this trigger set. */
	onEditTrigger: (trigger: AgentTriggerValue) => void;
}

/**
 * Compact list-management modal for an automation's trigger events. The prompt,
 * name, and automation-level Active state live in the shared automation editor;
 * this dialog only manages the event rows that can start that same automation.
 */
export function ManageTriggersDialog({
	open,
	onOpenChange,
	triggers,
	onAddTrigger,
	onReorderTriggers,
	onToggleTrigger,
	onDeleteTrigger,
	onEditTrigger,
}: Readonly<ManageTriggersDialogProps>) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);
	const itemIds = useMemo(() => triggers.map((trigger) => trigger.id), [triggers]);

	function handleDragEnd(event: DragEndEvent): void {
		const { active, over } = event;
		if (!over || active.id === over.id) {
			return;
		}

		onReorderTriggers(String(active.id), String(over.id));
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="gap-0 overflow-hidden p-0" showCloseButton={false} size="md">
				<div className="flex items-start justify-between gap-3 p-6">
					<div className="grid gap-1">
						<DialogTitle className="text-xl font-semibold leading-6 text-text">
							Manage trigger events
						</DialogTitle>
						<p className="text-sm leading-5 text-text-subtle">
							Any event in this list can start the same automation.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<TriggerPicker
							label="Add trigger event"
							onSelectEvent={onAddTrigger}
							trigger={
								<Button type="button" variant="outline">
									Add trigger
								</Button>
							}
						/>
						<DialogClose render={<Button aria-label="Close" size="icon" variant="ghost" />}>
							<CrossIcon label="" />
						</DialogClose>
					</div>
				</div>

				<div className="px-6 pb-6">
					<DndContext
						id="manage-triggers-dnd"
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						onDragEnd={handleDragEnd}
						sensors={sensors}
					>
						<SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
							<div className="flex flex-col gap-2">
								{triggers.length > 0 ? (
									triggers.map((trigger, index) => (
										<ManageTriggersRow
											index={index}
											key={trigger.id}
											onDelete={onDeleteTrigger}
											onEdit={onEditTrigger}
											onToggle={onToggleTrigger}
											trigger={trigger}
										/>
									))
								) : (
									<div className="rounded-lg border border-dashed border-border bg-surface p-4 text-center text-sm text-text-subtlest">
										No trigger events yet.
									</div>
								)}
							</div>
						</SortableContext>
					</DndContext>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function getManageTriggerConnectionLabel(trigger: AgentTriggerValue): string | null {
	switch (trigger.connectionState) {
		case "needs-connection":
			return "Requires connection";
		case "connecting":
			return "Connecting";
		case "connection-error":
			return "Connection failed";
		case "connected":
		default:
			return null;
	}
}

function getManageTriggerSecondary(trigger: AgentTriggerValue): string {
	const provider = getTriggerProvider(trigger.providerId);
	const event = provider ? getTriggerEvent(provider.id, trigger.eventId) : undefined;
	const connectionLabel = getManageTriggerConnectionLabel(trigger);

	if (provider && connectionLabel) {
		return `${provider.label} · ${connectionLabel}`;
	}

	if (provider) {
		return provider.label;
	}

	return event?.description ?? "Trigger event";
}

function ManageTriggerFlowVisual({ trigger }: Readonly<{ trigger: AgentTriggerValue }>) {
	const provider = getTriggerProvider(trigger.providerId);
	const providerIcon = renderAgentTriggerProviderIcon(trigger) ?? (
		<AutomationIcon label="" size="small" />
	);

	return (
		<span className="flex shrink-0 items-center gap-1.5" aria-hidden={true}>
			<IconTile
				className="border border-border bg-bg-input text-icon-subtle"
				icon={providerIcon}
				label={provider?.label ?? "Trigger"}
				size="small"
				variant="transparent"
			/>
			<span className="h-px w-5 bg-border" />
			<IconTile
				className="bg-bg-neutral text-icon-subtle"
				icon={<GenerativeIndicatorIcon label="" size="small" />}
				label="Agent instructions"
				size="small"
				variant="transparent"
			/>
		</span>
	);
}

function ManageTriggersRow({
	index,
	onDelete,
	onEdit,
	onToggle,
	trigger,
}: Readonly<{
	index: number;
	onDelete: (id: string) => void;
	onEdit: (trigger: AgentTriggerValue) => void;
	onToggle: (id: string, enabled: boolean) => void;
	trigger: AgentTriggerValue;
}>) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: trigger.id });
	const label = getAgentTriggerReadableLabel(trigger);
	const enabled = isAgentTriggerEnabled(trigger);
	const secondary = getManageTriggerSecondary(trigger);
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			className={cn(
				"flex w-full items-center gap-2 rounded-lg border border-border bg-surface p-2 transition-[box-shadow,opacity] duration-normal",
				!enabled && "opacity-60",
				isDragging && "z-10 opacity-80 shadow-lg",
			)}
			ref={setNodeRef}
			style={style}
		>
			<button
				aria-label={`Reorder trigger ${index + 1}`}
				className="flex cursor-grab touch-none items-center rounded-md p-1 text-icon-subtlest transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered hover:text-icon-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected active:cursor-grabbing"
				ref={setActivatorNodeRef}
				type="button"
				{...attributes}
				{...listeners}
			>
				<GripVerticalIcon size="small" />
			</button>
			<button
				className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-border-selected"
				onClick={() => onEdit(trigger)}
				type="button"
			>
				<ManageTriggerFlowVisual trigger={trigger} />
				<div className="min-w-0">
					<div className="truncate text-sm font-medium leading-5 text-text">
						{label}
					</div>
					<div className="truncate text-xs leading-4 text-text-subtle">
						{secondary}
					</div>
				</div>
			</button>
			<Switch
				checked={enabled}
				label={`${enabled ? "Disable" : "Enable"} ${label}`}
				onCheckedChange={(nextEnabled) => onToggle(trigger.id, nextEnabled)}
				size="sm"
			/>
			<button
				aria-label={`Delete ${label}`}
				className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-subtlest transition-colors duration-normal hover:bg-bg-danger-hovered hover:text-text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected"
				onClick={() => onDelete(trigger.id)}
				type="button"
			>
				<DeleteIcon size="small" />
			</button>
		</div>
	);
}

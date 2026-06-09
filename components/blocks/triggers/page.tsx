"use client";

import { useCallback, useMemo, useState } from "react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import Image from "next/image";
import AddIcon from "@atlaskit/icon/core/add";
import AutomationIcon from "@atlaskit/icon/core/automation";
import BranchIcon from "@atlaskit/icon/core/branch";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ClockIcon from "@atlaskit/icon/core/clock";
import DeleteIcon from "@atlaskit/icon/core/delete";
import IncidentIcon from "@atlaskit/icon/core/incident";
import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";
import WebhookIcon from "@atlaskit/icon-lab/core/webhook";
import SearchIcon from "@atlaskit/icon/core/search";
import CrossCircleIcon from "@atlaskit/icon/core/cross-circle";

import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { Input } from "@/components/ui/input";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AtlassianLogo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import {
	createAgentTriggerValue,
	DEFAULT_CONFIGURED_TRIGGER_VALUES,
	getAgentTriggerParamLabel,
	getAgentTriggerReadableLabel,
	getTriggerEvent,
	getTriggerProvider,
	serializeAgentTriggerLabels,
	TRIGGER_PROVIDERS,
	type AgentTriggerConnectionState,
	type AgentTriggerEventDefinition,
	type AgentTriggerParamDefinition,
	type AgentTriggerProviderDefinition,
	type AgentTriggerProviderIcon,
	type AgentTriggerProviderId,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/data/trigger-catalog";
import { cn } from "@/lib/utils";

export type {
	AgentTriggerConnectionState,
	AgentTriggerEventDefinition,
	AgentTriggerParamDefinition,
	AgentTriggerProviderDefinition,
	AgentTriggerProviderId,
	AgentTriggerValue,
};
export { serializeAgentTriggerLabels, TRIGGER_PROVIDERS };

function renderTriggerProviderIcon(
	icon: AgentTriggerProviderIcon,
	label: string,
): ReactElement {
	if (icon.kind === "image") {
		return (
			<Image
				src={icon.src}
				alt=""
				width={16}
				height={16}
				className="size-4 shrink-0"
			/>
		);
	}

	if (icon.kind === "atlassian-logo") {
		return <AtlassianLogo name={icon.name} size="xxsmall" label={label} themeAware />;
	}

	switch (icon.name) {
		case "branch":
			return <BranchIcon label="" size="small" />;
		case "clock":
			return <ClockIcon label="" size="small" />;
		case "incident":
			return <IncidentIcon label="" size="small" />;
		case "webhook":
			return <WebhookIcon label="" size="small" />;
		case "automation":
		default:
			return <AutomationIcon label="" size="small" />;
	}
}

/**
 * Provider icon element for a configured trigger value, identical to the icon
 * the picker and trigger rows render. Exported so summary chips elsewhere (e.g.
 * the agent config trigger row) can show the exact same provider logo instead
 * of a generic fallback. Returns `null` for an unknown provider id.
 */
export function renderAgentTriggerProviderIcon(trigger: AgentTriggerValue): ReactElement | null {
	const provider = getTriggerProvider(trigger.providerId);
	if (!provider) {
		return null;
	}
	return renderTriggerProviderIcon(provider.icon, provider.label);
}

function getInitialTriggers({
	defaultTriggers,
	hasTrigger,
}: Readonly<{
	defaultTriggers?: readonly AgentTriggerValue[];
	hasTrigger?: boolean;
}>): AgentTriggerValue[] {
	if (defaultTriggers) {
		return [...defaultTriggers];
	}

	return hasTrigger === true ? [...DEFAULT_CONFIGURED_TRIGGER_VALUES] : [];
}

function getConnectionLabel(state: AgentTriggerConnectionState | undefined): string | null {
	switch (state) {
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

function getConnectButtonLabel(state: AgentTriggerConnectionState | undefined): string {
	return state === "connection-error" ? "Retry" : "Connect";
}

function getGroupedEvents(events: readonly AgentTriggerEventDefinition[]) {
	const groups: Array<{
		groupLabel?: string;
		events: AgentTriggerEventDefinition[];
	}> = [];

	for (const event of events) {
		const previousGroup = groups[groups.length - 1];
		if (!previousGroup || previousGroup.groupLabel !== event.groupLabel) {
			groups.push({ groupLabel: event.groupLabel, events: [event] });
			continue;
		}

		previousGroup.events.push(event);
	}

	return groups;
}

interface TriggerAddRowProps extends ComponentProps<"button"> {
	label: string;
}

function TriggerAddRow({
	className,
	label,
	...props
}: Readonly<TriggerAddRowProps>): ReactElement {
	return (
		<button
			type="button"
			className={cn(
				"grid h-8 w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-3 rounded-lg px-2 text-left text-sm text-text-subtle transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered focus-visible:bg-bg-neutral-subtle-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
			{...props}
		>
			<span className="flex size-6 shrink-0 items-center justify-center justify-self-center text-icon-subtle">
				<AddIcon label="" size="small" />
			</span>
			<span className="text-sm font-medium">{label}</span>
		</button>
	);
}

/**
 * The editor-palette "search" variant provider list: a sticky search input over
 * the filtered provider→event submenus. Shared by the root `TriggerPicker` and
 * the agent compact nav's "Add trigger ›" flyout so both render an identical
 * searchable provider list.
 */
export function TriggerProviderSearchList({
	onSelectEvent,
	searchId,
}: Readonly<{
	onSelectEvent: (providerId: AgentTriggerProviderId, eventId: string) => void;
	searchId?: string;
}>): ReactElement {
	const [query, setQuery] = useState("");
	const normalizedQuery = query.trim().toLowerCase();
	const filteredProviders = useMemo(
		() =>
			TRIGGER_PROVIDERS.map((provider) => {
				const providerMatches =
					normalizedQuery.length === 0 ||
					provider.label.toLowerCase().includes(normalizedQuery) ||
					provider.description.toLowerCase().includes(normalizedQuery);
				const matchingEvents = provider.events.filter((event) =>
					normalizedQuery.length === 0 ||
					event.label.toLowerCase().includes(normalizedQuery) ||
					event.description.toLowerCase().includes(normalizedQuery),
				);

				return providerMatches
					? { ...provider, events: matchingEvents.length > 0 ? matchingEvents : provider.events }
					: { ...provider, events: matchingEvents };
			}).filter((provider) => provider.events.length > 0),
		[normalizedQuery],
	);

	return (
		<div
			className="rich-text-command-menu rich-text-command-menu-borderless"
			data-first-item-input="true"
			role="presentation"
		>
			<div className="rich-text-command-menu-item rich-text-command-menu-input rich-text-command-menu-item-sticky">
				<span
					className="rich-text-command-menu-input-logo text-icon-subtle"
					aria-hidden={true}
				>
					<SearchIcon label="" size="small" />
				</span>
				<Input
					id={searchId}
					variant="subtle"
					isCompact
					value={query}
					aria-label="Search triggers"
					placeholder="Search Triggers..."
					onChange={(event) => setQuery(event.currentTarget.value)}
					onKeyDown={(event) => event.stopPropagation()}
				/>
				{query ? (
					<Button
						type="button"
						aria-label="Clear search"
						className="rich-text-command-menu-input-clear text-icon-subtle"
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => setQuery("")}
						shape="circle"
						size="icon-compact"
						variant="ghost"
					>
						<CrossCircleIcon label="" size="small" />
					</Button>
				) : null}
			</div>
			<div className="rich-text-command-menu-list">
				{filteredProviders.length > 0 ? (
					<DropdownMenuGroup className="p-0">
						{filteredProviders.map((provider) => (
							<TriggerProviderSubmenu
								key={provider.id}
								onSelectEvent={onSelectEvent}
								provider={provider}
							/>
						))}
					</DropdownMenuGroup>
				) : (
					<div className="rich-text-command-menu-empty">
						No triggers found
					</div>
				)}
			</div>
		</div>
	);
}

export function TriggerPicker({
	defaultOpen,
	label,
	onSelectEvent,
	trigger,
}: Readonly<{
	defaultOpen?: boolean;
	label: string;
	onSelectEvent: (providerId: AgentTriggerProviderId, eventId: string) => void;
	/**
	 * Custom element rendered as the dropdown trigger. Defaults to the standard
	 * `TriggerAddRow`. Lets callers anchor the provider/event picker to their own
	 * affordance (e.g. an agent config summary row) while reusing the menu.
	 */
	trigger?: ReactElement;
}>): ReactElement {
	const [open, setOpen] = useState(defaultOpen ?? false);

	const handleSelectEvent = useCallback(
		(providerId: AgentTriggerProviderId, eventId: string) => {
			onSelectEvent(providerId, eventId);
			setOpen(false);
		},
		[onSelectEvent],
	);

	const handleOpenChange = useCallback(
		(nextOpen: boolean, eventDetails: { reason?: string }) => {
			// Hovering a provider submenu trigger opens that submenu, which Base UI
			// reports against the controlled root as a `sibling-open` close —
			// collapsing the whole picker before the user can reach a submenu item.
			// Blurring the in-menu search input similarly reports `focus-out`.
			// Ignore both so the picker stays open during normal pointer
			// interaction; all explicit closes (item press, escape, outside press,
			// trigger press) still pass through.
			if (
				!nextOpen &&
				(eventDetails.reason === "sibling-open" ||
					eventDetails.reason === "focus-out")
			) {
				return;
			}
			setOpen(nextOpen);
		},
		[],
	);

	return (
		<DropdownMenu open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger render={trigger ?? <TriggerAddRow label={label} />} />
			<DropdownMenuContent
				align="start"
				className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden p-0"
				sideOffset={6}
			>
				<TriggerProviderSearchList
					onSelectEvent={handleSelectEvent}
					searchId="trigger-picker-search"
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function TriggerProviderSubmenu({
	onSelectEvent,
	provider,
}: Readonly<{
	onSelectEvent: (providerId: AgentTriggerProviderId, eventId: string) => void;
	provider: AgentTriggerProviderDefinition;
}>): ReactElement {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const normalizedQuery = query.trim().toLowerCase();

	// Filter this provider's events by the nested search, preserving group
	// structure and dropping empty groups.
	const filteredGroups = useMemo(() => {
		const filteredEvents =
			normalizedQuery.length === 0
				? provider.events
				: provider.events.filter(
						(event) =>
							event.label.toLowerCase().includes(normalizedQuery) ||
							event.description.toLowerCase().includes(normalizedQuery),
					);
		return getGroupedEvents(filteredEvents);
	}, [normalizedQuery, provider.events]);

	const handleOpenChange = useCallback(
		(nextOpen: boolean, eventDetails: { reason?: string }) => {
			// Typing in the nested search input blurs the submenu trigger, which
			// Base UI reports as `focus-out` against the controlled submenu — that
			// would collapse it mid-search. Ignore it; explicit closes (item press,
			// escape, pointer leave, trigger toggle) still pass through.
			if (!nextOpen && eventDetails.reason === "focus-out") {
				return;
			}
			setOpen(nextOpen);
			if (!nextOpen) {
				setQuery("");
			}
		},
		[],
	);

	return (
		<DropdownMenuSub open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuSubTrigger>
				<span className="flex min-w-0 flex-1 items-center gap-3">
					<span className="flex size-5 shrink-0 items-center justify-center text-icon-subtle">
						{renderTriggerProviderIcon(provider.icon, provider.label)}
					</span>
					<span className="min-w-0 truncate">{provider.label}</span>
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="min-w-64 overflow-hidden p-0">
				<div
					className="rich-text-command-menu rich-text-command-menu-borderless"
					data-first-item-input="true"
					role="presentation"
				>
					<div className="rich-text-command-menu-item rich-text-command-menu-input rich-text-command-menu-item-sticky">
						<span
							className="rich-text-command-menu-input-logo text-icon-subtle"
							aria-hidden={true}
						>
							<SearchIcon label="" size="small" />
						</span>
						<Input
							variant="subtle"
							isCompact
							value={query}
							aria-label={`Search ${provider.label} events`}
							placeholder={`Search ${provider.label}...`}
							onChange={(event) => setQuery(event.currentTarget.value)}
							onKeyDown={(event) => event.stopPropagation()}
						/>
						{query ? (
							<Button
								type="button"
								aria-label="Clear search"
								className="rich-text-command-menu-input-clear text-icon-subtle"
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => setQuery("")}
								shape="circle"
								size="icon-compact"
								variant="ghost"
							>
								<CrossCircleIcon label="" size="small" />
							</Button>
						) : null}
					</div>
					<div className="rich-text-command-menu-list">
						{filteredGroups.length > 0 ? (
							filteredGroups.map((group, groupIndex) => (
								<DropdownMenuGroup
									className="p-0"
									key={`${provider.id}-${group.groupLabel ?? "default"}-${groupIndex}`}
								>
									{group.groupLabel ? (
										<DropdownMenuLabel>{group.groupLabel}</DropdownMenuLabel>
									) : null}
									{group.events.map((event) => (
										<DropdownMenuItem
											key={event.id}
											description={event.description}
											onSelect={() => onSelectEvent(provider.id, event.id)}
										>
											{event.label}
										</DropdownMenuItem>
									))}
									{groupIndex < filteredGroups.length - 1 ? (
										<DropdownMenuSeparator />
									) : null}
								</DropdownMenuGroup>
							))
						) : (
							<div className="rich-text-command-menu-empty">
								No events found
							</div>
						)}
					</div>
				</div>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}

function TriggerParamMenu({
	disabled,
	onValueChange,
	param,
	value,
}: Readonly<{
	disabled?: boolean;
	onValueChange: (value: string) => void;
	param: AgentTriggerParamDefinition;
	value: string | undefined;
}>): ReactElement {
	const label = getAgentTriggerParamLabel(param, value);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={(
					<Button
						type="button"
						size="compact"
						variant="secondary"
						disabled={disabled}
						aria-label={`${param.label}: ${label}`}
						className="h-6 max-w-52 gap-0 rounded-md bg-bg-neutral py-0 pr-0 pl-2 text-sm font-medium text-text-subtle hover:bg-bg-neutral-hovered disabled:opacity-(--opacity-disabled)"
					/>
				)}
			>
				<span className="min-w-0 truncate">{label}</span>
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-56">
				<DropdownMenuLabel>{param.label}</DropdownMenuLabel>
				<DropdownMenuGroup>
					{param.options.map((option) => (
						<DropdownMenuItem
							key={option.value}
							description={option.description}
							onSelect={() => onValueChange(option.value)}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
				{param.id === "repository" ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								elemBefore={<AddIcon label="" size="small" />}
								onSelect={() => undefined}
							>
								Add repositories
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => undefined}>
								Refresh repositories
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function TriggerSentence({
	disabled,
	event,
	onParamChange,
	trigger,
}: Readonly<{
	disabled?: boolean;
	event: AgentTriggerEventDefinition;
	onParamChange: (paramId: string, value: string) => void;
	trigger: AgentTriggerValue;
}>): ReactElement {
	if (!event.params || event.params.length === 0) {
		return <span className="font-medium text-text">{event.label}</span>;
	}

	return (
		<span className="flex min-w-0 flex-wrap items-center gap-1.5 text-text">
			<span className="font-medium">{event.label}</span>
			{event.params.map((param) => (
				<span className="inline-flex min-w-0 items-center gap-1.5" key={param.id}>
					<span>{param.connector}</span>
					<TriggerParamMenu
						disabled={disabled}
						onValueChange={(value) => onParamChange(param.id, value)}
						param={param}
						value={trigger.params?.[param.id]}
					/>
				</span>
			))}
		</span>
	);
}

function TriggerRow({
	onConnect,
	onParamChange,
	onRemove,
	trigger,
}: Readonly<{
	onConnect?: (trigger: AgentTriggerValue) => void;
	onParamChange: (paramId: string, value: string) => void;
	onRemove: () => void;
	trigger: AgentTriggerValue;
}>): ReactElement {
	const provider = getTriggerProvider(trigger.providerId);
	const event = provider ? getTriggerEvent(provider.id, trigger.eventId) : undefined;
	const connectionLabel = getConnectionLabel(trigger.connectionState);
	const needsConnection = Boolean(connectionLabel);
	const paramsDisabled = trigger.connectionState !== undefined && trigger.connectionState !== "connected";

	if (!provider || !event) {
		return (
			<div className="group/trigger-row grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 rounded-lg px-2 py-2 transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered focus-within:bg-bg-neutral-subtle-hovered">
				<div className="flex flex-col items-center" aria-hidden={true}>
					<IconTile
						aria-hidden={true}
						icon={<AutomationIcon label="" size="small" />}
						label="Automation"
						size="small"
						variant="blue"
					/>
				</div>
				<div className="flex min-h-6 min-w-0 items-start gap-2">
					<div className="min-w-0 flex-1 text-sm text-text">{trigger.label ?? "Unknown trigger"}</div>
					<Button
						aria-label="Delete trigger"
						className="self-start opacity-0 transition-opacity duration-normal group-hover/trigger-row:opacity-100 group-focus-within/trigger-row:opacity-100 focus-visible:opacity-100"
						onClick={onRemove}
						size="icon"
						type="button"
						variant="ghost"
					>
						<DeleteIcon label="" size="small" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="group/trigger-row grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 rounded-lg px-2 py-2 transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered focus-within:bg-bg-neutral-subtle-hovered">
			<div className="flex flex-col items-center" aria-hidden={true}>
				<IconTile
					aria-hidden={true}
					icon={renderTriggerProviderIcon(provider.icon, provider.label)}
					label={provider.label}
					size="small"
					variant="blue"
				/>
				<div className="my-2 h-7 w-px bg-border" />
				<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-bg-neutral text-icon-subtle">
					<GenerativeIndicatorIcon label="" size="small" />
				</span>
			</div>
			<div className="grid min-w-0 gap-4">
				<div className="flex min-h-6 items-start gap-2">
					<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm text-text">
						<TriggerSentence
							disabled={paramsDisabled}
							event={event}
							onParamChange={onParamChange}
							trigger={trigger}
						/>
					</div>
					<Button
						aria-label="Delete trigger"
						className="self-start opacity-0 transition-opacity duration-normal group-hover/trigger-row:opacity-100 group-focus-within/trigger-row:opacity-100 focus-visible:opacity-100"
						onClick={onRemove}
						size="icon"
						type="button"
						variant="ghost"
					>
						<DeleteIcon label="" size="small" />
					</Button>
				</div>
				<div className="flex min-w-0 flex-wrap items-center gap-2 text-sm leading-5 text-text-subtle">
					<span className="min-w-0 flex-1">{event.description}</span>
					{connectionLabel ? (
						<span
							className={cn(
								"font-medium",
								trigger.connectionState === "connection-error"
									? "text-text-danger"
									: "text-text-warning",
							)}
						>
							{connectionLabel}
						</span>
					) : null}
					{needsConnection ? (
						<Button
							type="button"
							variant="outline"
							size="compact"
							isLoading={trigger.connectionState === "connecting"}
							onClick={() => onConnect?.(trigger)}
						>
							{getConnectButtonLabel(trigger.connectionState)}
						</Button>
					) : null}
				</div>
			</div>
		</div>
	);
}

export interface TriggersProps {
	/** Controlled trigger definitions. */
	triggers?: readonly AgentTriggerValue[];
	/** Initial trigger definitions for uncontrolled usage. */
	defaultTriggers?: readonly AgentTriggerValue[];
	/** Opens the picker on first render for demos and visual state coverage. */
	defaultPickerOpen?: boolean;
	/** Label for the add-trigger affordance. */
	addTriggerLabel?: string;
	/** Invoked whenever trigger definitions change. */
	onTriggersChange?: (triggers: readonly AgentTriggerValue[]) => void;
	/** Invoked when a connection CTA is pressed. */
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	/** Legacy compatibility: explicit true seeds configured demo triggers. */
	hasTrigger?: boolean;
	/** @deprecated Use typed trigger params instead. */
	statusLabel?: string;
	/** @deprecated Use typed trigger params instead. */
	boardLabel?: string;
	/** @deprecated Use provider icons instead. */
	boardAvatarSrc?: string;
	/** @deprecated Trigger prompts are handled by agent instructions. */
	prompt?: string;
	/** @deprecated Use onTriggersChange. */
	onClearTrigger?: () => void;
	className?: string;
}

/**
 * Triggers — an agent automation trigger editor. Renders an add-trigger picker,
 * configured trigger rows, compact parameter menus, remove controls, and
 * UI-only connection states. It models only what starts an agent; conditions,
 * actions, and branches are handled by later automation surfaces.
 */
export default function Triggers({
	addTriggerLabel = "Add Trigger",
	className,
	defaultPickerOpen,
	defaultTriggers,
	hasTrigger,
	onClearTrigger,
	onConnectTrigger,
	onTriggersChange,
	triggers,
}: Readonly<TriggersProps>): ReactElement {
	const isControlled = typeof triggers !== "undefined";
	const [uncontrolledTriggers, setUncontrolledTriggers] = useState<AgentTriggerValue[]>(() =>
		getInitialTriggers({ defaultTriggers, hasTrigger }),
	);
	const currentTriggers = triggers ?? uncontrolledTriggers;

	const commitTriggers = useCallback(
		(nextTriggers: readonly AgentTriggerValue[]) => {
			if (!isControlled) {
				setUncontrolledTriggers([...nextTriggers]);
			}
			onTriggersChange?.(nextTriggers);
		},
		[isControlled, onTriggersChange],
	);

	const handleSelectEvent = useCallback(
		(providerId: AgentTriggerProviderId, eventId: string) => {
			const nextTrigger = createAgentTriggerValue(providerId, eventId, currentTriggers.length + 1);

			if (!nextTrigger) {
				return;
			}

			commitTriggers([...currentTriggers, nextTrigger]);
		},
		[commitTriggers, currentTriggers],
	);

	const handleParamChange = useCallback(
		(triggerId: string, paramId: string, value: string) => {
			commitTriggers(
				currentTriggers.map((trigger) => {
					if (trigger.id !== triggerId) {
						return trigger;
					}

					const nextTrigger = {
						...trigger,
						params: {
							...(trigger.params ?? {}),
							[paramId]: value,
						},
					};

					return {
						...nextTrigger,
						label: getAgentTriggerReadableLabel(nextTrigger),
					};
				}),
			);
		},
		[commitTriggers, currentTriggers],
	);

	const handleRemove = useCallback(
		(triggerId: string) => {
			commitTriggers(currentTriggers.filter((trigger) => trigger.id !== triggerId));
			onClearTrigger?.();
		},
		[commitTriggers, currentTriggers, onClearTrigger],
	);

	const cardChildren: ReactNode =
		currentTriggers.length > 0 ? (
			<>
				<div className="grid gap-0">
					{currentTriggers.map((trigger) => (
						<TriggerRow
							key={trigger.id}
							onConnect={onConnectTrigger}
							onParamChange={(paramId, value) => handleParamChange(trigger.id, paramId, value)}
							onRemove={() => handleRemove(trigger.id)}
							trigger={trigger}
						/>
					))}
				</div>
				<Separator className="my-2" />
				<TriggerPicker
					defaultOpen={defaultPickerOpen}
					label={addTriggerLabel}
					onSelectEvent={handleSelectEvent}
				/>
			</>
		) : (
			<TriggerPicker
				defaultOpen={defaultPickerOpen}
				label={addTriggerLabel}
				onSelectEvent={handleSelectEvent}
			/>
		);

	return (
		<div className={cn("grid gap-5", className)}>
			<section className="grid gap-2">
				<div className="rounded-xl border border-border bg-surface p-2">
					{cardChildren}
				</div>
			</section>
		</div>
	);
}

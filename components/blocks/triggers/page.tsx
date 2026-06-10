"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { motion, type Variants } from "motion/react";
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
import { SearchIcon } from "@/components/ui/vpk-icons";

import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { RichTextCommandMenuSearchField } from "@/components/ui-custom/rich-text-editor";
import { RichTextMentionVisualMark } from "@/components/ui-custom/rich-text-editor/mention-visual";
import type { RichTextMentionVisual } from "@/components/ui-custom/rich-text-editor/types";
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
import { getTriggerByline } from "@/app/data/directory/trigger-bylines";
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

/**
 * Tile-filled provider icon for a configured trigger value, using the EXACT
 * editor-palette treatment (the 24px `.rich-text-command-menu-avatar` tile that
 * the logo fills) rather than the bare 16px glyph from
 * `renderAgentTriggerProviderIcon`. Use where a trigger row should mirror the
 * picker / editor-palette logo, e.g. the collapsed agent-config Triggers
 * dropdown rows. Returns `null` for an unknown provider id.
 */
export function renderAgentTriggerProviderTileIcon(trigger: AgentTriggerValue): ReactElement | null {
	const provider = getTriggerProvider(trigger.providerId);
	if (!provider) {
		return null;
	}
	return <TriggerProviderTileIcon icon={provider.icon} label={provider.label} />;
}

/**
 * Maps a trigger provider icon to the editor palette's `RichTextMentionVisual`
 * so picker rows get the EXACT same logo treatment as editor-palette menu rows:
 * 1p product logos render bare (they ship their own fill), 2p/3p brand images
 * are border-resolved via `resolveBrandLogoPresentation`, and stroked glyph
 * icons sit in a bordered tile.
 */
function getTriggerProviderVisual(icon: AgentTriggerProviderIcon): RichTextMentionVisual {
	if (icon.kind === "atlassian-logo") {
		return { kind: "logo", logoName: icon.name };
	}
	if (icon.kind === "image") {
		return { kind: "image", src: icon.src };
	}
	return { kind: "icon", icon: renderTriggerProviderIcon(icon, "") };
}

/**
 * Picker-row front slot, identical to the editor palette's
 * `RichTextSuggestionMenuItemVisual`: a 24px box (`.rich-text-command-menu-avatar`)
 * wrapping the shared `RichTextMentionVisualMark` at `size="menu"`, scaled to
 * fill the slot. Reuses the palette's logo/image/icon rules verbatim.
 */
function TriggerProviderTileIcon({
	icon,
	label,
}: Readonly<{ icon: AgentTriggerProviderIcon; label: string }>): ReactElement {
	return (
		<span className="rich-text-command-menu-avatar inline-flex shrink-0 items-center justify-center [&>*]:scale-75">
			<RichTextMentionVisualMark
				label={label}
				size="menu"
				visual={getTriggerProviderVisual(icon)}
			/>
		</span>
	);
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

	// Drive the list's top fade-mask exactly like the live suggestion menu: track
	// whether the scrollable list is scrolled away from the top (toggling
	// `data-list-scrolled`), and snap back to the top whenever the query changes
	// so a fresh result set always starts unscrolled.
	const listRef = useRef<HTMLDivElement | null>(null);
	const [hasScrolledList, setHasScrolledList] = useState(false);
	const updateListScrollState = useCallback(() => {
		const listElement = listRef.current;
		setHasScrolledList(Boolean(listElement && listElement.scrollTop > 0));
	}, []);

	useEffect(() => {
		const listElement = listRef.current;
		if (listElement) {
			listElement.scrollTop = 0;
		}
		updateListScrollState();
	}, [normalizedQuery, updateListScrollState]);

	return (
		<div
			className="rich-text-command-menu rich-text-command-menu-embedded"
			data-has-header="true"
			data-list-scrolled={hasScrolledList ? "true" : undefined}
			role="presentation"
		>
			<RichTextCommandMenuSearchField
				id={searchId}
				icon={<SearchIcon className="size-4 text-icon-subtle" />}
				label="Search triggers"
				onClear={() => setQuery("")}
				onKeyDown={(event) => event.stopPropagation()}
				onValueChange={setQuery}
				placeholder="Search Triggers..."
				value={query}
			/>
			<div
				className="rich-text-command-menu-list"
				ref={listRef}
				onScroll={updateListScrollState}
			>
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
				className="w-[min(24rem,calc(100vw-2rem))] p-0"
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

// Byline reveal motion. Mirrors `nestedCommandLabelVariants` /
// `nestedCommandDescriptionVariants` in the editor palette suggestion menu (and
// `greetingLabelVariants` / `greetingDescriptionVariants` in the chat greeting
// rows) so the provider-row byline reveal matches every other command-menu
// surface exactly: the label lifts up and the byline fades + slides in on
// hover/highlight without changing the row height.
const triggerProviderLabelVariants: Variants = {
	idle: {
		transform: "translateY(8px)",
		transition: { type: "spring", bounce: 0, visualDuration: 0.18 },
	},
	active: {
		transform: "translateY(0px)",
		transition: { type: "spring", bounce: 0.12, visualDuration: 0.24 },
	},
};

const triggerProviderBylineVariants: Variants = {
	idle: {
		opacity: 0,
		transform: "translateY(4px)",
		transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
	},
	active: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: { delay: 0.02, duration: 0.16, ease: [0, 0.4, 0, 1] },
	},
};

export function TriggerProviderSubmenu({
	onSelectEvent,
	provider,
}: Readonly<{
	onSelectEvent: (providerId: AgentTriggerProviderId, eventId: string) => void;
	provider: AgentTriggerProviderDefinition;
}>): ReactElement {
	const groups = getGroupedEvents(provider.events);
	const byline = getTriggerByline(provider.id);
	// Reveal the byline whenever the row is hovered/focused/keyboard-highlighted,
	// and keep it revealed while the events submenu is open (the pointer leaves
	// the trigger to enter the submenu, which would otherwise collapse it).
	const [isInteractionActive, setIsInteractionActive] = useState(false);
	const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
	const isActive = isInteractionActive || isSubmenuOpen;

	return (
		<DropdownMenuSub onOpenChange={setIsSubmenuOpen}>
			<DropdownMenuSubTrigger
				className="h-11"
				onMouseEnter={() => setIsInteractionActive(true)}
				onMouseLeave={() => setIsInteractionActive(false)}
				onFocus={() => setIsInteractionActive(true)}
				onBlur={() => setIsInteractionActive(false)}
			>
				<span className="flex min-w-0 flex-1 items-center gap-3">
					<TriggerProviderTileIcon icon={provider.icon} label={provider.label} />
					{byline ? (
						<span className="rich-text-command-menu-copy rich-text-command-menu-nested-copy rich-text-command-menu-nested-copy-revealable flex-1">
							<motion.span
								animate={isActive ? "active" : "idle"}
								className="menu-row-title"
								initial={false}
								style={{ willChange: "transform" }}
								variants={triggerProviderLabelVariants}
							>
								{provider.label}
							</motion.span>
							<motion.span
								animate={isActive ? "active" : "idle"}
								className="menu-row-byline"
								initial={false}
								style={{ willChange: "transform, opacity" }}
								variants={triggerProviderBylineVariants}
							>
								{byline}
							</motion.span>
						</span>
					) : (
						<span className="min-w-0 truncate">{provider.label}</span>
					)}
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="min-w-64 overflow-hidden p-0">
				<div className="rich-text-command-menu rich-text-command-menu-borderless">
					<div className="rich-text-command-menu-list">
						{groups.map((group, groupIndex) => (
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
								{groupIndex < groups.length - 1 ? (
									<DropdownMenuSeparator />
								) : null}
							</DropdownMenuGroup>
						))}
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

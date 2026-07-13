"use client";

import type { ReactElement } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ActivitySuggestionKind = "agent" | "skill";

export interface ActivitySuggestionItem {
	id: string;
	/** Text inserted after the trigger char when accepted (e.g. an agent name or skill slug). */
	value: string;
	label: string;
	description?: string;
	avatarSrc?: string;
	kind: ActivitySuggestionKind;
}

interface ActivitySuggestionMenuProps {
	items: readonly ActivitySuggestionItem[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (item: ActivitySuggestionItem) => void;
	activeIndex: number;
	onActiveIndexChange: (index: number) => void;
	/** The (visually hidden) element the menu anchors to — usually the composer container. */
	anchor: ReactElement;
}

function initialsOf(name: string): string {
	const initials = name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return initials || "?";
}

/**
 * Anchored, keyboard-navigable suggestion list for the Activity composer's local
 * `@agent` / `/skill` autocomplete. Focus deliberately stays in the composer — the
 * popup never steals it (`initialFocus`/`finalFocus` are `false`) and keyboard
 * navigation is driven by the composer's capture-phase handler; this list only
 * reflects the active index and handles pointer selection. Exit + reduced-motion
 * are inherited from `PopoverContent`.
 */
export function ActivitySuggestionMenu({
	items,
	open,
	onOpenChange,
	onSelect,
	activeIndex,
	onActiveIndexChange,
	anchor,
}: Readonly<ActivitySuggestionMenuProps>) {
	const isOpen = open && items.length > 0;

	return (
		<Popover open={isOpen} onOpenChange={onOpenChange}>
			{/* The trigger is only a positioning anchor (the composer container), not a
			    native button — tell Base UI so it keeps correct semantics and no warning. */}
			<PopoverTrigger nativeButton={false} render={anchor} />
			<PopoverContent
				side="top"
				align="start"
				sideOffset={8}
				initialFocus={false}
				finalFocus={false}
				positionerClassName="z-[502]"
				className="w-80 max-w-[calc(100vw-2rem)] p-1"
			>
				<div aria-label="Suggestions" className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
					{items.map((item, index) => {
						const isActive = index === activeIndex;
						return (
							<button
								key={item.id}
								type="button"
								data-active={isActive || undefined}
								// Keep the composer focused: prevent the mousedown from blurring the editor.
								onMouseDown={(event) => event.preventDefault()}
								onMouseEnter={() => onActiveIndexChange(index)}
								onClick={() => onSelect(item)}
								className={cn(
									"flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left outline-none transition-colors duration-normal ease-out-practical motion-reduce:transition-none",
									isActive ? "bg-bg-neutral-subtle-hovered" : "hover:bg-bg-neutral-subtle-hovered",
								)}
							>
								{item.kind === "agent" ? (
									<Avatar size="sm" shape="hexagon" className="shrink-0">
										{item.avatarSrc ? <AvatarImage src={item.avatarSrc} alt="" /> : null}
										<AvatarFallback>{initialsOf(item.label)}</AvatarFallback>
									</Avatar>
								) : (
									<span
										aria-hidden
										className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-bg-neutral font-mono text-sm text-text-subtle"
									>
										/
									</span>
								)}
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate text-sm font-medium text-text">{item.label}</span>
									{item.description ? (
										<span className="truncate text-xs text-text-subtlest">{item.description}</span>
									) : null}
								</span>
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}

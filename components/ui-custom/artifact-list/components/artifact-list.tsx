"use client";

import { type ReactNode } from "react";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import {
	HoverRevealActions,
	hoverRevealRowClassName,
} from "@/components/ui-custom/hover-reveal-row";
import { Button } from "@/components/ui/button";
import { Tile } from "@/components/ui/tile";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface ArtifactListItem {
	/** Stable identity for the row (used as the React key and `onOpen` payload). */
	id: string;
	/** Primary line, e.g. "Audience Engagement Report". */
	title: string;
	/** Metadata source label, e.g. "Confluence page". */
	source: string;
	/** Metadata owner label, e.g. "Vitafleet Team". */
	owner: string;
	/** ADS icon for the leading tile (e.g. `<PageIcon label="" />`). */
	icon?: ReactNode;
	/**
	 * Tile color appearance for the `icon` variant — any `Tile` variant, e.g.
	 * `"blueSubtle"`. Defaults to `"neutral"`. Ignored for `logoSrc`/`avatarSrc`
	 * rows, which always use the neutral tile.
	 */
	tileVariant?: React.ComponentProps<typeof Tile>["variant"];
	/**
	 * 2P/3P logo path (e.g. `/3p/google-drive/16.svg`) rendered 24px inset on the
	 * neutral tile. Takes precedence over `icon`.
	 */
	logoSrc?: string;
	/**
	 * Agent avatar image path (e.g. `/avatar-agent/teamwork-agents/teamwork-coach.svg`)
	 * rendered 20px inset on the neutral tile. Takes precedence over `logoSrc`/`icon`.
	 */
	avatarSrc?: string;
}

export interface ArtifactListProps extends React.ComponentProps<"div"> {
	items: readonly ArtifactListItem[];
	/** Fired when a row's hover/focus-revealed "Open" button is activated. */
	onOpen?: (item: ArtifactListItem) => void;
	/** Open-button label. Defaults to "Open". */
	openLabel?: string;
	/** Also fire `onOpen` when the row body is clicked. */
	openOnRowClick?: boolean;
}

function ArtifactListTileContent({ item }: Readonly<{ item: ArtifactListItem }>) {
	if (item.avatarSrc) {
		return <AgentAvatarVisual avatarSrc={item.avatarSrc} sizePx={20} className="object-contain" />;
	}
	if (item.logoSrc) {
		// eslint-disable-next-line @next/next/no-img-element -- Tile child-sizing CSS targets [&_img]; mirrors logo-mark.tsx
		return <img alt="" aria-hidden className="object-contain" src={item.logoSrc} />;
	}
	return item.icon;
}

function ArtifactListLeadingTile({ item }: Readonly<{ item: ArtifactListItem }>) {
	// Logo + agent-avatar rows stay neutral; logos render 24px inset and agent
	// avatars 20px, while plain icon rows can opt into a color appearance and keep
	// the tile's default 16px inset.
	const usesInsetImage = Boolean(item.avatarSrc || item.logoSrc);
	return (
		<Tile
			aria-hidden
			label={item.source}
			variant={usesInsetImage ? "neutral" : item.tileVariant ?? "neutral"}
			size="medium"
			className={cn(
				"rounded-tile",
				item.logoSrc && "[&_img]:size-6!",
				item.avatarSrc && "[&_img]:size-5!",
			)}
		>
			<ArtifactListTileContent item={item} />
		</Tile>
	);
}

function ArtifactListRow({
	item,
	isLast,
	openLabel,
	openOnRowClick,
	onOpen,
}: Readonly<{
	item: ArtifactListItem;
	isLast: boolean;
	openLabel: string;
	openOnRowClick?: boolean;
	onOpen?: (item: ArtifactListItem) => void;
}>) {
	const handleOpen = () => onOpen?.(item);

	return (
		<div
			role={openOnRowClick ? "button" : undefined}
			tabIndex={openOnRowClick ? 0 : undefined}
			className={cn(
				hoverRevealRowClassName,
				"flex min-h-16 items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-hovered",
				openOnRowClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				!isLast && "border-b border-border",
			)}
			onClick={openOnRowClick ? handleOpen : undefined}
			onKeyDown={openOnRowClick
				? (event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							handleOpen();
						}
					}
				: undefined}
		>
			<ArtifactListLeadingTile item={item} />
			{/* Reserve right-padding on hover/focus so both lines truncate clear of the
			    revealed "Open" button (a text button is wider than the hover-reveal-row
			    primitive's 24px icon-button presets). */}
			<div className="min-w-0 flex-1 pr-[92px] transition-[padding] duration-normal ease-out">
				<p className="truncate text-sm font-medium leading-5 text-text">{item.title}</p>
				<p className="flex items-center gap-1 text-xs leading-4">
					<span className="shrink-0 text-text-subtle">{item.source}</span>
					<span className="shrink-0 text-text-subtlest">•</span>
					<span className="min-w-0 truncate text-text-subtle">{item.owner}</span>
				</p>
			</div>
			<HoverRevealActions
				actionInsetClassName="right-3"
				action={
					<Button
						className="whitespace-nowrap"
						variant="outline"
						size="default"
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							handleOpen();
						}}
					>
						{openLabel}
					</Button>
				}
			/>
		</div>
	);
}

export function ArtifactList({
	items,
	onOpen,
	openLabel = "Open",
	openOnRowClick = false,
	className,
	...props
}: Readonly<ArtifactListProps>) {
	return (
		<div
			className={cn("overflow-hidden rounded-lg bg-surface-raised", className)}
			style={{ boxShadow: token("elevation.shadow.raised") }}
			{...props}
		>
			{items.map((item, index) => (
				<ArtifactListRow
					key={item.id}
					item={item}
					isLast={index === items.length - 1}
					openLabel={openLabel}
					openOnRowClick={openOnRowClick}
					onOpen={onOpen}
				/>
			))}
		</div>
	);
}

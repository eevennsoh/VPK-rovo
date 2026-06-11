"use client";

import { type ReactNode } from "react";

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
	/** ADS icon for the neutral leading tile (e.g. `<PageIcon label="" />`). */
	icon?: ReactNode;
	/**
	 * 2P/3P logo path (e.g. `/3p/google-drive/16.svg`) rendered inset on the same
	 * neutral tile. Takes precedence over `icon`.
	 */
	logoSrc?: string;
}

export interface ArtifactListProps extends React.ComponentProps<"div"> {
	items: readonly ArtifactListItem[];
	/** Fired when a row's hover/focus-revealed "Open" button is activated. */
	onOpen?: (item: ArtifactListItem) => void;
	/** Open-button label. Defaults to "Open". */
	openLabel?: string;
}

function ArtifactListLeadingTile({ item }: Readonly<{ item: ArtifactListItem }>) {
	return (
		<Tile
			aria-hidden
			label={item.source}
			variant="neutral"
			size="medium"
			className="rounded-tile"
		>
			{item.logoSrc ? (
				// eslint-disable-next-line @next/next/no-img-element -- Tile child-sizing CSS targets [&_img]; mirrors logo-mark.tsx
				<img alt="" aria-hidden className="object-contain" src={item.logoSrc} />
			) : (
				item.icon
			)}
		</Tile>
	);
}

function ArtifactListRow({
	item,
	isLast,
	openLabel,
	onOpen,
}: Readonly<{
	item: ArtifactListItem;
	isLast: boolean;
	openLabel: string;
	onOpen?: (item: ArtifactListItem) => void;
}>) {
	return (
		<div
			className={cn(
				hoverRevealRowClassName,
				"flex h-16 items-center gap-3 px-3 transition-colors hover:bg-surface-hovered",
				!isLast && "border-b border-border",
			)}
		>
			<ArtifactListLeadingTile item={item} />
			{/* Reserve right-padding on hover/focus so both lines truncate clear of the
			    revealed "Open" button (a text button is wider than the hover-reveal-row
			    primitive's 24px icon-button presets). */}
			<div className="min-w-0 flex-1 transition-[padding] duration-normal ease-out group-hover/hover-reveal-row:pr-[72px] group-has-[:focus-visible]/hover-reveal-row:pr-[72px]">
				<p className="truncate text-sm font-medium leading-5 text-text">{item.title}</p>
				<p className="flex items-center gap-1 text-xs leading-4">
					<span className="text-text-subtle">{item.source}</span>
					<span className="text-text-subtlest">•</span>
					<span className="truncate text-text-subtle">{item.owner}</span>
				</p>
			</div>
			<HoverRevealActions
				action={
					<Button variant="outline" size="default" type="button" onClick={() => onOpen?.(item)}>
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
					onOpen={onOpen}
				/>
			))}
		</div>
	);
}

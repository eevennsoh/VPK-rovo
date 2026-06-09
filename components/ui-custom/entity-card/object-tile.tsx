"use client";

import { type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EntityCardObjectTileProps extends Omit<ComponentProps<"div">, "title"> {
	icon?: ReactNode;
	title: string;
	description?: string;
	meta?: ReactNode;
	action?: ReactNode;
	href?: string;
	hasBorder?: boolean;
}

export function EntityCardObjectTile({
	icon,
	title,
	description,
	meta,
	action,
	href,
	hasBorder = true,
	className,
	...props
}: Readonly<EntityCardObjectTileProps>) {
	const content = (
		<>
			{icon ? <div data-slot="icon" className="shrink-0">{icon}</div> : null}
			<div data-slot="text" className="min-w-0 flex-1">
				<p data-slot="title" className="truncate text-sm font-medium text-text">
					{title}
				</p>
				{description ? (
					<p data-slot="description" className="truncate text-xs text-text-subtle">
						{description}
					</p>
				) : null}
			</div>
			{meta ? <div data-slot="meta" className="shrink-0 text-xs text-text-subtle">{meta}</div> : null}
			{action ? <div data-slot="action" className="shrink-0">{action}</div> : null}
		</>
	);

	const sharedClassName = cn(
		"flex items-center gap-3 rounded-lg px-3 py-2",
		hasBorder && "border border-border",
		href
			? "bg-surface no-underline outline-none transition-colors hover:bg-surface-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-surface-pressed"
			: "bg-surface",
		className,
	);

	if (href) {
		return (
			<a
				data-slot="object-tile"
				href={href}
				className={sharedClassName}
				{...(props as ComponentProps<"a">)}
			>
				{content}
			</a>
		);
	}

	return (
		<div data-slot="object-tile" className={sharedClassName} {...props}>
			{content}
		</div>
	);
}

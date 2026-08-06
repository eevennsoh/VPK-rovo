"use client";

import { Fragment, useState, type ComponentProps, type ReactNode } from "react";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import SettingsIcon from "@atlaskit/icon/core/settings";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FOCUS_RING_HAS_VISIBLE, FOCUS_RING_POPUP_OPEN } from "@/components/ui/focus-ring";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";

export interface ArtifactPaneSectionItem {
	content: ReactNode;
	/** Collapsed summary rendered after the title — a plain count, or a ratio such as `"1/3"`. */
	count?: number | string;
	defaultOpen?: boolean;
	headerAction?: Readonly<{
		label: string;
		onClick?: () => void;
	}>;
	id: string;
	title: ReactNode;
}

export interface ArtifactPaneProps extends Omit<ComponentProps<"section">, "children"> {
	borderless?: boolean;
	sections: readonly ArtifactPaneSectionItem[];
	showSeparators?: boolean;
}

export function ArtifactPanePropertyRow({
	children,
	editable = true,
	icon,
	label,
}: Readonly<{ children: ReactNode; editable?: boolean; icon: ReactNode; label: string }>) {
	return (
		<div className="grid min-h-8 min-w-0 grid-cols-[16px_84px_minmax(0,1fr)] items-center gap-2 text-xs leading-5">
			<span aria-hidden className="grid size-4 place-items-center text-icon-subtle">
				{icon}
			</span>
			<span className="text-text-subtlest">{label}</span>
			<div
				className={cn(
					"flex min-h-8 min-w-0 items-center text-text [&_[data-slot=avatar-group-count]]:size-6 [&_[data-slot=avatar]]:size-6 [&_[data-slot=tile]]:size-6",
					editable
						? cn(
								"-ml-2 rounded-md transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered motion-reduce:transition-none",
								"has-[:focus-visible]:bg-bg-input has-[[data-popup-open]]:bg-bg-input",
								FOCUS_RING_HAS_VISIBLE,
								FOCUS_RING_POPUP_OPEN,
								"[&>button]:m-0! [&>button]:min-h-8! [&>button]:w-full! [&>button]:max-w-none! [&>button]:px-2! [&>button]:py-0! [&>button]:focus-visible:ring-0!",
							)
						: null,
				)}
			>
				{children}
			</div>
		</div>
	);
}

function ArtifactPaneDisclosure({
	content,
	count,
	headerAction,
	onOpenChange,
	open,
	title,
}: Readonly<Omit<ArtifactPaneSectionItem, "defaultOpen" | "id"> & { onOpenChange: (open: boolean) => void; open: boolean }>) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<Collapsible onOpenChange={onOpenChange} open={open}>
			<div className="group/header relative flex w-full items-center">
				<CollapsibleTrigger
					render={
						<button
							className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
							type="button"
						/>
					}
				>
					<span
						className="flex min-w-0 items-center gap-1.5 text-text-subtle group-hover/header:text-text group-has-[:focus-visible]/header:text-text"
						style={{ font: token("font.heading.xxsmall") }}
					>
						{title}
						{!open && count !== undefined ? (
							<span className="shrink-0 text-xs font-normal text-text-subtlest">· {count}</span>
						) : null}
					</span>
					<motion.span
						animate={{ rotate: open ? 90 : 0 }}
						aria-hidden
						className="shrink-0 text-icon-subtle opacity-0 transition-opacity duration-fast ease-out-practical group-hover/header:opacity-100 group-has-[:focus-visible]/header:opacity-100 motion-reduce:transition-none"
						initial={false}
						style={{ willChange: "transform" }}
						transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: [0.4, 1, 0.6, 1] }}
					>
						<Icon render={<ChevronRightIcon label="" size="small" />} />
					</motion.span>
				</CollapsibleTrigger>
				{headerAction ? (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										aria-label={headerAction.label}
										className="pointer-events-none absolute top-1/2 right-8 -translate-y-1/2 opacity-0 transition-opacity duration-fast ease-out-practical group-hover/header:pointer-events-auto group-hover/header:opacity-100 group-has-[:focus-visible]/header:pointer-events-auto group-has-[:focus-visible]/header:opacity-100 motion-reduce:transition-none"
										onClick={headerAction.onClick}
										size="icon-compact"
										type="button"
										variant="ghost"
									/>
								}
							>
								<SettingsIcon label="" size="small" />
							</TooltipTrigger>
							<TooltipContent positionerClassName="z-[502]">{headerAction.label}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				) : null}
			</div>
			<CollapsibleContent>
				<div className="px-3 pb-3">{content}</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

/**
 * Reusable artifact details rail. Consumers provide independently collapsible
 * domain sections while this block owns the unified surface, disclosure chrome,
 * padding, and dividers.
 */
export function ArtifactPane({
	"aria-label": ariaLabel = "Artifact details",
	borderless = false,
	className,
	sections,
	showSeparators = true,
	style,
	...props
}: Readonly<ArtifactPaneProps>) {
	const [openSectionIds, setOpenSectionIds] = useState<ReadonlySet<string>>(
		() => new Set(sections.filter((section) => section.defaultOpen).map((section) => section.id)),
	);

	const setSectionOpen = (id: string, open: boolean) => {
		setOpenSectionIds((current) => {
			const next = new Set(current);
			if (open) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	};

	return (
		<section
			aria-label={ariaLabel}
			className={cn(
				"flex flex-col overflow-hidden rounded-lg",
				borderless ? null : "border border-border",
				className,
			)}
			style={{ backgroundColor: token("elevation.surface"), ...style }}
			{...props}
		>
			{sections.map((section, index) => {
				const open = openSectionIds.has(section.id);
				const previousOpen = index > 0 ? openSectionIds.has(sections[index - 1].id) : false;

				return (
					<Fragment key={section.id}>
						{showSeparators && index > 0 && (open || previousOpen) ? (
							<div className="px-3 py-1.5">
								<Separator />
							</div>
						) : null}
						<div
							className={cn(
								index === 0 ? "pt-1.5" : null,
								index === sections.length - 1 ? "pb-1.5" : null,
							)}
						>
							<ArtifactPaneDisclosure
								content={section.content}
								count={section.count}
								headerAction={section.headerAction}
								onOpenChange={(nextOpen) => setSectionOpen(section.id, nextOpen)}
								open={open}
								title={section.title}
							/>
						</div>
					</Fragment>
				);
			})}
		</section>
	);
}

export default ArtifactPane;

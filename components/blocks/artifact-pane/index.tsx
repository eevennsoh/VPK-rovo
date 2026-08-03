"use client";

import { Fragment, useState, type ComponentProps, type ReactNode } from "react";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import { motion, useReducedMotion } from "motion/react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";

export interface ArtifactPaneSectionItem {
	content: ReactNode;
	count?: number;
	defaultOpen?: boolean;
	id: string;
	title: ReactNode;
}

export interface ArtifactPaneProps extends Omit<ComponentProps<"section">, "children"> {
	borderless?: boolean;
	sections: readonly ArtifactPaneSectionItem[];
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
						? "-ml-2 rounded-md transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-within:bg-bg-neutral-subtle-hovered motion-reduce:transition-none [&>button]:m-0! [&>button]:min-h-8! [&>button]:w-full! [&>button]:max-w-none! [&>button]:px-2! [&>button]:py-0!"
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
	onOpenChange,
	open,
	title,
}: Readonly<Omit<ArtifactPaneSectionItem, "defaultOpen" | "id"> & { onOpenChange: (open: boolean) => void; open: boolean }>) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<Collapsible onOpenChange={onOpenChange} open={open}>
			<CollapsibleTrigger
				render={
					<button
						className="group/header flex w-full items-center justify-between gap-3 px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
						type="button"
					/>
				}
			>
				<span
					className="flex min-w-0 items-center gap-1.5 text-text-subtle group-hover/header:text-text group-focus-visible/header:text-text"
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
					className="shrink-0 text-icon-subtle opacity-0 group-hover/header:opacity-100 group-focus-visible/header:opacity-100"
					initial={false}
					style={{ willChange: "transform" }}
					transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: [0.4, 1, 0.6, 1] }}
				>
					<Icon render={<ChevronRightIcon label="" size="small" />} />
				</motion.span>
			</CollapsibleTrigger>
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
						{index > 0 && (open || previousOpen) ? (
							<div className="py-1.5">
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

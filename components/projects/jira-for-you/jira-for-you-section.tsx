"use client";

import { useState, type MouseEvent as ReactMouseEvent } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { JiraForYouItemRow } from "./jira-for-you-item";
import type {
	JiraForYouItem,
	JiraForYouSection,
} from "./jira-for-you-types";

function SectionLabel({ label }: Readonly<{ label: string }>) {
	return (
		<span
			className="text-text-subtlest"
			style={{ font: token("font.heading.xxsmall") }}
		>
			{label}
		</span>
	);
}

function ItemList({
	forcedVisibleViewItemId,
	items,
	onItemButtonRef,
	onItemClick,
	onRowButtonRef,
	onView,
	selectedItemId,
}: Readonly<{
	forcedVisibleViewItemId?: string;
	items: readonly JiraForYouItem[];
	onItemButtonRef?: (item: JiraForYouItem, node: HTMLButtonElement | null) => void;
	onItemClick?: (item: JiraForYouItem, event: ReactMouseEvent<HTMLButtonElement>) => void;
	onRowButtonRef?: (item: JiraForYouItem, node: HTMLButtonElement | null) => void;
	onView?: (item: JiraForYouItem, event: ReactMouseEvent<HTMLButtonElement>) => void;
	selectedItemId?: string;
}>) {
	return (
		<ul className="@container/jira-for-you-items divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
			{items.map((item) => (
				<JiraForYouItemRow
					isSelected={item.id === selectedItemId}
					isViewActionForcedVisible={item.id === forcedVisibleViewItemId}
					item={item}
					key={item.id}
					onItemClick={onItemClick}
					onRowButtonRef={onRowButtonRef}
					onView={onView}
					onViewButtonRef={onItemButtonRef}
				/>
			))}
		</ul>
	);
}

export function JiraForYouSectionGroup({
	forcedVisibleViewItemId,
	onItemButtonRef,
	onItemClick,
	onRowButtonRef,
	onView,
	selectedItemId,
	section,
}: Readonly<{
	forcedVisibleViewItemId?: string;
	onItemButtonRef?: (item: JiraForYouItem, node: HTMLButtonElement | null) => void;
	onItemClick?: (item: JiraForYouItem, event: ReactMouseEvent<HTMLButtonElement>) => void;
	onRowButtonRef?: (item: JiraForYouItem, node: HTMLButtonElement | null) => void;
	onView?: (item: JiraForYouItem, event: ReactMouseEvent<HTMLButtonElement>) => void;
	selectedItemId?: string;
	section: JiraForYouSection;
}>) {
	const [open, setOpen] = useState(true);
	const itemList = (
		<ItemList
			forcedVisibleViewItemId={forcedVisibleViewItemId}
			items={section.items}
			onItemButtonRef={onItemButtonRef}
			onItemClick={onItemClick}
			onRowButtonRef={onRowButtonRef}
			onView={onView}
			selectedItemId={selectedItemId}
		/>
	);

	if (!section.collapsible) {
		return (
			<section className="flex flex-col">
				<div className="flex h-8 items-center">
					<SectionLabel label={section.label} />
				</div>
				{itemList}
			</section>
		);
	}

	return (
		<Collapsible className="flex flex-col" onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger
				render={
					<button
						className="flex h-8 w-fit items-center gap-1 rounded-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
						type="button"
					/>
				}
			>
				<SectionLabel label={section.label} />
				<Icon
					aria-hidden
					className={cn(
						"text-icon-subtle transition-transform duration-normal ease-out-practical motion-reduce:transition-none",
						!open && "-rotate-90",
					)}
					render={<ChevronDownIcon label="" size="small" />}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent>{itemList}</CollapsibleContent>
		</Collapsible>
	);
}

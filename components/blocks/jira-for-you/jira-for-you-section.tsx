"use client";

import { useState } from "react";
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
	items,
	onItemClick,
}: Readonly<{
	items: readonly JiraForYouItem[];
	onItemClick?: (item: JiraForYouItem) => void;
}>) {
	return (
		<ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
			{items.map((item) => (
				<JiraForYouItemRow item={item} key={item.id} onItemClick={onItemClick} />
			))}
		</ul>
	);
}

export function JiraForYouSectionGroup({
	onItemClick,
	section,
}: Readonly<{
	onItemClick?: (item: JiraForYouItem) => void;
	section: JiraForYouSection;
}>) {
	const [open, setOpen] = useState(true);

	if (!section.collapsible) {
		return (
			<section className="flex flex-col">
				<div className="flex h-8 items-center">
					<SectionLabel label={section.label} />
				</div>
				<ItemList items={section.items} onItemClick={onItemClick} />
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
			<CollapsibleContent>
				<ItemList items={section.items} onItemClick={onItemClick} />
			</CollapsibleContent>
		</Collapsible>
	);
}

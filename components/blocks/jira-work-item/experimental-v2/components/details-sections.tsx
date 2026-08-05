"use client";

import { useState, type ReactNode } from "react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { APP_ROWS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";

function CollapsibleSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
	const [open, setOpen] = useState(false);
	return (
		<Collapsible onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger
				render={
					<button
						className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-1 rounded-md px-2 py-1 text-left outline-none transition-colors duration-normal ease-out-practical hover:bg-surface-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
						type="button"
					/>
				}
			>
				<Icon
					aria-hidden
					className="text-icon-subtle"
					render={open ? <ChevronDownIcon label="" size="small" /> : <ChevronRightIcon label="" size="small" />}
				/>
				<span className="text-sm font-medium text-text">{title}</span>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="pb-2">{children}</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

/** Development section empty-state content. */
export function DevelopmentSectionContent() {
	return (
		<p className="text-sm text-text-subtle">
			Connect a repository to see branches, commits, and pull requests linked to this work item.
		</p>
	);
}

/** Collapsible Development section (light mock empty state). */
export function DevelopmentSection() {
	return (
		<CollapsibleSection title="Development">
			<DevelopmentSectionContent />
		</CollapsibleSection>
	);
}

/** Mock connected app rows; the metadata rail owns the Apps heading. */
export function AppsSection() {
	return (
		<div className="flex flex-col">
			{APP_ROWS.map((app) => (
				<button
					className="-mx-2 flex items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
					key={app.id}
					type="button"
				>
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="truncate text-sm font-medium text-text">{app.name}</span>
						<span className="truncate text-xs text-text-subtlest">{app.byline}</span>
					</span>
					<Icon aria-hidden className="shrink-0 text-icon-subtle" render={<ChevronRightIcon label="" size="small" />} />
				</button>
			))}
		</div>
	);
}

"use client";

import { useState, type ReactNode } from "react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { APP_ROWS } from "@/components/blocks/agent-sessions/data/metadata-fixtures";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";

function CollapsibleSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
	const [open, setOpen] = useState(false);
	return (
		<Collapsible onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger
				render={
					<button
						className="flex w-full items-center gap-1 rounded-md py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
						type="button"
					/>
				}
			>
				<Icon
					aria-hidden
					className="text-icon-subtle"
					render={open ? <ChevronDownIcon label="" size="small" /> : <ChevronRightIcon label="" size="small" />}
				/>
				<Heading as="h3" size="small">
					{title}
				</Heading>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="pb-2 pl-6">{children}</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

/** Collapsible Development section (light mock empty state). */
export function DevelopmentSection() {
	return (
		<CollapsibleSection title="Development">
			<p className="text-sm text-text-subtle">
				Connect a repository to see branches, commits, and pull requests linked to this work item.
			</p>
		</CollapsibleSection>
	);
}

/** Collapsible Apps section with mock connected app rows. */
export function AppsSection() {
	return (
		<CollapsibleSection title="Apps">
			<div className="flex flex-col">
				{APP_ROWS.map((app) => (
					<button
						className="flex items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
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
		</CollapsibleSection>
	);
}

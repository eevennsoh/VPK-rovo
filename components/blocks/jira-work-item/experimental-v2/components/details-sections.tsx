"use client";

import { useId, useState, type ReactNode } from "react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { APP_ROWS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import { toDevelopmentCommands } from "@/components/blocks/jira-work-item/experimental-v2/lib/development-commands";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { BitbucketLogo } from "@/components/ui/logo";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Snippet, SnippetCopyButton, SnippetInput } from "@/components/ui-custom/snippet";

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

/**
 * One "Create branch in …" action row. Geometry and type match the Automation
 * section's rule rows so both lists in the rail read as one control surface;
 * the 24px provider mark stands in for Automation's `IconTile`.
 */
function CreateBranchRow({ children, logo }: Readonly<{ children: ReactNode; logo: ReactNode }>) {
	return (
		<button
			className="-mx-2 flex w-[calc(100%+1rem)] min-w-0 items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
			type="button"
		>
			<span aria-hidden className="grid size-6 shrink-0 place-items-center">
				{logo}
			</span>
			<span className="min-w-0 flex-1 truncate text-sm text-text">{children}</span>
		</button>
	);
}

/**
 * Labelled read-only value with a copy button. `Snippet` owns the clipboard
 * write and the copied-state checkmark, so this only supplies the label
 * association, the rail's compact type scale, and the VPK tooltip.
 */
function DevelopmentCopyField({ code, label }: Readonly<{ code: string; label: string }>) {
	const fieldId = useId();

	return (
		<div className="flex min-w-0 flex-col gap-1">
			<Label className="text-xs text-text-subtle" htmlFor={fieldId}>
				{label}
			</Label>
			<Snippet className="w-full" code={code}>
				<SnippetInput className="text-xs" id={fieldId} />
				<Tooltip>
					{/* The tooltip trigger is passed *into* the button via `render`, not
					    wrapped around it. `SnippetCopyButton` applies its clipboard
					    `onClick` before its own props spread, so a
					    `TooltipTrigger render={<SnippetCopyButton />}` would overwrite
					    the copy handler with Base UI's and silently break copying.
					    `items-center` leaves 3px above and below a 24px button inside the
					    group's 30px content box; mirror that on the trailing edge so the
					    button is inset evenly. 3px is off Tailwind's 4px spacing scale.
					    `title` is cleared because Snippet hardcodes "Copy" — the native
					    tooltip would otherwise compete with this one. */}
					<SnippetCopyButton
						aria-label={label}
						className="mr-[3px]"
						render={<TooltipTrigger />}
						size="icon-xs"
						title={undefined}
					/>
					<TooltipContent positionerClassName="z-[502]">{label}</TooltipContent>
				</Tooltip>
			</Snippet>
		</div>
	);
}

/**
 * Development section content: connect-a-branch actions above the git handoff
 * strings a developer copies to start work on this item.
 */
export function DevelopmentSectionContent({
	summary,
	workItemKey,
}: Readonly<{ summary: string; workItemKey: string }>) {
	const { branchCommand, commitCommand } = toDevelopmentCommands(workItemKey, summary);

	return (
		<div className="flex min-w-0 flex-col gap-3">
			<div className="flex flex-col">
				{/* Both marks stay brand-coloured in dark mode: ADS logos default to
				    `themeAware`, which would flatten Bitbucket to a monochrome
				    `inverse` glyph, and GitHub's black mark needs the upstream
				    white tile to stay legible on a dark surface. */}
				<CreateBranchRow logo={<BitbucketLogo appearance="brand" label="" size="small" />}>
					Create branch in Bitbucket Cloud
				</CreateBranchRow>
				<CreateBranchRow logo={<GithubLogo label="" size="small" />}>
					Create branch in GitHub
				</CreateBranchRow>
			</div>
			<TooltipProvider>
				<div className="flex min-w-0 flex-col gap-3">
					<DevelopmentCopyField code={branchCommand} label="Copy branch command" />
					<DevelopmentCopyField code={commitCommand} label="Copy commit command" />
					<DevelopmentCopyField code={workItemKey} label="Copy work item key" />
				</div>
			</TooltipProvider>
		</div>
	);
}

/** Collapsible Development section for surfaces without the artifact rail. */
export function DevelopmentSection({
	summary,
	workItemKey,
}: Readonly<{ summary: string; workItemKey: string }>) {
	return (
		<CollapsibleSection title="Development">
			<DevelopmentSectionContent summary={summary} workItemKey={workItemKey} />
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

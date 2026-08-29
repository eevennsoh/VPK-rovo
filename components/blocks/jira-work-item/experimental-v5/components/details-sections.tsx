"use client";

import { useState, type ReactNode } from "react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { APP_ROWS } from "@/components/blocks/jira-work-item/data/metadata-fixtures";
import { DevelopmentRepositoryPicker } from "@/components/blocks/jira-work-item/experimental-v5/components/development-repository-picker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { BitbucketLogo } from "@/components/ui/logo";
import { GithubLogo } from "@/components/ui/logo-third-party";

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

/** Repository selection and provider actions for starting development work. */
export function DevelopmentSectionContent() {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<DevelopmentRepositoryPicker />
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
		</div>
	);
}

/** Collapsible Repositories section for surfaces without the artifact rail. */
export function DevelopmentSection() {
	return (
		<CollapsibleSection title="Repositories">
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

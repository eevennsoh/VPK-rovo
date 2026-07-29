"use client";

import type { ComponentProps, ReactNode } from "react";

import AddIcon from "@atlaskit/icon/core/add";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tile } from "@/components/ui/tile";
import { TeamworkGraphMark } from "@/components/ui-custom/teamwork-graph-mark";
import { TwgToolBannerBackground } from "@/components/ui-custom/twg-tool";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { cn } from "@/lib/utils";

const KNOWLEDGE_SOURCES = [
	{ id: "twg", label: "Teamwork Graph", provider: "twg" },
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "teams", label: "Microsoft Teams", provider: "teams" },
	{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
] as const satisfies readonly TwgToolSource[];

function KnowledgeSectionLabel({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<div className="flex min-h-5 items-center text-xs font-semibold leading-4 text-text-subtlest">
			{children}
		</div>
	);
}

function KnowledgeIconTile({ children, label }: Readonly<{ children: ReactNode; label: string }>) {
	return (
		<Tile
			className="shrink-0 text-icon-subtle"
			label={label}
			size="medium"
			variant="neutral"
		>
			{children}
		</Tile>
	);
}

export type KnowledgeProps = ComponentProps<"section">;

/**
 * Knowledge configuration panel — the Teamwork Graph source row, a Memory row
 * with a Manage action, and an Add knowledge button. Extracted from the agent
 * strategy surface so it can be reused on its own.
 */
export function Knowledge({ className, ...props }: Readonly<KnowledgeProps>) {
	return (
		<section className={cn("space-y-0", className)} {...props}>
			<KnowledgeSectionLabel>Knowledge</KnowledgeSectionLabel>
			<div className="rounded-xl border border-border bg-bg-input p-1.5">
				<div className="relative flex h-12 min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg bg-surface-sunken pl-1.5 pr-2">
					<TwgToolBannerBackground />
					<div className="relative z-10 flex min-w-0 items-center gap-2">
						<Tile
							className="bg-surface text-icon-discovery"
							hasBorder
							label="Teamwork Graph"
							size="medium"
							variant="transparent"
						>
							<TeamworkGraphMark />
						</Tile>
						<span className="truncate text-sm font-medium text-text-subtle">Teamwork Graph</span>
					</div>
					<TWGAppstack
						className="relative z-10 max-w-[42%]"
						iconSize="small"
						sources={KNOWLEDGE_SOURCES}
					/>
				</div>
				<div className="flex items-center justify-between rounded-lg p-1.5 transition-colors hover:bg-bg-neutral-subtle-hovered">
					<div className="flex min-w-0 items-center gap-3">
						<KnowledgeIconTile label="Memory">
							<Icon render={<AiModelIcon label="" />} aria-hidden />
						</KnowledgeIconTile>
						<span className="truncate text-sm font-medium text-text-subtle">Memory</span>
					</div>
					<Button variant="ghost">
						Manage
					</Button>
				</div>
				<div className="px-1.5 py-1.5">
					<div className="h-px bg-border-disabled" />
				</div>
				<button
					type="button"
					className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left text-sm font-medium text-text-subtle transition-colors hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<KnowledgeIconTile label="Add knowledge">
						<Icon render={<AddIcon label="" size="small" />} aria-hidden />
					</KnowledgeIconTile>
					<span>Add knowledge</span>
				</button>
			</div>
		</section>
	);
}

Knowledge.displayName = "Knowledge";

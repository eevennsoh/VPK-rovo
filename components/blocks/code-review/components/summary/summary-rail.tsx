"use client";

import ChangesIcon from "@atlaskit/icon/core/changes";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import MenuIcon from "@atlaskit/icon/core/menu";

import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ALL_CHANGES_SUMMARY } from "../../data/changed-files";
import type { ChangeSet } from "../../data/types";
import { DiffStat } from "../diff-stat";
import { SummaryChangeCard } from "./summary-change-card";

interface SummaryRailProps {
	changeSets: readonly ChangeSet[];
	selectedChangeSetId: string | null;
	onSelect: (id: string | null) => void;
}

export function SummaryRail({
	changeSets,
	selectedChangeSetId,
	onSelect,
}: Readonly<SummaryRailProps>) {
	return (
		<ScrollArea className="min-h-0 border-r border-border p-2">
			<div className="flex min-h-full flex-col gap-1">
				<div className="flex h-10 items-center gap-2 px-3 text-sm text-text-subtle">
					<MenuIcon label="" size="small" />
					<span>Overview</span>
				</div>
				<Collapsible defaultOpen>
					<CollapsibleTrigger
						render={
							<Button
								className="h-10 w-full justify-start gap-2 px-3"
								variant="secondary"
							/>
						}
					>
						<ChevronDownIcon label="" size="small" />
						<ChangesIcon label="" size="small" />
						<span>Changes</span>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="flex flex-col gap-1 pt-2">
							<Button
								aria-pressed={selectedChangeSetId === null}
								className="h-auto w-full flex-col items-stretch gap-1 px-3 py-2 text-left"
								onClick={() => onSelect(null)}
								variant="ghost"
							>
								<span>All changes</span>
								<span className="flex items-center gap-2 text-xs text-text-subtle">
									<span className="font-mono">{ALL_CHANGES_SUMMARY.fileCount} files</span>
									<DiffStat
										additions={ALL_CHANGES_SUMMARY.additions}
										deletions={ALL_CHANGES_SUMMARY.deletions}
									/>
								</span>
							</Button>
							{changeSets.map((changeSet) => (
								<SummaryChangeCard
									changeSet={changeSet}
									key={changeSet.id}
									onSelect={onSelect}
									selected={selectedChangeSetId === changeSet.id}
								/>
							))}
							<Button className="w-fit" size="compact" variant="ghost">
								Show all
							</Button>
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>
		</ScrollArea>
	);
}

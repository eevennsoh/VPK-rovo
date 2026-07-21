"use client";

import FileIcon from "@atlaskit/icon/core/file";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ChangeSet } from "../../data/types";
import { DiffStat } from "../diff-stat";

interface SummaryChangeCardProps {
	changeSet: ChangeSet;
	selected: boolean;
	onSelect: (id: string) => void;
}

export function SummaryChangeCard({
	changeSet,
	selected,
	onSelect,
}: Readonly<SummaryChangeCardProps>) {
	return (
		<Button
			aria-pressed={selected}
			className={cn(
				"h-auto w-full flex-col items-stretch gap-2 whitespace-normal border px-3 py-2 text-left",
				selected
					? "border-border-selected bg-bg-selected hover:bg-bg-selected-hovered"
					: "border-transparent",
			)}
			onClick={() => onSelect(changeSet.id)}
			variant="ghost"
		>
			<span className="text-sm leading-5 text-text">{changeSet.title}</span>
			<span className="flex min-w-0 items-center gap-1.5">
				<FileIcon label="" size="small" />
				<span className="min-w-0 flex-1 truncate font-mono text-xs text-text-subtle">
					{changeSet.fileLabel}
				</span>
				<DiffStat additions={changeSet.additions} deletions={changeSet.deletions} />
			</span>
		</Button>
	);
}

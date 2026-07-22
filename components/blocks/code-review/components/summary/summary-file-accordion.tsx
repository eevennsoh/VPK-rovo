"use client";

import AddIcon from "@atlaskit/icon/core/add";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditIcon from "@atlaskit/icon/core/edit";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

import type { ChangedFile, DiffLayout, FileChangeStatus } from "../../data/types";
import { DiffFileView } from "../diff-file-view";
import { DiffStat } from "../diff-stat";

interface SummaryFileAccordionProps {
	file: ChangedFile;
	layout: DiffLayout;
}

function FileStatusIcon({ status }: Readonly<{ status: FileChangeStatus }>) {
	if (status === "added") {
		return <Icon className="text-text-accent-lime" label="Added" render={<AddIcon label="" size="small" />} />;
	}
	if (status === "deleted") {
		return <Icon className="text-text-accent-red" label="Deleted" render={<DeleteIcon label="" size="small" />} />;
	}
	return <Icon className="text-icon-accent-blue" label="Modified" render={<EditIcon label="" size="small" />} />;
}

export function SummaryFileAccordion({
	file,
	layout,
}: Readonly<SummaryFileAccordionProps>) {
	const [isOpen, setIsOpen] = useState(file.defaultExpanded);
	const separatorIndex = file.path.lastIndexOf("/");
	const directory = separatorIndex >= 0 ? file.path.slice(0, separatorIndex + 1) : "";
	const filename = separatorIndex >= 0 ? file.path.slice(separatorIndex + 1) : file.path;

	return (
		<section className="border-b border-border">
			<div className="flex h-11 items-center px-2">
				<Button
					aria-expanded={isOpen}
					className="min-w-0 flex-1 justify-start px-2"
					onClick={() => setIsOpen((previous) => !previous)}
					variant="ghost"
				>
					<Icon
						aria-hidden
						className={isOpen ? "rotate-90" : undefined}
						render={<ChevronRightIcon label="" size="small" />}
					/>
					<FileStatusIcon status={file.status} />
					<span className="min-w-0 flex-1 truncate text-left font-mono text-xs text-text-subtlest">
						<span>{directory}</span>
						<span className="font-semibold text-text">{filename}</span>
					</span>
					<DiffStat additions={file.additions} deletions={file.deletions} />
				</Button>
				<Button aria-label={`Actions for ${file.path}`} size="icon-compact" variant="ghost">
					<ShowMoreHorizontalIcon label="" size="small" />
				</Button>
			</div>
			{isOpen ? <DiffFileView className="border-t border-border" file={file} layout={layout} /> : null}
		</section>
	);
}

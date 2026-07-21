"use client";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import SearchIcon from "@atlaskit/icon/core/search";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	FileTree,
	FileTreeFile,
	FileTreeFolder,
} from "@/components/ui-custom/file-tree";

import { EXPLORER_TREE } from "../../data/explorer-tree";
import type { ExplorerNode } from "../../data/types";

const DEFAULT_EXPANDED_PATHS = new Set(["vscode"]);

function renderExplorerNode(node: ExplorerNode): ReactNode {
	if (node.kind === "folder") {
		return (
			<FileTreeFolder aria-label={node.name} key={node.id} name={node.name} path={node.id}>
				{node.children?.map(renderExplorerNode)}
			</FileTreeFolder>
		);
	}

	return (
		<FileTreeFile
			aria-label={node.name}
			aria-disabled={node.fileId ? undefined : true}
			className={node.fileId ? undefined : "cursor-default"}
			key={node.id}
			name={node.name}
			path={node.fileId ?? node.id}
		/>
	);
}

interface EditorExplorerProps {
	selectedFileId: string;
	onFileSelect: (fileId: string) => void;
}

export function EditorExplorer({
	selectedFileId,
	onFileSelect,
}: Readonly<EditorExplorerProps>) {
	const handleSelect = (path: string) => {
		if (path === "ipc-mp-test") {
			onFileSelect(path);
		}
	};

	return (
		<aside className="flex min-h-0 flex-col border-r border-border bg-surface-raised">
			<div className="p-2 pb-1">
				<label className="relative block">
					<span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-icon-subtle">
						<SearchIcon label="" size="small" />
					</span>
					<Input
						aria-label="Search explorer"
						className="pl-8"
						isCompact
						placeholder="vitafleet"
					/>
				</label>
			</div>
			<div className="flex h-8 items-center px-3 text-[11px] font-semibold text-text-subtlest">
				<span>EXPLORER</span>
				<Button
					aria-label="Explorer actions"
					className="ml-auto"
					size="icon-compact"
					variant="ghost"
				>
					<ShowMoreHorizontalIcon label="" size="small" />
				</Button>
			</div>
			<ScrollArea className="min-h-0 flex-1 px-1">
				<FileTree
					className="rounded-none text-xs"
					defaultExpanded={DEFAULT_EXPANDED_PATHS}
					onSelect={handleSelect}
					selectedPath={selectedFileId}
				>
					<FileTreeFolder aria-label="VSCODE" name="VSCODE" path="vscode">
						{EXPLORER_TREE.map(renderExplorerNode)}
					</FileTreeFolder>
				</FileTree>
			</ScrollArea>
			<Button
				aria-expanded={false}
				className="h-8 w-full justify-start rounded-none border-t border-border px-2 text-[11px] font-semibold"
				variant="ghost"
			>
				<ChevronRightIcon label="" size="small" />
				OUTLINE
			</Button>
		</aside>
	);
}

"use client";

import SearchIcon from "@atlaskit/icon/core/search";
import type { ReactNode } from "react";

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
		</aside>
	);
}

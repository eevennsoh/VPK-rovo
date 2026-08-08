"use client";

import SearchIcon from "@atlaskit/icon/core/search";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	FileTree2,
	type FileTree2GitStatus,
	type FileTree2Item,
} from "@/components/ui-custom/file-tree-2";
import { cn } from "@/lib/utils";

import { EXPLORER_TREE } from "../../data/explorer-tree";
import type { ChangedFile, ExplorerNode } from "../../data/types";

const CODE_REVIEW_ROOT_PATH = "VSCODE";
const DEMO_GIT_STATUSES: Readonly<Record<string, FileTree2GitStatus>> = {
	".browserslistrc": "ignored",
	".gitignore": "deleted",
	"CONTRIBUTING.md": "added",
	"node_modules": "ignored",
	"package.json": "renamed",
	"yarn.lock": "untracked",
};

interface CodeReviewTreeData {
	fileIdsByPath: ReadonlyMap<string, string>;
	items: readonly FileTree2Item[];
	pathsByFileId: ReadonlyMap<string, string>;
}

function createCodeReviewTreeData(
	files: readonly ChangedFile[],
	rootPath: string,
	includeDemoTree: boolean,
): CodeReviewTreeData {
	const changedFilesRootPath = `${rootPath}/CHANGED FILES`;
	const itemsByPath = new Map<string, FileTree2Item>([
		[rootPath, { path: rootPath, type: "folder" }],
	]);
	const fileIdsByPath = new Map<string, string>();
	const pathsByFileId = new Map<string, string>();
	if (includeDemoTree) {
		itemsByPath.set(changedFilesRootPath, { path: changedFilesRootPath, type: "folder" });
	}

	const addExplorerNode = (node: ExplorerNode, parentPath: string) => {
		const path = `${parentPath}/${node.name}`;
		itemsByPath.set(path, {
			disabled: node.kind === "file" && !node.fileId,
			path,
			status: DEMO_GIT_STATUSES[path.slice(rootPath.length + 1)],
			type: node.kind,
		});

		if (node.fileId) {
			fileIdsByPath.set(path, node.fileId);
			pathsByFileId.set(node.fileId, path);
		}
		for (const child of node.children ?? []) {
			addExplorerNode(child, path);
		}
	};

	if (includeDemoTree) {
		for (const node of EXPLORER_TREE.filter((node) => !node.fileId)) {
			addExplorerNode(node, rootPath);
		}
	}

	for (const file of files) {
		const fileName = file.path.split("/").at(-1) ?? file.path;
		const path = file.explorerPath
			? `${rootPath}/${file.explorerPath}`
			: includeDemoTree
				? `${changedFilesRootPath}/${fileName}`
				: `${rootPath}/${file.path}`;
		let parentPath = path.slice(0, path.lastIndexOf("/"));
		while (parentPath && parentPath !== rootPath) {
			if (!itemsByPath.has(parentPath)) {
				itemsByPath.set(parentPath, { path: parentPath, type: "folder" });
			}
			parentPath = parentPath.slice(0, parentPath.lastIndexOf("/"));
		}
		const existingItem = itemsByPath.get(path);
		itemsByPath.set(path, {
			...existingItem,
			disabled: false,
			path,
			status: file.additions > 0 || file.deletions > 0
				? file.status
				: existingItem?.status,
			type: "file",
		});
		fileIdsByPath.set(path, file.id);
		pathsByFileId.set(file.id, path);
	}

	return {
		fileIdsByPath,
		items: [...itemsByPath.values()],
		pathsByFileId,
	};
}

interface EditorExplorerProps {
	className?: string;
	explorerRootLabel?: string;
	files: readonly ChangedFile[];
	includeDemoTree?: boolean;
	selectedFileId: string;
	showSearch?: boolean;
	onFileSelect: (fileId: string) => void;
}

export function EditorExplorer({
	className,
	explorerRootLabel = CODE_REVIEW_ROOT_PATH,
	files,
	includeDemoTree = true,
	selectedFileId,
	showSearch = true,
	onFileSelect,
}: Readonly<EditorExplorerProps>) {
	const { fileIdsByPath, items, pathsByFileId } = createCodeReviewTreeData(
		files,
		explorerRootLabel,
		includeDemoTree,
	);
	const defaultExpandedPaths = items
		.filter((item) => item.type === "folder")
		.map((item) => item.path);
	const handleSelect = (path: string) => {
		const fileId = fileIdsByPath.get(path);
		if (fileId) {
			onFileSelect(fileId);
		}
	};

	return (
		<aside className={cn("flex min-h-0 flex-col border-r border-border bg-surface-raised", className)}>
			{showSearch ? (
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
			) : null}
			<ScrollArea className="min-h-0 flex-1 px-1 [&_[data-slot=scroll-area-scrollbar]]:opacity-0 [&_[data-slot=scroll-area-scrollbar]]:transition-opacity hover:[&_[data-slot=scroll-area-scrollbar]]:opacity-100 focus-within:[&_[data-slot=scroll-area-scrollbar]]:opacity-100">
				<FileTree2
					aria-label="Code review files"
					className="rounded-none border-0 bg-transparent text-xs [&_[role=tree]]:max-h-none [&_[role=tree]]:overflow-visible"
					defaultExpandedPaths={defaultExpandedPaths}
					items={items}
					onSelectedPathChange={handleSelect}
					selectedPath={pathsByFileId.get(selectedFileId)}
				/>
			</ScrollArea>
		</aside>
	);
}

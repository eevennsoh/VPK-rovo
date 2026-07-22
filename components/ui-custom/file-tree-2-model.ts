export type FileTree2ItemType = "file" | "folder";
export type FileTree2SearchMode = "collapse-non-matches" | "expand-matches" | "hide-non-matches";

export interface FileTree2ModelItem {
	path: string;
	type?: FileTree2ItemType;
}

export interface FileTree2Node {
	children: readonly string[];
	depth: number;
	name: string;
	parentPath: string | null;
	path: string;
	type: FileTree2ItemType;
}

export interface FileTree2VisibleNode extends FileTree2Node {
	flattenedPaths: readonly string[];
}

export interface FileTree2Model {
	nodes: ReadonlyMap<string, FileTree2Node>;
	roots: readonly string[];
}

interface MutableFileTree2Node extends Omit<FileTree2Node, "children"> {
	children: string[];
}

const fileTree2Collator = new Intl.Collator("en-US", {
	numeric: true,
	sensitivity: "base",
});

export function normalizeFileTree2Path(path: string): string {
	return path.trim().replaceAll("\\", "/").replace(/^\/+|\/+$/gu, "").replace(/\/{2,}/gu, "/");
}

function getParentPath(path: string): string | null {
	const separatorIndex = path.lastIndexOf("/");
	return separatorIndex === -1 ? null : path.slice(0, separatorIndex);
}

function getName(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1);
}

function compareNodes(
	nodes: ReadonlyMap<string, MutableFileTree2Node>,
	leftPath: string,
	rightPath: string,
): number {
	const left = nodes.get(leftPath);
	const right = nodes.get(rightPath);

	if (left?.type !== right?.type) {
		return left?.type === "folder" ? -1 : 1;
	}

	return fileTree2Collator.compare(left?.name ?? leftPath, right?.name ?? rightPath);
}

export function createFileTree2Model(items: readonly FileTree2ModelItem[]): FileTree2Model {
	const nodes = new Map<string, MutableFileTree2Node>();

	const ensureNode = (path: string, type: FileTree2ItemType): MutableFileTree2Node => {
		const existing = nodes.get(path);
		if (existing) {
			if (type === "folder") {
				existing.type = "folder";
			}
			return existing;
		}

		const parentPath = getParentPath(path);
		const node: MutableFileTree2Node = {
			children: [],
			depth: path.split("/").length - 1,
			name: getName(path),
			parentPath,
			path,
			type,
		};
		nodes.set(path, node);
		return node;
	};

	for (const item of items) {
		const path = normalizeFileTree2Path(item.path);
		if (!path) {
			continue;
		}

		ensureNode(path, item.type ?? (item.path.trim().endsWith("/") ? "folder" : "file"));

		let parentPath = getParentPath(path);
		while (parentPath) {
			ensureNode(parentPath, "folder");
			parentPath = getParentPath(parentPath);
		}
	}

	for (const node of nodes.values()) {
		if (!node.parentPath) {
			continue;
		}
		const parent = nodes.get(node.parentPath);
		if (parent && !parent.children.includes(node.path)) {
			parent.children.push(node.path);
		}
	}

	for (const node of nodes.values()) {
		node.children.sort((left, right) => compareNodes(nodes, left, right));
	}

	const roots = [...nodes.values()]
		.filter((node) => node.parentPath === null)
		.map((node) => node.path)
		.sort((left, right) => compareNodes(nodes, left, right));

	return { nodes, roots };
}

export function getFileTree2MovePath(
	model: FileTree2Model,
	sourcePath: string,
	destinationPath: string | null,
): string | null {
	const source = normalizeFileTree2Path(sourcePath);
	const destination = destinationPath ? normalizeFileTree2Path(destinationPath) : null;
	if (!model.nodes.has(source)) {
		return null;
	}
	if (destination && model.nodes.get(destination)?.type !== "folder") {
		return null;
	}
	if (destination === source || destination?.startsWith(`${source}/`)) {
		return null;
	}

	const sourceName = source.slice(source.lastIndexOf("/") + 1);
	const nextPath = destination ? `${destination}/${sourceName}` : sourceName;
	if (nextPath === source || model.nodes.has(nextPath)) {
		return null;
	}

	return nextPath;
}

export function getVisibleFileTree2Nodes(
	model: FileTree2Model,
	expandedPaths: ReadonlySet<string>,
	query = "",
	flattenEmptyDirectories = false,
	searchMode: FileTree2SearchMode = "hide-non-matches",
): readonly FileTree2VisibleNode[] {
	const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
	const matches = new Map<string, boolean>();

	const subtreeMatches = (path: string): boolean => {
		const node = model.nodes.get(path);
		if (!node) {
			return false;
		}
		const matchesSelf = node.name.toLocaleLowerCase("en-US").includes(normalizedQuery);
		const matchesChild = node.children.some((childPath) => subtreeMatches(childPath));
		const result = matchesSelf || matchesChild;
		matches.set(path, result);
		return result;
	};

	if (normalizedQuery) {
		for (const rootPath of model.roots) {
			subtreeMatches(rootPath);
		}
	}

	const getFlattenedPaths = (path: string): readonly string[] => {
		const paths = [path];
		let node = model.nodes.get(path);

		while (node?.type === "folder" && node.children.length === 1) {
			const child = model.nodes.get(node.children[0]);
			if (child?.type !== "folder") {
				break;
			}
			paths.push(child.path);
			node = child;
		}

		return paths;
	};

	const visibleNodes: FileTree2VisibleNode[] = [];
	const visit = (path: string, depth: number, parentPath: string | null) => {
		const node = model.nodes.get(path);
		if (!node || (normalizedQuery && searchMode === "hide-non-matches" && !matches.get(path))) {
			return;
		}

		const flattenedPaths = flattenEmptyDirectories ? getFlattenedPaths(path) : [path];
		const terminalNode = model.nodes.get(flattenedPaths.at(-1) ?? path) ?? node;
		const rowHasMatch = flattenedPaths.some((flattenedPath) => matches.get(flattenedPath));
		visibleNodes.push({
			...terminalNode,
			depth,
			flattenedPaths,
			name: flattenedPaths.map((flattenedPath) => model.nodes.get(flattenedPath)?.name).filter(Boolean).join(" / "),
			parentPath,
		});
		const isExpanded = !normalizedQuery
			? expandedPaths.has(terminalNode.path)
			: searchMode === "collapse-non-matches"
				? rowHasMatch
				: searchMode === "expand-matches"
					? rowHasMatch || expandedPaths.has(terminalNode.path)
					: true;
		if (terminalNode.type === "folder" && isExpanded) {
			for (const childPath of terminalNode.children) {
				visit(childPath, depth + 1, terminalNode.path);
			}
		}
	};

	for (const rootPath of model.roots) {
		visit(rootPath, 0, null);
	}

	return visibleNodes;
}

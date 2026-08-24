import {
	lstatSync,
	readdirSync,
	realpathSync,
} from "node:fs";
import path from "node:path";

function isInsideRoot(root, candidate) {
	return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function tryLstat(filePath) {
	try {
		return lstatSync(filePath);
	} catch (error) {
		if (error?.code === "ENOENT") return null;
		throw error;
	}
}

export function canonicalizeWorkspaceRoot(root) {
	return realpathSync.native(path.resolve(root));
}

export function normalizeRelativePath(relativePath, label) {
	const normalized = path.posix.normalize(relativePath.replaceAll("\\", "/"));
	if (
		!normalized ||
		normalized === "." ||
		path.posix.isAbsolute(normalized) ||
		normalized === ".." ||
		normalized.startsWith("../")
	) {
		throw new Error(`${label} must stay inside the workspace: ${relativePath}`);
	}
	return normalized;
}

function assertSafeExistingChain(root, absolutePath, label) {
	const relative = path.relative(root, absolutePath);
	let current = root;
	for (const segment of relative.split(path.sep).filter(Boolean)) {
		current = path.join(current, segment);
		const stats = tryLstat(current);
		if (!stats) break;
		if (stats.isSymbolicLink()) {
			throw new Error(`${label} contains a symbolic link: ${path.relative(root, current)}`);
		}
		const canonical = realpathSync.native(current);
		if (!isInsideRoot(root, canonical)) {
			throw new Error(`${label} escapes the canonical workspace: ${path.relative(root, current)}`);
		}
	}
}

export function resolveWorkspacePath(root, relativePath, label) {
	const canonicalRoot = canonicalizeWorkspaceRoot(root);
	const normalized = normalizeRelativePath(relativePath, label);
	const absolutePath = path.resolve(canonicalRoot, normalized);
	if (!isInsideRoot(canonicalRoot, absolutePath)) {
		throw new Error(`${label} escapes the workspace: ${relativePath}`);
	}
	assertSafeExistingChain(canonicalRoot, absolutePath, label);
	return { absolutePath, relativePath: normalized };
}

export function assertRegularFile(absolutePath, label) {
	const stats = lstatSync(absolutePath);
	if (!stats.isFile()) {
		throw new Error(`${label} must be a regular file`);
	}
}

export function listCopyFiles(absolutePath, label = "source path") {
	const rootStats = lstatSync(absolutePath);
	if (rootStats.isSymbolicLink()) {
		throw new Error(`${label} contains a symbolic link: ${absolutePath}`);
	}
	if (rootStats.isFile()) return [absolutePath];
	if (!rootStats.isDirectory()) {
		throw new Error(`${label} must be a regular file or directory`);
	}

	const files = [];
	function visit(directory) {
		const entries = readdirSync(directory, { withFileTypes: true })
			.sort((left, right) => left.name.localeCompare(right.name));
		for (const entry of entries) {
			const entryPath = path.join(directory, entry.name);
			if (entry.isSymbolicLink()) {
				throw new Error(`${label} contains a symbolic link: ${entryPath}`);
			}
			if (entry.isDirectory()) {
				visit(entryPath);
				continue;
			}
			if (entry.isFile()) files.push(entryPath);
		}
	}
	visit(absolutePath);
	return files;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function listGlobMatches(root, relativePattern) {
	const normalized = normalizeRelativePath(relativePattern, "source glob");
	const segments = normalized.split("/");
	const firstWildcard = segments.findIndex((segment) => segment.includes("*"));
	const prefixSegments = firstWildcard < 0 ? segments.slice(0, -1) : segments.slice(0, firstWildcard);
	const prefix = prefixSegments.join("/");
	const pattern = new RegExp(`^${escapeRegExp(normalized).replaceAll("\\*", "[^/]*")}$`, "u");
	const searchRoot = prefix
		? resolveWorkspacePath(root, prefix, "source glob root").absolutePath
		: canonicalizeWorkspaceRoot(root);
	const rootStats = tryLstat(searchRoot);
	if (!rootStats) return [];
	if (!rootStats.isDirectory()) {
		throw new Error(`source glob root must be a directory: ${prefix || "."}`);
	}

	const matches = [];
	function visit(directory) {
		const entries = readdirSync(directory, { withFileTypes: true })
			.sort((left, right) => left.name.localeCompare(right.name));
		for (const entry of entries) {
			const entryPath = path.join(directory, entry.name);
			const relativePath = path.relative(root, entryPath).split(path.sep).join("/");
			if (entry.isSymbolicLink()) {
				if (pattern.test(relativePath)) {
					throw new Error(`source path contains a symbolic link: ${relativePath}`);
				}
				continue;
			}
			if (entry.isDirectory()) {
				visit(entryPath);
				continue;
			}
			if (entry.isFile() && pattern.test(relativePath)) matches.push(relativePath);
		}
	}
	visit(searchRoot);
	return matches.sort((left, right) => left.localeCompare(right));
}

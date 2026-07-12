"use strict";

const path = require("node:path");

const { resolveLlmWikiPaths } = require("./qmd");

const MEMORY_EXPLORER_SNAPSHOT_CACHE_LIMIT = 8;
const memoryExplorerSnapshotCache = new Map();
const memoryExplorerRootRevisions = new Map();

function getMemoryExplorerCacheKey({ includeLinkedKnowledge, revision, rootDir }) {
	return [
		path.resolve(rootDir),
		includeLinkedKnowledge ? "linked" : "memory",
		revision,
	].join("\0");
}

function getCachedMemoryExplorerSnapshot(cacheKey) {
	const cached = memoryExplorerSnapshotCache.get(cacheKey);
	if (!cached) {
		return null;
	}

	memoryExplorerSnapshotCache.delete(cacheKey);
	memoryExplorerSnapshotCache.set(cacheKey, cached);
	return cached;
}

function setCachedMemoryExplorerSnapshot(cacheKey, snapshotPromise) {
	memoryExplorerSnapshotCache.set(cacheKey, snapshotPromise);
	while (memoryExplorerSnapshotCache.size > MEMORY_EXPLORER_SNAPSHOT_CACHE_LIMIT) {
		const oldestKey = memoryExplorerSnapshotCache.keys().next().value;
		if (!oldestKey) {
			break;
		}
		memoryExplorerSnapshotCache.delete(oldestKey);
	}
}

function deleteCachedMemoryExplorerSnapshot(cacheKey) {
	memoryExplorerSnapshotCache.delete(cacheKey);
}

function getMemoryExplorerRootRevision(rootDir) {
	return memoryExplorerRootRevisions.get(rootDir) ?? 0;
}

function incrementMemoryExplorerRootRevision(rootDir) {
	const nextRevision = getMemoryExplorerRootRevision(rootDir) + 1;
	memoryExplorerRootRevisions.set(rootDir, nextRevision);
	return nextRevision;
}

function invalidateWikiMemoryExplorerCache({ wikiDir } = {}) {
	if (!wikiDir) {
		for (const rootDir of memoryExplorerRootRevisions.keys()) {
			incrementMemoryExplorerRootRevision(rootDir);
		}
		memoryExplorerSnapshotCache.clear();
		return;
	}

	const paths = resolveLlmWikiPaths({ wikiDir });
	const rootDir = path.resolve(paths.rootDir);
	incrementMemoryExplorerRootRevision(rootDir);
	const rootPrefix = `${rootDir}\0`;
	for (const cacheKey of memoryExplorerSnapshotCache.keys()) {
		if (cacheKey.startsWith(rootPrefix)) {
			memoryExplorerSnapshotCache.delete(cacheKey);
		}
	}
}

module.exports = {
	deleteCachedMemoryExplorerSnapshot,
	getCachedMemoryExplorerSnapshot,
	getMemoryExplorerCacheKey,
	getMemoryExplorerRootRevision,
	invalidateWikiMemoryExplorerCache,
	setCachedMemoryExplorerSnapshot,
};

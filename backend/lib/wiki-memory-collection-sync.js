"use strict";

// The QMD search index is backed by better-sqlite3, whose native binding is
// intentionally not built in this repo (see `ignoredBuiltDependencies` and the
// `allowBuilds` -> `better-sqlite3: false` entry in pnpm-workspace.yaml). The
// durable memory itself lives in markdown, so a memory reset/delete must still
// succeed even when the search index cannot be refreshed. This module wraps the
// index-refresh step so those failures degrade to a warning instead of failing
// the whole mutation. The index can be rebuilt later with
// `pnpm run qmd:sync-wiki`.

function isMissingNativeBindingError(error) {
	const message = error instanceof Error ? error.message : String(error ?? "");
	return (
		/Could not locate the bindings file/iu.test(message) ||
		/better_sqlite3\.node/iu.test(message) ||
		(Boolean(error) && error.code === "MODULE_NOT_FOUND" && /better-sqlite3/iu.test(message))
	);
}

/**
 * Build the `qmdSyncImpl` callback passed into wiki memory mutations
 * (reset, block delete, proposal delete). The returned function refreshes the
 * QMD search index for a single collection but never throws: index-refresh
 * failures are logged and swallowed so the underlying markdown mutation (which
 * has already been applied) is reported as successful.
 *
 * @param {object} options
 * @param {(input: { collectionNames: string[], logger: object, wikiDir?: string }) => Promise<unknown>} options.syncWikiQmdIndex
 * @param {object} [options.logger]
 * @returns {(input: { collectionName?: string, wikiDir?: string }) => Promise<void>}
 */
function createWikiMemoryCollectionSync({ syncWikiQmdIndex, logger = console } = {}) {
	if (typeof syncWikiQmdIndex !== "function") {
		throw new TypeError("createWikiMemoryCollectionSync requires a syncWikiQmdIndex function");
	}

	return async function syncWikiMemoryCollection({ collectionName, wikiDir } = {}) {
		if (!collectionName) {
			return;
		}

		try {
			await syncWikiQmdIndex({
				collectionNames: [collectionName],
				logger,
				wikiDir,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (isMissingNativeBindingError(error)) {
				logger.warn?.(
					`[wiki-memory] Skipped QMD index refresh for collection "${collectionName}": ` +
						"the better-sqlite3 native binding is unavailable in this environment. " +
						"Memory changes were still applied; run `pnpm run qmd:sync-wiki` to rebuild the search index. " +
						`(${message})`,
				);
				return;
			}
			logger.warn?.(
				`[wiki-memory] QMD index refresh failed for collection "${collectionName}"; ` +
					`memory changes were still applied. (${message})`,
			);
		}
	};
}

module.exports = {
	createWikiMemoryCollectionSync,
	isMissingNativeBindingError,
};

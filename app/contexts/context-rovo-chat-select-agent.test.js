const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CONTEXT_SOURCE = fs.readFileSync(
	path.join(__dirname, "context-rovo-chat.tsx"),
	"utf8",
);
const RECENT_AGENTS_SOURCE = fs.readFileSync(
	path.join(
		process.cwd(),
		"components/projects/studio/lib/studio-sidebar-recent-agents.ts",
	),
	"utf8",
);

// Extract the body of the `selectAgent = useCallback(...)` declaration so we can
// assert on what selecting an agent does, without false positives from other
// callers of `touchSessionAgent` elsewhere in the file.
function getSelectAgentBody(source) {
	const start = source.indexOf("const selectAgent = useCallback(");
	assert.notEqual(start, -1, "expected a selectAgent useCallback declaration");
	// The callback body ends where the dependency array begins: `}, [deps]);`.
	const end = source.indexOf("}, [", start);
	assert.notEqual(end, -1, "expected selectAgent dependency array terminator");
	return source.slice(start, end);
}

test("recent-agents nav list is ordered by lastTouchedAt (the pin signal)", () => {
	// Guards the assumption behind this regression: "highest" is purely emergent
	// from sorting by lastTouchedAt desc. If this changes, revisit selectAgent.
	assert.match(
		RECENT_AGENTS_SOURCE,
		/second\.lastTouchedAt - first\.lastTouchedAt/u,
	);
});

test("selecting an agent does not bump lastTouchedAt (no pin-to-top on click)", () => {
	const selectAgentBody = getSelectAgentBody(CONTEXT_SOURCE);

	// The bug: selectAgent called touchSessionAgent, which sets lastTouchedAt to
	// Date.now() and re-sorts the clicked agent to the top of the nav list.
	// Selection must not reorder the list, so selectAgent must not touch it.
	assert.doesNotMatch(
		selectAgentBody,
		/touchSessionAgent/u,
		"selectAgent must not call touchSessionAgent — that pins the selected agent to the top of the recent-agents list",
	);

	// Selection identity is still tracked, just without reordering.
	assert.match(selectAgentBody, /setSelectedAgentIdState\(nextAgent\.id\)/u);
});

test("touchSessionAgent still exists for intentional bumps (create/edit/test/publish)", () => {
	// Sanity check: the previous test passes for the right reason. The helper is
	// still defined and still bumps lastTouchedAt — it just isn't called on select.
	assert.match(CONTEXT_SOURCE, /const touchSessionAgent = useCallback\(/u);
	assert.match(CONTEXT_SOURCE, /lastTouchedAt: Date\.now\(\)/u);
});

test("session-agent publishing increments metadata and records version history", () => {
	assert.match(CONTEXT_SOURCE, /export interface StudioAgentVersionRecord/u);
	assert.match(CONTEXT_SOURCE, /version: number;/u);
	assert.match(CONTEXT_SOURCE, /publishedVersion: number;/u);
	assert.match(CONTEXT_SOURCE, /lastPublishedAt: number \| null;/u);
	assert.match(CONTEXT_SOURCE, /versionHistory: readonly StudioAgentVersionRecord\[\];/u);
	assert.match(CONTEXT_SOURCE, /const versionKind: StudioAgentVersionRecord\["kind"\] = existing\.publishedResult \? "update" : "publish";/u);
	assert.match(CONTEXT_SOURCE, /const nextPublishedVersion = existing\.publishedResult[\s\S]*\? Math\.max\(existing\.publishedVersion, 1\) \+ 1[\s\S]*: 1;/u);
	assert.match(CONTEXT_SOURCE, /version: nextPublishedVersion/u);
	assert.match(CONTEXT_SOURCE, /publishedVersion: nextPublishedVersion/u);
	assert.match(CONTEXT_SOURCE, /versionHistory: \[versionRecord, \.\.\.existing\.versionHistory\]/u);
});

test("session-agent rollback restores a historical snapshot into the draft only", () => {
	assert.match(CONTEXT_SOURCE, /restoreSessionAgentVersion: \(profileId: string, versionId: string\) => StudioSessionAgentEntry \| null;/u);
	assert.match(CONTEXT_SOURCE, /const restoreSessionAgentVersion = useCallback/u);
	assert.match(CONTEXT_SOURCE, /const restoredDraft = normalizeSessionAgentResult\(version\.snapshot\);/u);
	assert.match(CONTEXT_SOURCE, /draftResult: restoredDraft/u);
	assert.match(CONTEXT_SOURCE, /versionHistory: \[rollbackRecord, \.\.\.existing\.versionHistory\]/u);
	assert.doesNotMatch(
		CONTEXT_SOURCE.slice(
			CONTEXT_SOURCE.indexOf("const restoreSessionAgentVersion = useCallback"),
			CONTEXT_SOURCE.indexOf("const resetAgentToRovo = useCallback"),
		),
		/publishedResult: restoredDraft/u,
	);
});

test("session-agent autosave is debounced instead of writing on every draft change", () => {
	assert.match(CONTEXT_SOURCE, /const STUDIO_SESSION_AGENT_SAVE_DEBOUNCE_MS = 900;/u);
	assert.match(CONTEXT_SOURCE, /const sessionAgentSaveTimerRef = useRef<ReturnType<typeof setTimeout> \| null>\(null\);/u);
	assert.match(CONTEXT_SOURCE, /clearTimeout\(sessionAgentSaveTimerRef\.current\);/u);
	assert.match(CONTEXT_SOURCE, /sessionAgentSaveTimerRef\.current = setTimeout\(\(\) => \{[\s\S]*persistSessionAgentEntries\(sessionAgentEntriesRef\.current\.map\(normalizeSessionAgentEntry\)\)[\s\S]*\}, STUDIO_SESSION_AGENT_SAVE_DEBOUNCE_MS\);/u);
});

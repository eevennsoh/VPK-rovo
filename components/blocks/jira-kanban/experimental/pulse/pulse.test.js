/**
 * Pulse — the experimental Kanban's timeline mode.
 *
 * Pulse is one continuous article: every insight is on the page at once and the
 * reader scrolls through them, with the ruler on the left as the document's
 * outline. That reshaped what this suite can execute. `usePulseTimeline` no
 * longer owns a snapshot index or a member filter, and it no longer carries the
 * whole mounted snapshot — the position belongs to `usePulseReading`, the filter
 * to `usePulseMemberFilter`, and the per-insight scoping to the article, which
 * derives it for all seven. Tests that used to drive `goToNext`/`goToIndex` or
 * read `host.current.artifacts` say so where they changed.
 *
 * The contracts worth protecting are behavioural, so they are executed rather
 * than grepped: the hooks' derivations run for real against the fixture.
 * Source-level assertions are reserved for what cannot be executed in
 * Node — that the default variant stays free of Pulse, that every animating file
 * carries explicit reduced-motion handling, and that the article composes the
 * same pure helpers rather than a second definition of "scoped".
 *
 * The outline that both the ruler and the article are built from lives in
 * `pulse-outline.test.js`; the ruler's own drawing and pointer gesture live in
 * `pulse-scrubber.test.js`; the fixture is walked in `pulse-fixture.test.js`.
 */

const { test } = require("node:test");

const {
	assert,
	DEFAULT_BOARD_SOURCE,
	DEFAULT_HEADER_SOURCE,
	DEFAULT_PAGE_SOURCE,
	existsSync,
	EXPERIMENTAL_DIR,
	EXPERIMENTAL_HEADER_SOURCE,
	EXPERIMENTAL_PAGE_SOURCE,
	PULSE_MODE_CONTROLS_SOURCE,
	findSnapshotIndex,
	join,
	loadRosterMarkupHarness,
	loadTimelineHarness,
	PULSE_DIR,
	readdirSync,
	readFileSync,
	relative,
	snapshotAt,
	SOURCES,
} = require("./pulse-test-harness");

test("Pulse index clamping tolerates empty, fractional, and out-of-range input", async () => {
	const { clampSnapshotIndex } = await loadTimelineHarness();

	assert.equal(clampSnapshotIndex(0, 0), 0);
	assert.equal(clampSnapshotIndex(4, 0), 0);
	assert.equal(clampSnapshotIndex(Number.NaN, 7), 0);
	assert.equal(clampSnapshotIndex(Number.POSITIVE_INFINITY, 7), 0);
	assert.equal(clampSnapshotIndex(-3, 7), 0);
	assert.equal(clampSnapshotIndex(99, 7), 6);
	assert.equal(clampSnapshotIndex(2.8, 7), 2);
});

test("Pulse scoping helpers keep snapshot order and drop everything outside the scope", async () => {
	const {
		resolveLooseWork,
		resolveWorkItems,
		scopeArtifacts,
		scopeByWorkItem,
	} = await loadTimelineHarness();
	const workItems = [{ key: "PAY-1" }, { key: "PAY-2" }, { key: "PAY-3" }];
	const looseWork = [{ id: "lw-a" }, { id: "lw-b" }];

	assert.deepEqual(
		resolveWorkItems(workItems, ["PAY-3", "PAY-1"], null).map((item) => item.key),
		["PAY-3", "PAY-1"],
	);
	assert.deepEqual(
		resolveWorkItems(workItems, ["PAY-3", "PAY-1"], new Set(["PAY-1"])).map((item) => item.key),
		["PAY-1"],
	);
	// An unresolvable key is dropped rather than rendered as a hole.
	assert.deepEqual(resolveWorkItems(workItems, ["PAY-404"], null), []);
	assert.deepEqual(resolveLooseWork(looseWork, ["lw-b"], null).map((item) => item.id), ["lw-b"]);
	assert.deepEqual(resolveLooseWork(looseWork, ["lw-b"], new Set(["lw-a"])), []);
	assert.deepEqual(scopeArtifacts([{ id: "a1" }, { id: "a2" }], new Set(["a2"])).map((a) => a.id), ["a2"]);
	assert.deepEqual(scopeArtifacts([{ id: "a1" }], null).map((a) => a.id), ["a1"]);
	// Scoped signals hang off a work item; a keyless entry is nobody's to answer for.
	assert.deepEqual(
		scopeByWorkItem([{ id: "s1", workItemKey: "PAY-1" }, { id: "s2" }], new Set(["PAY-1"])).map((s) => s.id),
		["s1"],
	);
	assert.deepEqual(
		scopeByWorkItem([{ id: "s1", workItemKey: "PAY-1" }, { id: "s2" }], null).map((s) => s.id),
		["s1", "s2"],
	);
});

test("Pulse highlights exactly the snapshots a member was active in", async () => {
	const { computeHighlightedIndexes, PULSE_TIMELINE } = await loadTimelineHarness();
	const { snapshots } = PULSE_TIMELINE;

	assert.deepEqual(
		[...computeHighlightedIndexes(snapshots, null)],
		snapshots.map((_, index) => index),
		"an unfiltered timeline highlights every snapshot",
	);

	for (const member of PULSE_TIMELINE.members) {
		const expected = snapshots
			.map((snapshot, index) => (snapshot.memberIds.includes(member.id) ? index : null))
			.filter((index) => index !== null);
		assert.deepEqual([...computeHighlightedIndexes(snapshots, member.id)], expected, member.id);
		assert.ok(expected.length > 0, `${member.id} is never active, so the roster row is dead weight`);
		assert.ok(
			expected.length < snapshots.length,
			`${member.id} is active in every snapshot, which makes the muted-tick affordance invisible`,
		);
	}

	assert.deepEqual([...computeHighlightedIndexes(snapshots, "nobody")], []);
});

test("Pulse clamps the reading position it is handed instead of owning one", async () => {
	const { mountPulse, PULSE_TIMELINE } = await loadTimelineHarness();
	const host = mountPulse();
	const last = PULSE_TIMELINE.snapshots.length - 1;

	// This used to assert `goToNext`/`goToPrevious`/`goToIndex` clamping at both
	// ends of a committed index the hook owned. The article is one continuous
	// document now: `usePulseReading` owns the position, the reader moves it by
	// scrolling, and there is no step gesture left to clamp. What survives is the
	// hook's duty to never index past the end of a position handed in from
	// outside — a filter can shorten the outline mid-frame, and a reading line
	// sitting in the runway below the last insight reports past the end.
	assert.equal(typeof host.current.goToIndex, "undefined", "the hook must not own navigation any more");
	assert.equal(typeof host.current.goToNext, "undefined");
	assert.equal(typeof host.current.goToPrevious, "undefined");

	assert.equal(host.current.activeIndex, 0);
	assert.equal(host.current.total, PULSE_TIMELINE.snapshots.length);
	assert.equal(host.current.activeSnapshot.id, PULSE_TIMELINE.snapshots[0].id);

	host.read(1);
	assert.equal(host.current.activeIndex, 1);
	assert.equal(host.current.activeSnapshot.id, PULSE_TIMELINE.snapshots[1].id);

	host.read(99);
	assert.equal(host.current.activeIndex, last, "a position past the end clamps to the last insight");
	assert.equal(host.current.activeSnapshot.id, PULSE_TIMELINE.snapshots[last].id);

	host.read(-4);
	assert.equal(host.current.activeIndex, 0, "a position above the top clamps to the first insight");

	host.read(Number.NaN);
	assert.equal(host.current.activeIndex, 0, "an unmeasured position must not render a hole");

	host.read(3);
	assert.equal(host.current.activeIndex, 3);
	assert.equal(host.current.activeSnapshot.id, PULSE_TIMELINE.snapshots[3].id);
});

/**
 * Executable text only.
 *
 * Several Pulse files name a retired mechanism in a comment in order to record
 * that it was deleted and why. A ban on the mechanism has to read the code, not
 * the note explaining its absence. URLs inside string literals lose their tail
 * to the line-comment rule, which can only ever remove text from a scan.
 */
function withoutComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\/\/[^\n]*/gu, "");
}

/**
 * One insight, scoped the way the article scopes it.
 *
 * `pulse-stream.tsx` renders all seven insights at once, so it derives this for
 * every snapshot rather than only for the one being read. It composes the
 * derivation from the timeline hook's exported pure helpers instead of growing
 * a second definition of "scoped"; this is the same composition, executed. The
 * stream does not export its own `toStreamEntries`, so a source assertion in
 * "Pulse scopes every insight in the article" pins it to these helpers.
 */
function scopeInsight(helpers, timeline, snapshot, memberId) {
	const contribution = helpers.findContribution(snapshot, memberId);
	const workItemScope = memberId === null ? null : new Set(contribution?.workItemKeys ?? []);
	const artifactScope = memberId === null ? null : new Set(contribution?.artifactIds ?? []);
	const looseWorkScope = memberId === null ? null : new Set(contribution?.looseWorkIds ?? []);
	return {
		artifacts: helpers.scopeArtifacts(snapshot.artifacts, artifactScope),
		attention: helpers.scopeByWorkItem(snapshot.attention, workItemScope),
		contribution,
		looseWork: helpers.resolveLooseWork(timeline.looseWork, snapshot.looseWorkIds, looseWorkScope),
		nextActions: helpers.scopeByWorkItem(snapshot.nextActions, workItemScope),
		workItems: helpers.resolveWorkItems(timeline.workItems, snapshot.workItemKeys, workItemScope),
	};
}

test("Pulse shows every insight whole while no member filter is on", async () => {
	const harness = await loadTimelineHarness();
	const { mountPulse, PULSE_TIMELINE } = harness;
	const host = mountPulse();
	const index = findSnapshotIndex(PULSE_TIMELINE, "s1-kickoff");
	host.read(index);
	const snapshot = snapshotAt(PULSE_TIMELINE, index);

	// The model narrowed when the article became continuous: it used to carry the
	// whole mounted snapshot — artifacts, signals, actions, stats, contributors.
	// Those are per-insight now and belong to the article, which renders seven of
	// them; what is left here is the two work columns beside it, the ruler's
	// muting, and the empty state.
	assert.equal(host.current.isFiltered, false);
	assert.equal(host.current.selectedMemberId, null);
	assert.equal(host.current.selectedMember, null);
	assert.deepEqual(host.current.workItems.map((item) => item.key), [...snapshot.workItemKeys]);
	assert.deepEqual(host.current.looseWork.map((item) => item.id), [...snapshot.looseWorkIds]);

	// And unfiltered, every insight in the article is whole — not just the one
	// the reader happens to be on.
	for (const entry of PULSE_TIMELINE.snapshots) {
		const scoped = scopeInsight(harness, PULSE_TIMELINE, entry, null);
		assert.equal(scoped.contribution, null, `${entry.id} narrates a member with no filter on`);
		assert.deepEqual(scoped.workItems.map((item) => item.key), [...entry.workItemKeys], entry.id);
		assert.deepEqual(scoped.looseWork.map((item) => item.id), [...entry.looseWorkIds], entry.id);
		assert.deepEqual(scoped.artifacts.map((item) => item.id), entry.artifacts.map((item) => item.id), entry.id);
		assert.deepEqual(scoped.attention.map((item) => item.id), entry.attention.map((item) => item.id), entry.id);
		assert.deepEqual(scoped.nextActions.map((item) => item.id), entry.nextActions.map((item) => item.id), entry.id);
	}
});

test("Pulse member filter narrows work items, artifacts, loose work and signals", async () => {
	const harness = await loadTimelineHarness();
	const { mountPulse, PULSE_TIMELINE } = harness;
	const host = mountPulse();
	const index = findSnapshotIndex(PULSE_TIMELINE, "s1-kickoff");
	host.read(index);
	const snapshot = snapshotAt(PULSE_TIMELINE, index);
	const unscopedWorkItems = host.current.workItems.length;

	host.current.selectMember("maya");
	const contribution = snapshot.contributions.find((entry) => entry.memberId === "maya");
	const scoped = scopeInsight(harness, PULSE_TIMELINE, snapshot, "maya");

	assert.equal(host.current.isFiltered, true);
	assert.equal(host.current.selectedMemberId, "maya");
	assert.equal(host.current.selectedMember.name, "Maya Ferreira");
	assert.equal(scoped.contribution, contribution);
	assert.deepEqual(
		host.current.workItems.map((item) => item.key),
		snapshot.workItemKeys.filter((key) => contribution.workItemKeys.includes(key)),
	);
	assert.deepEqual(
		host.current.looseWork.map((item) => item.id),
		snapshot.looseWorkIds.filter((id) => contribution.looseWorkIds.includes(id)),
	);
	assert.deepEqual(
		scoped.artifacts.map((item) => item.id),
		snapshot.artifacts.map((item) => item.id).filter((id) => contribution.artifactIds.includes(id)),
	);
	assert.ok(host.current.workItems.length > 0, "Maya moved work in the kickoff window");
	assert.ok(host.current.workItems.length < unscopedWorkItems, "scoping must remove something");
	assert.ok(scoped.artifacts.length < snapshot.artifacts.length, "scoping must remove something");
	scoped.attention.forEach((signal) => {
		assert.ok(contribution.workItemKeys.includes(signal.workItemKey), signal.id);
	});
	scoped.nextActions.forEach((action) => {
		assert.ok(contribution.workItemKeys.includes(action.workItemKey), action.id);
	});
});

test("Pulse scopes every insight in the article, not only the one being read", async () => {
	const harness = await loadTimelineHarness();
	const { PULSE_TIMELINE } = harness;

	// The property the continuous article added: a filter rewrites all seven
	// insights at once, because all seven are on the page. Nothing may leak the
	// team's work into a scoped page, at any scroll position.
	for (const member of PULSE_TIMELINE.members) {
		let scopedSomething = false;
		for (const snapshot of PULSE_TIMELINE.snapshots) {
			const scoped = scopeInsight(harness, PULSE_TIMELINE, snapshot, member.id);
			const contribution = snapshot.contributions.find((entry) => entry.memberId === member.id) ?? null;
			assert.equal(scoped.contribution, contribution, `${snapshot.id}/${member.id}`);
			for (const item of scoped.workItems) {
				assert.ok(contribution?.workItemKeys.includes(item.key), `${snapshot.id} leaked ${item.key} to ${member.id}`);
			}
			for (const item of scoped.artifacts) {
				assert.ok(contribution?.artifactIds.includes(item.id), `${snapshot.id} leaked ${item.id} to ${member.id}`);
			}
			for (const item of scoped.looseWork) {
				assert.ok(contribution?.looseWorkIds.includes(item.id), `${snapshot.id} leaked ${item.id} to ${member.id}`);
			}
			scopedSomething ||= scoped.workItems.length > 0;
		}
		assert.ok(scopedSomething, `${member.id} scopes the whole article to nothing`);
	}

	// The stream composes exactly these helpers over every snapshot rather than
	// redefining what "scoped" means for the six insights the model does not see.
	assert.match(SOURCES.stream, /return timeline\.snapshots\.map\(\(snapshot, index\) => \{/u);
	assert.match(SOURCES.stream, /const contribution = findContribution\(snapshot, memberId\);/u);
	assert.match(SOURCES.stream, /artifacts: scopeArtifacts\(snapshot\.artifacts, artifactScope\),/u);
	assert.match(SOURCES.stream, /attention: scopeByWorkItem\(snapshot\.attention, workItemScope\),/u);
	assert.match(SOURCES.stream, /nextActions: scopeByWorkItem\(snapshot\.nextActions, workItemScope\),/u);
});

test("Pulse scopes a quiet member to nothing instead of showing the team's work", async () => {
	const harness = await loadTimelineHarness();
	const { mountPulse, PULSE_TIMELINE } = harness;
	const host = mountPulse();
	const index = findSnapshotIndex(PULSE_TIMELINE, "s4-night-shift");
	const snapshot = snapshotAt(PULSE_TIMELINE, index);
	assert.equal(snapshot.memberIds.includes("maya"), false, "the night shift is the agents-only window");

	host.read(index);
	host.current.selectMember("maya");
	const scoped = scopeInsight(harness, PULSE_TIMELINE, snapshot, "maya");

	assert.equal(scoped.contribution, null);
	assert.deepEqual(host.current.workItems, []);
	assert.deepEqual(host.current.looseWork, []);
	assert.deepEqual(scoped.artifacts, []);
	assert.deepEqual(scoped.attention, []);
	assert.deepEqual(scoped.nextActions, []);
	// The header facepile still lists her, never disabled, because a quiet night
	// is information — and the faces on the insight itself carry only the members
	// active in it, so absence from that row is the signal.
	assert.equal(snapshot.memberIds.includes("maya"), false);
	assert.equal(host.current.members.some((member) => member.id === "maya"), true);
	assert.equal(host.current.highlightedIndexes.has(index), false);
});

test("Pulse member selection survives reading on and clears on demand", async () => {
	const { mountPulse, PULSE_TIMELINE } = await loadTimelineHarness();
	const host = mountPulse();

	host.current.selectMember("review-agent");
	assert.equal(host.current.selectedMemberId, "review-agent");

	// Scrubbing was a commit; reading on is just a new position. Either way the
	// filter is the reader's standing choice and must outlive it.
	host.read(2);
	assert.equal(host.current.activeIndex, 2);
	assert.equal(host.current.selectedMemberId, "review-agent", "moving through the article must not clear the filter");
	assert.equal(host.current.isFiltered, true);
	assert.equal(host.current.selectedMember.name, "Review Agent");
	assert.deepEqual(
		[...host.current.highlightedIndexes],
		PULSE_TIMELINE.snapshots
			.map((snapshot, index) => (snapshot.memberIds.includes("review-agent") ? index : null))
			.filter((index) => index !== null),
	);

	host.read(0);
	assert.equal(host.current.selectedMemberId, "review-agent");

	host.current.selectMember(null);
	assert.equal(host.current.isFiltered, false);
	assert.equal(host.current.selectedMemberId, null);
	assert.equal(host.current.activeIndex, 0, "clearing the filter must not move the reading position by itself");
	assert.deepEqual(
		host.current.workItems.map((item) => item.key),
		[...snapshotAt(PULSE_TIMELINE, 0).workItemKeys],
	);

	// An id nobody owns is treated as no filter at all rather than an empty view.
	host.current.selectMember("ghost");
	assert.equal(host.current.isFiltered, false);
	assert.equal(host.current.selectedMember, null);
	assert.ok(host.current.workItems.length > 0);

	// The article is re-keyed on the selected id, so a filter change restarts the
	// document from the top instead of stranding the reader at an offset that now
	// points at different prose. That reset is `usePulseReading`'s, and the shell
	// is what wires the two together.
	assert.match(SOURCES.shell, /usePulseReading\(\{ outline, resetKey: filter\.selectedMemberId \}\)/u);
});

test("Pulse answers what a member did across the whole week, not just this window", async () => {
	const { computeMemberWeek, PULSE_TIMELINE } = await loadTimelineHarness();
	const { snapshots } = PULSE_TIMELINE;

	// The rail used to swap its window block for this week block while a filter
	// was on, and the hook handed the aggregate over. The rail no longer renders
	// it and the model no longer carries it, so the last assertion here — that
	// `host.current.memberWeek` matched — is gone. The function is still exported
	// and still correct; it is currently consumed by nothing, and should either
	// find a home on the scoped insight or be deleted outright. Keeping the
	// coverage means whichever happens is a deliberate decision rather than a
	// silent one.
	assert.equal(computeMemberWeek(snapshots, null), null, "no filter means no member week");

	for (const member of PULSE_TIMELINE.members) {
		const week = computeMemberWeek(snapshots, member.id);
		const expectedWindows = snapshots.filter((snapshot) => snapshot.memberIds.includes(member.id)).length;
		const expectedItems = new Set();
		const expectedLoose = new Set();
		let expectedArtifacts = 0;
		for (const snapshot of snapshots) {
			const contribution = snapshot.contributions.find((entry) => entry.memberId === member.id);
			if (contribution === undefined) {
				continue;
			}
			expectedArtifacts += contribution.artifactIds.length;
			contribution.workItemKeys.forEach((key) => expectedItems.add(key));
			contribution.looseWorkIds.forEach((id) => expectedLoose.add(id));
		}

		assert.equal(week.totalWindows, snapshots.length, member.id);
		assert.equal(week.windowsActive, expectedWindows, member.id);
		assert.equal(week.workItems, expectedItems.size, member.id);
		assert.equal(week.artifacts, expectedArtifacts, member.id);
		assert.equal(week.looseWork, expectedLoose.size, member.id);
		// The aggregate has to be a week, not a restatement of one window.
		assert.ok(week.windowsActive > 1, `${member.id} cannot demonstrate a week`);
		assert.ok(week.windowsActive < week.totalWindows, `${member.id} is never quiet`);
	}
});

test("Pulse offers a quiet member the nearest windows they were active in", async () => {
	const { findAdjacentActiveIndexes, PULSE_TIMELINE } = await loadTimelineHarness();
	const { snapshots } = PULSE_TIMELINE;
	const nightShift = findSnapshotIndex(PULSE_TIMELINE, "s4-night-shift");
	const mayaWindows = snapshots
		.map((snapshot, index) => (snapshot.memberIds.includes("maya") ? index : null))
		.filter((index) => index !== null);

	assert.deepEqual(findAdjacentActiveIndexes(snapshots, null, 3), { next: null, previous: null });

	const around = findAdjacentActiveIndexes(snapshots, "maya", nightShift);
	assert.equal(around.previous, Math.max(...mayaWindows.filter((index) => index < nightShift)));
	assert.equal(around.next, Math.min(...mayaWindows.filter((index) => index > nightShift)));
	assert.notEqual(around.previous, null);
	assert.notEqual(around.next, null);

	// The way out used to be computed once, for the mounted snapshot, and read
	// off the model as `previousActiveIndex`/`nextActiveIndex`. Every quiet page
	// in the article needs its own pair now, so the stream computes them per
	// insight and turns each into a labelled jump the ruler's own scroll performs.
	assert.match(SOURCES.stream, /const adjacent = findAdjacentActiveIndexes\(timeline\.snapshots, memberId, index\);/u);
	assert.match(SOURCES.stream, /nextActive: toJump\(timeline\.snapshots, adjacent\.next\),/u);
	assert.match(SOURCES.stream, /previousActive: toJump\(timeline\.snapshots, adjacent\.previous\),/u);
	assert.match(SOURCES.stream, /onGoToIndex=\{onGoToSnapshot\}/u);
	assert.match(SOURCES.story, /onClick=\{\(\) => onGoToIndex\(previousActive\.index\)\}/u);
	assert.match(SOURCES.story, /onClick=\{\(\) => onGoToIndex\(nextActive\.index\)\}/u);
});

test("Pulse keeps the unscoped window counts so an emptied section can say what it hides", async () => {
	const harness = await loadTimelineHarness();
	const { PULSE_TIMELINE } = harness;
	const index = findSnapshotIndex(PULSE_TIMELINE, "s4-night-shift");
	const snapshot = snapshotAt(PULSE_TIMELINE, index);
	const scoped = scopeInsight(harness, PULSE_TIMELINE, snapshot, "maya");

	// "Nothing for Maya here — 3 items need attention across the team" only works
	// if the unscoped size survives the scoping. The counts moved from the model
	// to the stream with the sections they describe, and narrowed to the three
	// the story can empty: the work columns beside the article are not part of a
	// scoped page's prose, so they never needed a count.
	assert.deepEqual(scoped.attention, [], "Maya was quiet, so nothing is hers to answer for");
	assert.ok(snapshot.attention.length > 0, "the window itself is not empty");
	assert.match(SOURCES.stream, /unscopedCounts: \{\s*artifacts: snapshot\.artifacts\.length,\s*attention: snapshot\.attention\.length,\s*nextActions: snapshot\.nextActions\.length,\s*\},/u);
	assert.match(SOURCES.story, /toEmptyNote\(firstName, unscopedCounts\.artifacts, "artifact", "artifacts"\)/u);
	assert.match(SOURCES.story, /toEmptyNote\(firstName, unscopedCounts\.attention, "item needs attention", "items need attention"\)/u);
	assert.match(SOURCES.story, /toEmptyNote\(firstName, unscopedCounts\.nextActions, "action", "actions"\)/u);
	assert.match(SOURCES.story, /Nothing here for \$\{firstName\}, and nothing for the team either\./u);
});

test("Pulse survives an empty timeline instead of indexing past the end", async () => {
	const { mountPulse, PULSE_TIMELINE } = await loadTimelineHarness();
	const host = mountPulse({ ...PULSE_TIMELINE, snapshots: [] });

	assert.equal(host.current.total, 0);
	assert.equal(host.current.activeIndex, 0);
	assert.equal(host.current.activeSnapshot, null);
	assert.deepEqual(host.current.workItems, []);
	assert.deepEqual(host.current.looseWork, []);

	host.read(4);
	assert.equal(host.current.activeIndex, 0);
	assert.equal(host.current.activeSnapshot, null);

	// A null active snapshot is the shell's empty state, not a blank article.
	assert.match(SOURCES.shell, /if \(pulse\.activeSnapshot === null\) \{/u);
	assert.match(SOURCES.shell, /This timeline has no snapshots yet\./u);
	// And the outline the ruler draws is empty too, so there is nothing to click.
	assert.match(SOURCES.stream, /if \(entries\.length === 0\) \{\s*return null;/u);
});

/* ------------------------------------------------------------------ */
/* Source contracts — what Node cannot execute                          */
/* ------------------------------------------------------------------ */

test("Pulse animation carries explicit reduced-motion handling in every animating file", () => {
	const animating = /AnimatePresence|(?:^|[\s"'`])motion\.|transition-\[|transition-(?:all|colors|opacity|transform)|\banimate-/u;
	const reducedMotion = /motion-reduce:|useReducedMotion\(\)/u;
	const files = [];

	function collect(directory) {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const entryPath = join(directory, entry.name);
			if (entry.isDirectory()) {
				collect(entryPath);
				continue;
			}
			if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
				files.push(entryPath);
			}
		}
	}
	collect(PULSE_DIR);

	assert.ok(files.length >= 7, "expected the whole Pulse tree to be scanned");
	const animatingFiles = [];
	for (const file of files) {
		const source = readFileSync(file, "utf8");
		if (!animating.test(source)) {
			continue;
		}
		animatingFiles.push(relative(PULSE_DIR, file));
		assert.match(source, reducedMotion, `${file} animates without reduced-motion handling`);
		// VPK motion tokens do not auto-honour reduced motion, so hardcoded
		// timings would be unreviewable as well as unguarded.
		assert.doesNotMatch(source, /duration-\d|duration-\[|ease-\[/u, `${file} hardcodes a motion value`);
	}
	// Naming the animating owners proves the scan actually reached them. The
	// shell is deliberately absent: it composes, it does not animate. The work
	// columns left the list when the roster moved out of them — nothing in a
	// read-out of cards transitions any more. The stream joined it: the article
	// no longer crossfades between insights, but it does fade the one being read
	// up against its neighbours.
	for (const expected of [
		join("components", "pulse-mode-controls.tsx"),
		join("components", "pulse-scrubber.tsx"),
		join("components", "pulse-story.tsx"),
		join("components", "pulse-stream.tsx"),
	]) {
		assert.ok(animatingFiles.includes(expected), `${expected} was not recognised as animating`);
	}
});

test("Pulse deleted the overscroll state machine rather than keeping it beside the scroll", () => {
	// Continuity between separately mounted snapshots used to be faked with an
	// overscroll gesture: a wheel accumulator, a dwell gate, a momentum lock and
	// a landing window, all in `hooks/use-pulse-scroll.ts` with its own suite.
	// Native scrolling does it better and cannot fight the page, so the hook and
	// its tests are gone. Nothing may quietly grow a second one — two things
	// deciding where the reader is would put the old fight straight back.
	assert.ok(!existsSync(join(PULSE_DIR, "hooks", "use-pulse-scroll.ts")), "the overscroll hook should be deleted, not parked");
	assert.ok(!existsSync(join(PULSE_DIR, "pulse-scroll.test.js")), "its suite should go with it");

	const machinery = /accumulat|dwell|momentum|landingWindow|deltaY|onWheel|wheelDelta/iu;
	for (const [name, source] of Object.entries(SOURCES)) {
		// Comments are stripped first: several files name the machinery in order
		// to record that it was deleted, which is exactly what this suite asks
		// them to do. Only executable text is scanned.
		assert.doesNotMatch(withoutComments(source), machinery, `${name} is rebuilding the overscroll state machine`);
	}
	// One owner for the reading position, and it reads live geometry rather than
	// intercepting the gesture.
	assert.match(SOURCES.shell, /const reading = usePulseReading\(/u);
	assert.equal(SOURCES.shell.match(/usePulseReading\(/gu).length, 1);
	assert.match(SOURCES.shell, /activeIndex: reading\.activeSnapshotIndex,/u);
});

test("Pulse anchors exactly the parts the outline made marks for", () => {
	// The ruler and the article address the same elements by construction: both
	// call `toPulseAnchorId`, and the article decides what is anchored with
	// `toPulseSections` — the same helper `buildPulseOutline` uses to decide what
	// earns a mark. A mark with no anchor scrolls the reader nowhere.
	assert.match(SOURCES.story, /toPulseAnchorId,\s*toPulseSections,/u);
	assert.match(SOURCES.story, /const anchoredSections = new Set\(toPulseSections\(snapshot\)\);/u);
	assert.match(SOURCES.story, /const insightId = toPulseAnchorId\(snapshot\.id\);/u);
	assert.match(SOURCES.story, /id=\{insightId\}\s*ref=\{anchorRef\(insightId\)\}/u);
	for (const section of ["artifacts", "attention", "actions"]) {
		assert.match(
			SOURCES.story,
			new RegExp(`anchored=\\{anchoredSections\\.has\\("${section}"\\)\\}\\s*\\n\\s*id=\\{${section}Id\\}`, "u"),
			`the ${section} section is not anchored the way the outline marks it`,
		);
	}
	// An unanchored part renders identically; it simply gets no wrapper, so the
	// article never carries a dangling id the ruler could point at.
	assert.match(SOURCES.story, /if \(!anchored\) \{\s*return children;/u);
	// The registrar is threaded from the one hook that owns it, unchanged.
	assert.match(SOURCES.shell, /anchorRef=\{reading\.registerAnchor\}/u);
	assert.match(SOURCES.stream, /anchorRef=\{anchorRef\}/u);
});

test("Pulse absorbs sub-pixel jump rounding in the outline, not in the shell", () => {
	// A jump parks its anchor exactly on the reading line and browser scroll
	// rounding then leaves it a hundredth of a pixel short — measured at
	// +0.005px, enough to light the mark above the one just clicked. The shell
	// used to take that hair back with a 1px nudge after every jump, because
	// `toActiveOutlineIndex` counted an anchor as read only at `<= 0`.
	//
	// That threshold now defaults to a pixel, so the correction lives with the
	// arithmetic that needs it and the shell simply passes the handlers through.
	assert.doesNotMatch(SOURCES.shell, /JUMP_SETTLE_PX/u);
	assert.doesNotMatch(SOURCES.shell, /scrollBy\(/u, "the shell no longer corrects the outline's rounding");
	assert.match(SOURCES.shell, /const handleSelectEntry = scrollToEntry;/u);
	assert.match(SOURCES.shell, /const handleGoToSnapshot = scrollToSnapshot;/u);
});

test("Pulse mounts every insight, so nothing crossfades and the position is a treatment", () => {
	// This test used to pin the story's crossfade: `AnimatePresence`,
	// `mode="popLayout"`, a `STORY_ENTER` practical entrance and a shorter
	// `STORY_EXIT` on the exit variant. There is nothing to cross-fade any more —
	// all seven insights are mounted at once and the reader scrolls — so the
	// whole apparatus went with the swap it existed to smooth. Keeping the old
	// assertions would have demanded an animation that can no longer be correct.
	assert.doesNotMatch(SOURCES.story, /AnimatePresence|STORY_ENTER|STORY_EXIT|mode="(?:wait|popLayout)"/u);
	assert.doesNotMatch(SOURCES.story, /(?:^|[\s"'`(<])motion\./u, "no insight enters or leaves, so nothing animates in");
	assert.doesNotMatch(SOURCES.stream, /AnimatePresence|(?:^|[\s"'`(<])motion\./u);

	// What replaced it is a read/unread treatment on a permanently mounted
	// element: the insight being read sits at full strength and its neighbours
	// drop a little quieter. Deliberately shallow — this marks position, it does
	// not gate content, and a reader must still be able to read ahead.
	assert.match(SOURCES.stream, /const SNAPSHOT_READING = "opacity-100";/u);
	assert.match(SOURCES.stream, /const SNAPSHOT_QUIET = "opacity-80";/u);
	assert.match(
		SOURCES.stream,
		/index === activeSnapshotIndex \|\| index === previewEntry\?\.snapshotIndex[\s\S]*\? SNAPSHOT_READING[\s\S]*: SNAPSHOT_QUIET,/u,
	);
	// One property, token timings, and an explicit reduced-motion guard: VPK's
	// duration tokens resolve to literal ms and play regardless of the setting.
	assert.match(
		SOURCES.stream,
		/"min-w-0 transition-opacity duration-medium ease-out-practical motion-reduce:transition-none"/u,
	);

	// Scrolling is the reader's own gesture, so the article must not animate it.
	// A smooth `scroll-behavior` would also lag a frame behind a hover-scrub.
	assert.match(SOURCES.shell, /scrollBehavior: "auto",/u);
	// The jump itself is instant too — set in the reading hook, which owns the
	// only programmatic scroll left now that the shell's settle nudge is gone.
	assert.match(SOURCES.reading, /behavior: "auto", top: offset/u);
});

test("Pulse keeps focus alive through in-place commits, and pins header jumps to the top", () => {
	// The snapshot-swap chevrons are gone with the gesture they drove: the
	// article is scrolled, and the ruler is the primary navigation. The header
	// pair that replaced them jumps by whole insights through the same scroll
	// owner but explicitly selects start alignment, and keeps both buttons
	// mounted at the ends —
	// `aria-disabled={isFirst}`/`{isLast}` rather than a native `disabled` that
	// drops the focused control out of the tab order.
	// The frozen `PulseStoryProps` still describes the stepper; the view type
	// omits that half rather than accepting props nothing can honour, and names
	// the article position separately.
	assert.match(SOURCES.story, /extends Omit<PulseStoryProps, "index" \| "onNext" \| "onPrevious" \| "total"> \{/u);
	assert.match(SOURCES.story, /insightIndex: number;/u);
	assert.match(SOURCES.story, /insightCount: number;/u);
	assert.doesNotMatch(SOURCES.story, /onNext\(|onPrevious\(|onNext=|onPrevious=/u);
	assert.doesNotMatch(SOURCES.story, /disabled=\{index/u);
	assert.match(SOURCES.stream, /insightCount=\{entries\.length\}/u);
	assert.match(SOURCES.stream, /insightIndex=\{index\}/u);
	assert.match(SOURCES.story, /aria-label="Previous insight"/u);
	assert.match(SOURCES.story, /aria-label="Next insight"/u);
	assert.match(SOURCES.story, /aria-disabled=\{isFirst\}/u);
	assert.match(SOURCES.story, /aria-disabled=\{isLast\}/u);
	assert.match(SOURCES.story, /<ChevronUpIcon label="" size="small" \/>/u);
	assert.match(SOURCES.story, /<ChevronDownIcon label="" size="small" \/>/u);
	assert.match(SOURCES.story, /toAdjacentInsightIndex\(insightIndex, insightCount, "previous"\)/u);
	assert.match(SOURCES.story, /toAdjacentInsightIndex\(insightIndex, insightCount, "next"\)/u);
	assert.match(SOURCES.story, /onGoToIndex\(previousIndex, \{ align: "start" \}\)/u);
	assert.match(SOURCES.story, /onGoToIndex\(nextIndex, \{ align: "start" \}\)/u);
	assert.match(SOURCES.reading, /scrollToEntry\(entry\.id, options\)/u);
	assert.match(SOURCES.reading, /Number\.parseFloat\(scrollportStyle\.paddingTop\) \|\| 0/u);
	// Chevron `align: "start"` pins the insight header to the scroller top
	// (plus the 4px focus-ring inset). A reserved fade-band scroll-padding
	// used to jump that row 52px down so a CSS top mask would not cover the
	// buttons — the top fade is an overlay now, so that offset is gone.
	assert.doesNotMatch(SOURCES.shell, /scrollPaddingTop/u);
	assert.doesNotMatch(SOURCES.shell, /buildScrollMaskStyle/u);
	assert.doesNotMatch(SOURCES.shell, /fadeTop: false/u);
	assert.match(SOURCES.shell, /onScroll=\{handleArticleScroll\}/u);
	assert.match(SOURCES.shell, /onScrollEnd=\{handleArticleScrollEnd\}/u);
	assert.match(SOURCES.shell, /showTopScrollMask && isScrollingTowardTop/u);
	assert.match(SOURCES.shell, /showBottomScrollMask && isArticleScrolling/u);
	assert.match(SOURCES.shell, /"opacity-0 transition-opacity motion-reduce:transition-none"/u);
	assert.match(SOURCES.shell, /"visible opacity-100 duration-normal ease-out-practical"/u);
	assert.match(SOURCES.shell, /"invisible duration-fast ease-in"/u);
	assert.match(SOURCES.shell, /data-pulse-article-top-fade=""/u);
	assert.match(SOURCES.shell, /data-pulse-article-bottom-fade=""/u);
	assert.match(SOURCES.shell, /edge="bottom"/u);
	assert.match(SOURCES.shell, /<ScrollMaskEdgeOverlay/u);
	assert.match(SOURCES.story, /size="icon-compact"/u);
	// The jump stays on the header row the reader selected, not a one-off in the
	// shell — the stream only hands the article position down.
	assert.match(
		SOURCES.story,
		/<div className=\{cn\("flex min-h-6 min-w-0 items-center", MEASURE\)\}>[\s\S]*<PulseStoryInsightNav/u,
	);
	assert.doesNotMatch(SOURCES.shell, /Previous insight|Next insight|ChevronUp|ChevronDown/u);
	// Both commit actions keep one element mounted across the state change.
	assert.match(SOURCES.signals, /aria-disabled=\{isRequested\}/u);
	assert.match(SOURCES.signals, /if \(isRequested\) return;/u);
	assert.match(SOURCES.rail, /captured=\{capturedIds\.has\(item\.id\)\}/u);
	assert.match(SOURCES.rail, /onCreateWorkItem=\{\(\) => onCapture\(item\)\}/u);
	assert.doesNotMatch(SOURCES.rail, /aria-disabled|aria-live/u, "the shared Jira Issue variant owns the action contract");

	// Scroll position is not a focus change, so the reading position still needs
	// announcing — but once for the document, not once per insight. Seven live
	// regions on one page would each fire as the reader passed them.
	assert.doesNotMatch(SOURCES.story, /aria-live/u);
	assert.match(SOURCES.stream, /<p aria-live="polite" className="sr-only" role="status">/u);
	assert.match(SOURCES.stream, /Insight \$\{activeSnapshotIndex \+ 1\} of \$\{entries\.length\}/u);
	assert.equal(SOURCES.stream.match(/aria-live/gu).length, 1, "one status for the whole article");
});

test("Pulse styles stay on semantic tokens and never render with a logical AND", () => {
	for (const [name, source] of Object.entries(SOURCES)) {
		assert.doesNotMatch(source, /(?:bg|text|border)-\[var\(--ds-/u, `${name} bypasses the semantic token classes`);
		assert.doesNotMatch(source, /&&\s*</u, `${name} renders with && instead of a ternary`);
		assert.doesNotMatch(source, /forwardRef|useContext\(|\.Provider/u, `${name} uses a pre-React-19 idiom`);
	}
});

test("Pulse keeps a quiet member selectable and lets absence carry the signal", () => {
	// Quiet is a fact about the window, and it survived the roster's move out of
	// the rail. The header facepile carries EVERY member, so a person who had a
	// quiet day is still selectable; the faces above the story carry only the
	// members active in this window, so absence from that row is the signal.
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /members=\{PULSE_TIMELINE\.members\}/u);
	// The contributor faces used to be derived in the shell, from the one mounted
	// snapshot. Every insight carries its own row now, so the derivation moved
	// into the article beside the insight it describes.
	assert.match(SOURCES.stream, /timeline\.members\.filter\(\(candidate\) => snapshot\.memberIds\.includes\(candidate\.id\)\)/u);
	assert.doesNotMatch(SOURCES.shell, /activeMemberIds/u);
	// A hard-disabled face is keyboard-unreachable, which would lock the filter
	// on exactly the snapshot that needs explaining most.
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /aria-pressed=\{isSelected\}/u);
	assert.doesNotMatch(PULSE_MODE_CONTROLS_SOURCE, /disabled=|cursor-not-allowed/u);
	// Clicking the pressed face is the way out of the filter, from either row.
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /onSelectedMemberIdChange\(isSelected \? null : member\.id\)/u);
	assert.match(SOURCES.story, /onSelectMember\(isSelected \? null : member\.id\)/u);
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /aria-label=\{isSelected\s*\?\s*`Clear filter: \$\{member\.name\}`/u);
	// The work columns are a read-out: no tab stop, no drag affordance.
	assert.match(SOURCES.rail, /draggable=\{false\}/u);
	assert.match(SOURCES.rail, /tabIndex=\{-1\}/u);
	// Work-item cards share the experimental board's stroke chrome.
	assert.match(SOURCES.rail, /<JiraIssue[\s\S]*chrome="stroke"/u);
	assert.match(SOURCES.rail, /<JiraIssue[\s\S]*variant="uncaptured-work"/u);
	// Agent assignees on work-item cards reuse the roster hexagon, not a circle photo.
	assert.match(SOURCES.rail, /assigneeAvatarShape=\{assignee\?\.kind === "agent" \? "hexagon" : "circle"\}/u);
	assert.match(SOURCES.rail, /memberLookup\.get\(workItem\.assigneeId\)/u);
});

test("Pulse rail hangs everything off one left edge and one right edge", () => {
	// 776/784/785/789 used to coexist inside a 384px rail. Rows now pad outward
	// into a bleed gutter, and nothing else carries horizontal padding.
	assert.match(SOURCES.rail, /className="flex min-w-0 flex-col gap-3"/u);
	assert.match(
		SOURCES.rail,
		/className="-m-1 grid min-w-0 grid-cols-1 gap-10 p-1 lg:box-content lg:h-full lg:min-h-0 lg:w-\[628px\] lg:shrink-0 lg:grid-cols-\[320px_300px\] lg:gap-2 lg:overflow-y-auto lg:overscroll-y-contain"/u,
	);
	assert.equal([...SOURCES.rail.matchAll(/overflow-y-auto/gu)].length, 1, "the rail parent is the only work scroller");
	// The roster and the window's numbers moved out of the rail entirely; the
	// two columns left do one job each.
	assert.doesNotMatch(SOURCES.rail, /Roster/u);
	assert.doesNotMatch(SOURCES.rail, /PulseRailStats|PulseRosterGroup|PulseRailMemberWeek/u);
	// Uncaptured cards are the shared Jira Issue variant, not a second inline
	// implementation inside Pulse.
	assert.doesNotMatch(SOURCES.rail, /Produced in this window but never landed in a work item/u);
	assert.doesNotMatch(SOURCES.rail, /Capture it before it disappears/u);
	assert.match(SOURCES.rail, /<JiraIssue[\s\S]*variant="uncaptured-work"/u);
	assert.match(SOURCES.rail, /captured=\{capturedIds\.has\(item\.id\)\}/u);
	assert.match(SOURCES.rail, /onCreateWorkItem=\{\(\) => onCapture\(item\)\}/u);
	assert.match(SOURCES.rail, /const participants = toUncapturedParticipants\(item, memberLookup\);/u);
	assert.match(SOURCES.rail, /participants=\{participants\}/u);
	assert.match(SOURCES.rail, /sourceLink=\{createPulseLooseWorkSmartLink\(item, participants\)\}/u);
	assert.match(SOURCES.data, /sourceTitle: "#payments-migration"/u);
	assert.doesNotMatch(SOURCES.rail, /PulseLooseWorkRow|suggestedAction/u);
	assert.doesNotMatch(SOURCES.rail, /Create work item|AvatarGroup|CheckMarkIcon/u);
});

test("Pulse header roster locks one SSR and first-render structure", async () => {
	const { renderRosterMarkup } = await loadRosterMarkupHarness();
	const serverMarkup = renderRosterMarkup();

	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/facepile=\{isPulse \? \(\s*<PulseRosterFacepile[\s\S]*members=\{PULSE_TIMELINE\.members\}[\s\S]*\/>\s*\) : undefined\}/u,
	);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /\{facepile \?\? \(/u);
	assert.match(serverMarkup, /data-slot="avatar-group" role="group" aria-label="Filter by person or agent"/u);
	assert.equal([...serverMarkup.matchAll(/<button /gu)].length, 7);
	assert.equal([...serverMarkup.matchAll(/aria-pressed="false"/gu)].length, 7);
	assert.match(serverMarkup, /aria-label="Show only Maya Ferreira, Staff engineer"/u);
	assert.doesNotMatch(serverMarkup, /Board assignees|data-unassigned|aria-label="Unassigned"/u);
});

test("Pulse is a toggle on the board's own control row, not a separate tab", () => {
	// Pulse is a lens over the board rather than a sibling view, so it is a
	// pressed toggle beside Filter and Group. The retired tab component would
	// have put the filter facepile and the mode switch on two different rows.
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /export type ExperimentalJiraKanbanMode = "board" \| "pulse";/u);
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /export function PulseModeToggle\(/u);
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /aria-pressed=\{active\}/u);
	assert.match(PULSE_MODE_CONTROLS_SOURCE, />\s*Insights\s*<\/Button>/u);
	assert.ok(!existsSync(join(PULSE_DIR, "..", "experimental-view-tabs.tsx")), "the tab component should be retired, not left beside its replacement");

	assert.match(EXPERIMENTAL_PAGE_SOURCE, /import \{ ExperimentalPulse \} from "\.\/pulse\/experimental-pulse";/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /const \[mode, setMode\] = useState<ExperimentalJiraKanbanMode>\("board"\);/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /const isPulse = mode === "pulse";/u);
	// The control row stays up in Pulse. Board mode keeps the board assignee
	// facepile; Pulse swaps in its own member roster because the two filters own
	// different ids and state.
	assert.doesNotMatch(EXPERIMENTAL_PAGE_SOURCE, /showBoardControls=\{!isPulse\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<PulseModeToggle/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/facepile=\{isPulse \? \(\s*<PulseRosterFacepile[\s\S]*members=\{PULSE_TIMELINE\.members\}[\s\S]*\/>\s*\) : undefined\}/u,
	);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /facepile\?: ReactNode;/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /modeToggle\?: ReactNode;/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /\{facepile \?\? \(/u);
});

test("Experimental board header keeps Filter clickable and badges new timeline activity", () => {
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /filterControl: ReactNode;/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /endSlot\?: ReactNode;/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /\{filterControl\}/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /\{endSlot \? endSlot : null\}/u);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /disableAssigneeFilter|aria-disabled[\s\S]*Filter board is unavailable/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<BoardFilterPopover/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<TimelineActivityBadge/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /useBoardFilter\(/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /filterPulseTimelineByDays/u);
	assert.match(
		readFileSync(join(EXPERIMENTAL_DIR, "data", "board-filter-options.ts"), "utf8"),
		/Filter by days/u,
	);
	assert.match(
		readFileSync(join(EXPERIMENTAL_DIR, "components", "board-filter-popover.tsx"), "utf8"),
		/aria-expanded=\{model\.open\}[\s\S]*aria-label=\{filterLabel\}[\s\S]*aria-pressed=\{hasSelection \|\| model\.open\}/u,
	);
	assert.doesNotMatch(
		readFileSync(join(EXPERIMENTAL_DIR, "components", "board-filter-popover.tsx"), "utf8"),
		/Filter board is unavailable/u,
	);
});

test("Kanban column add-agent controls use the AI agent add icon", () => {
	assert.match(DEFAULT_BOARD_SOURCE, /import AiAgentAddIcon from "@atlaskit\/icon-lab\/core\/ai-agent-add"/u);
	assert.match(DEFAULT_BOARD_SOURCE, /render=\{<AiAgentAddIcon label="" \/>\}/u);
	assert.doesNotMatch(DEFAULT_BOARD_SOURCE, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent"/u);
	const experimentalBoard = readFileSync(join(EXPERIMENTAL_DIR, "experimental-jira-kanban.tsx"), "utf8");
	assert.match(experimentalBoard, /import AiAgentAddIcon from "@atlaskit\/icon-lab\/core\/ai-agent-add"/u);
	assert.match(experimentalBoard, /render=\{<AiAgentAddIcon label="" \/>\}/u);
	assert.doesNotMatch(experimentalBoard, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent"/u);
});

test("Pulse keeps one member filter across the header facepile and the story faces", () => {
	// One selection, three places it can be driven from: the header facepile,
	// the contributor faces, and the story's own clear control. The filter used
	// to be one more thing `usePulseTimeline` owned; it is its own hook now, so
	// exactly one hook owns each piece of state and the shell can resolve the
	// filter first — the reading position re-keys on it.
	assert.match(SOURCES.hook, /export function usePulseMemberFilter\(/u);
	assert.match(SOURCES.hook, /const isControlled = selectedMemberId !== undefined;/u);
	assert.match(SOURCES.hook, /onSelectedMemberIdChange\?\.\(memberId\);/u);
	assert.match(SOURCES.hook, /export interface PulseTimelineOptions/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /const \[pulseMemberId, setPulseMemberId\] = useState<string \| null>\(null\);/u);
	assert.match(SOURCES.shell, /usePulseMemberFilter\(\{ onSelectedMemberIdChange, selectedMemberId \}\)/u);
	// Composition order is the contract: filter, then reading position, then pure
	// derivation on top of both. Reversing any two of them puts the old circular
	// dependency back.
	const shellOrder = ["usePulseMemberFilter(", "usePulseReading(", "usePulseTimeline("]
		.map((call) => SOURCES.shell.indexOf(call));
	assert.deepEqual([...shellOrder].sort((a, b) => a - b), shellOrder, "the shell composes its hooks out of order");
	assert.ok(shellOrder.every((index) => index > 0));
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /export function PulseRosterFacepile\(/u);
	// The shared group supplies the shape-aware separator to nested hexagons,
	// while fixed-size flex buttons remove inline baseline drift between SVG
	// agents and photo-backed humans.
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /import \{ Avatar, AvatarFallback, AvatarGroup, AvatarImage \} from "@\/components\/ui\/avatar";/u);
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /<AvatarGroup[\s\S]*items-center -space-x-1\.5/u);
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /className="focus-visible:ring-ring\/50 flex size-6 shrink-0 items-center justify-center/u);
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /member\.kind === "human" \? "ring-2 ring-surface" : null/u);
	assert.doesNotMatch(PULSE_MODE_CONTROLS_SOURCE, /"ring-2 ring-surface transition-opacity/u);
	// The contributor facepile uses the same primitive and a 16px wrapper.
	// Keeping the avatar as a direct child of a 16px flex button removes the
	// inline list/button baseline that made the old row 29px and top-heavy.
	assert.match(SOURCES.story, /import \{ Avatar, AvatarFallback, AvatarGroup, AvatarImage \} from "@\/components\/ui\/avatar";/u);
	assert.match(SOURCES.story, /<span aria-hidden className=\{cn\("shrink-0", PULSE_ROW_META\)\}>By<\/span>/u);
	assert.match(SOURCES.story, /<AvatarGroup[\s\S]*label="By contributors in this window"[\s\S]*size="xs"/u);
	assert.match(SOURCES.story, /className="focus-visible:ring-ring\/50 flex size-4 shrink-0 items-center justify-center/u);
	assert.match(SOURCES.story, /size="xs"/u);
	assert.match(SOURCES.story, /member\.kind === "human" \? "ring-2 ring-surface" : null/u);
	assert.match(SOURCES.story, /member\.kind === "agent" && isSelected \? "\[&>svg\]:text-border-selected!" : null/u);
	assert.doesNotMatch(SOURCES.story, /"duration-normal ease-out-practical ring-2 ring-surface transition-opacity/u);
	// Agents keep the hexagon everywhere the roster is drawn.
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /shape=\{member\.kind === "agent" \? "hexagon" : "circle"\}/u);
	assert.match(SOURCES.story, /shape=\{member\.kind === "agent" \? "hexagon" : "circle"\}/u);
	assert.match(SOURCES.rail, /assigneeAvatarShape=\{assignee\?\.kind === "agent" \? "hexagon" : "circle"\}/u);
});

test("Pulse stays inside the experimental variant", () => {
	// `lib/` and the reading hook arrived with the continuous article, so the
	// containment check has to name them too.
	const pulseImport = /pulse\/(?:experimental-pulse|components|data|hooks|lib|types)|ExperimentalPulse|PULSE_TIMELINE|usePulseTimeline|usePulseReading|buildPulseOutline/u;

	for (const [name, source] of [
		["index.tsx", DEFAULT_BOARD_SOURCE],
		["page.tsx", DEFAULT_PAGE_SOURCE],
		["board-header.tsx", DEFAULT_HEADER_SOURCE],
	]) {
		assert.doesNotMatch(source, pulseImport, `the default ${name} reaches into Pulse`);
		assert.doesNotMatch(source, /experimental/iu, `the default ${name} reaches into the experimental variant`);
	}

	// Pulse only imports from the experimental tree and shared primitives, never
	// from the default variant's board or header.
	for (const [name, source] of Object.entries(SOURCES)) {
		assert.doesNotMatch(source, /from "\.\.\/\.\.\/(?:board-header|page)"/u, `${name} imports the default variant`);
		assert.doesNotMatch(
			source,
			/from "@\/components\/blocks\/jira-kanban\/(?:board-header|page)"/u,
			`${name} imports the default variant`,
		);
	}
});

test("Pulse tiles three columns full-bleed, with the story taking the slack", () => {
	const pxValue = (source, pattern) => {
		const match = source.match(pattern);
		assert.ok(match, `expected ${pattern} in the source`);
		return Number.parseInt(match[1], 10);
	};

	// Full-bleed by design: capping the row would strand the combined work rail
	// against the right edge on a wide screen. The story is the only flexible
	// column, and its prose measure is capped separately inside PulseStory.
	assert.match(SOURCES.shell, /const SHELL_MEASURE = "w-full min-w-0";/u);
	// The article is the flexible column and the one real scrollport. It used to
	// scroll only from `lg` up, with the page scrolling everything below it;
	// `usePulseReading` listens on the scrollport element, so under the stacked
	// layout the compact ruler would neither follow nor jump. It is a bounded
	// reading pane below `lg` instead — a ruler whose marks do nothing is worse
	// than a nested scroll region.
	assert.match(
		SOURCES.shell,
		/className="relative -m-1 max-h-\[70svh\] min-h-0 min-w-0 flex-1 lg:mr-10 lg:h-full lg:max-h-none"/u,
		"the article column is the flexible one",
	);
	assert.match(
		SOURCES.shell,
		/className="h-full overflow-y-auto p-1 lg:overscroll-y-contain lg:pr-10 lg:pb-12"/u,
		"the nested region is the reading scrollport",
	);
	assert.doesNotMatch(SOURCES.shell, /lg:max-w-\[[\d.]+rem\] lg:overflow-y-auto/u, "the story must not re-cap itself in the shell");
	assert.match(SOURCES.story, /const MEASURE = "max-w-\[36rem\]";/u, "the prose measure still holds at 576px");
	assert.match(
		SOURCES.stream,
		/className=\{cn\("mx-auto flex min-w-0 flex-col", MEASURE\)\}/u,
		"the article column is centered in the scrollport at the prose measure",
	);

	const scrubber = pxValue(SOURCES.scrubber, /className="pointer-events-none relative h-full min-h-\[24rem\] w-(\d+)"/u) * 4;
	assert.strictEqual(scrubber, 144);

	// The work rail is one fixed parent; only the story breathes. The two
	// tracks keep 320 and 300 with the same 8px gutter as kanban columns.
	assert.match(SOURCES.rail, /lg:grid-cols-\[320px_300px\]/u);
	assert.match(SOURCES.rail, /lg:w-\[628px\]/u);
	assert.match(SOURCES.rail, /lg:box-content/u, "padding sits outside the 320+8+300 measure so overflow-y cannot clip the uncaptured stroke");
	assert.match(SOURCES.rail, /grid-cols-1 gap-10/u, "40px stacked gutter below lg");
	assert.match(SOURCES.rail, /lg:gap-2/u, "8px gutter matching experimental kanban columns");
	assert.doesNotMatch(SOURCES.shell, /lg:w-10 lg:shrink-0/u, "the inter-column spacer left with the two independent rails");
	assert.match(SOURCES.shell, /<PulseWorkRail/u);
	assert.match(SOURCES.shell, /lg:mr-10/u, "the article scrollport keeps a 40px gutter before the work rail");
	assert.match(SOURCES.shell, /lg:pr-10/u, "the story content remains inset from its scrollbar");
	assert.match(SOURCES.shell, /lg:h-full lg:flex-row/u);
});

test("Pulse eyebrow and section labels match the Activity heading rung", () => {
	// Both tokens share the work-item Activity treatment: 12px semibold,
	// sentence case, no tracking. They are defined once and imported everywhere.
	const type = readFileSync(join(PULSE_DIR, "components", "pulse-type.ts"), "utf8");
	assert.match(type, /PULSE_EYEBROW =\s*\n?\s*"text-xs leading-4 font-semibold text-text-subtlest"/u);
	assert.match(type, /PULSE_SECTION_LABEL =\s*\n?\s*"text-xs leading-4 font-semibold text-text-subtlest"/u);
	assert.match(type, /PULSE_ITEM_TITLE = "text-sm font-medium leading-5 tracking-\[-0\.006em\] text-text"/u);
	assert.doesNotMatch(type, /PULSE_EYEBROW[\s\S]*?uppercase/u);
	assert.doesNotMatch(type, /PULSE_SECTION_LABEL[\s\S]*?uppercase/u);

	for (const [name, source] of [["rail", SOURCES.rail], ["signals", SOURCES.signals], ["story", SOURCES.story]]) {
		assert.doesNotMatch(source, /text-\[11px\] font-semibold uppercase[^"]*text-text-subtlest/u, `${name} re-declares a label rung`);
		assert.doesNotMatch(source, /tracking-\[0\.14em\]|tracking-\[0\.12em\]|tracking-\[0\.09em\]|tracking-\[0\.06em\]/u, `${name} keeps a retired label rung`);
		assert.doesNotMatch(source, /uppercase/u, `${name} does not uppercase labels`);
	}
	// The eyebrow names the chapter (and the member while the view is scoped).
	assert.match(SOURCES.story, /className=\{cn\("min-w-0 truncate", PULSE_EYEBROW\)\}/u);
	assert.match(SOURCES.story, /\$\{member\.name\} · \$\{snapshot\.chapterLabel\} · \$\{snapshot\.rangeLabel\}/u);
	// Row data is not a label: the quiet marker and the group names are sentence
	// case. The roster's own group labels left with it, and so did the "3 of 7"
	// counter that sat beside the retired chevrons — the reading position is
	// carried by the ruler's pill and the article's own status now, neither of
	// which is a rung on this scale.
	assert.match(PULSE_MODE_CONTROLS_SOURCE, /title=\{`\$\{member\.name\} · \$\{member\.role\}`\}/u);
	assert.doesNotMatch(PULSE_MODE_CONTROLS_SOURCE, /uppercase/u);
	assert.doesNotMatch(SOURCES.story, /tabular-nums text-text-subtlest"/u, "the snapshot counter left with the chevrons");
	assert.doesNotMatch(SOURCES.stream, /uppercase/u, "the article's separators are rules, not labels");
	// Both signal sections share one row shape, so every row hangs off the same
	// two edges regardless of how wide its own button happens to be.
	assert.match(type, /PULSE_ROW_KEY_TRACK =\s*\n?\s*"mt-0\.5 w-16 shrink-0/u);
	assert.match(type, /PULSE_ROW_ACTION_TRACK = "flex w-36 shrink-0 justify-end"/u);
	assert.match(SOURCES.signals, /<span aria-hidden=\{workItemKey === undefined\} className=\{PULSE_ROW_KEY_TRACK\}>/u);
	assert.match(SOURCES.signals, /<div className=\{PULSE_ROW_ACTION_TRACK\}>\{trailing\}<\/div>/u);
	assert.doesNotMatch(SOURCES.signals, /border-l-2/u, "the two signal sections share one list rhythm");
	// Section labels restate their sentence-case name for the accessibility tree.
	assert.match(SOURCES.signals, /<h3 aria-label=\{children\}/u);
	assert.match(SOURCES.rail, /<PulseSectionLabel>\{label\}<\/PulseSectionLabel>/u);
	// Prose is set to avoid one-word last lines rather than balanced into a
	// bottom-heavy rag.
	assert.doesNotMatch(SOURCES.story, /text-balance/u);
	assert.match(SOURCES.story, /text-base\/6 tracking-\[-0\.011em\] text-pretty text-text/u);
	assert.match(SOURCES.story, /className=\{cn\("mt-7 text-pretty text-text", MEASURE\)\}/u);
	// Eyebrow → title → contributors. The old `mt-7` under the eyebrow moves
	// onto the title; the faces drop to `mt-3` so two large tops do not stack.
	assert.match(
		SOURCES.story,
		/<p className=\{cn\("min-w-0 truncate", PULSE_EYEBROW\)\}>\{eyebrow\}<\/p>[\s\S]*<h2 className=\{cn\("mt-7 text-pretty text-text", MEASURE\)\}[\s\S]*<div className="mt-3 min-w-0">\s*<PulseStoryContributors/u,
	);
	assert.doesNotMatch(
		SOURCES.story,
		/<PulseStoryContributors[\s\S]*<h2 className=\{cn\("mt-7 text-pretty text-text", MEASURE\)\}/u,
	);
});

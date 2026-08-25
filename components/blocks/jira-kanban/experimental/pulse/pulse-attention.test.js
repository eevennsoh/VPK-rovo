/**
 * Pulse — "Needs attention" as an agent list.
 *
 * The section is not a list of statements any more; it is a list of the people
 * and agents waiting on the reader — an agent that stopped and needs an answer,
 * a teammate who commented or @mentioned them — rendered through the shared
 * `components/blocks/agent-list` block. What that costs is a mapping, and a
 * mapping is executable, so the row model is asserted for real against the
 * fixture rather than grepped. Only the composition itself — that the section
 * renders the shared block, flyout-free — is a source contract, because Node
 * cannot render it.
 */

const { test } = require("node:test");

const {
	assert,
	findSnapshotIndex,
	loadAttentionHarness,
	snapshotAt,
	SOURCES,
} = require("./pulse-test-harness");

/** Every attention row for one snapshot, mapped the way the story maps them. */
async function attentionRows(snapshotId) {
	const { PULSE_TIMELINE, toPulseAttentionItems } = await loadAttentionHarness();
	const index = findSnapshotIndex(PULSE_TIMELINE, snapshotId);
	const snapshot = snapshotAt(PULSE_TIMELINE, index);
	const contributors = PULSE_TIMELINE.members.filter((member) =>
		snapshot.memberIds.includes(member.id),
	);

	return {
		items: toPulseAttentionItems(
			snapshot.attention,
			contributors,
			`${snapshot.dateLabel} ${snapshot.timeLabel}`,
		),
		snapshot,
	};
}

test("every signal becomes one row that leads with who it is from", async () => {
	const { PULSE_TIMELINE } = await loadAttentionHarness();
	const byId = new Map(PULSE_TIMELINE.members.map((member) => [member.id, member]));

	for (const snapshot of PULSE_TIMELINE.snapshots) {
		const { items } = await attentionRows(snapshot.id);
		assert.equal(items.length, snapshot.attention.length, `${snapshot.id} dropped a signal`);

		items.forEach((item, index) => {
			const signal = snapshot.attention[index];
			const member = byId.get(signal.memberId);
			const where = `${snapshot.id}/${signal.id}`;

			assert.equal(item.id, signal.id, where);
			// The signal's own title survives; it is the news, not a task name.
			assert.equal(item.title, signal.title, where);
			assert.equal(item.summary, signal.detail, where);
			assert.equal(item.agent.name, member.name, where);
			assert.equal(item.agent.avatarSrc, member.avatarSrc, where);
			assert.equal(
				item.agent.kind,
				member.kind === "agent" ? "agent" : "person",
				where,
			);
			// Historical rows state their window instead of running a clock.
			assert.equal(item.timeLabel, `${snapshot.dateLabel} ${snapshot.timeLabel}`, where);
			assert.equal(item.branch, undefined, `${where} is not an agent session`);
		});
	}
});

test("shipped signals read as settled; everything else still wants a human", async () => {
	const { toAttentionState } = await loadAttentionHarness();

	assert.equal(toAttentionState("shipped"), "complete");
	assert.equal(toAttentionState("attention"), "attention");
	assert.equal(toAttentionState("risk"), "attention");
	assert.equal(toAttentionState("decision"), "attention");

	// The fixture exercises both halves, so the section is never all one state.
	const { items } = await attentionRows("s7-ship-readiness");
	assert.ok(items.some((item) => item.state === "attention"));
	assert.ok(items.some((item) => item.state === "complete"));
});

test("tone and work item ride the metadata line, not a lozenge the row cannot show", async () => {
	const { toAttentionMetadata } = await loadAttentionHarness();

	assert.equal(
		toAttentionMetadata({ tone: "risk", workItemKey: "PAY-112" }),
		"Risk · PAY-112",
	);
	assert.equal(toAttentionMetadata({ tone: "decision" }), "Decision");
	assert.equal(
		toAttentionMetadata({ tone: "shipped", workItemKey: "PAY-126" }),
		"Shipped · PAY-126",
	);
	// The section heading and the warning glyph already say "attention"; naming
	// it a third time would spend metadata saying nothing.
	assert.equal(
		toAttentionMetadata({ tone: "attention", workItemKey: "PAY-104" }),
		"PAY-104",
	);
	assert.equal(toAttentionMetadata({ tone: "attention" }), undefined);

	const { items, snapshot } = await attentionRows("s3-regression");
	items.forEach((item, index) => {
		assert.equal(item.metadataPrefix, toAttentionMetadata(snapshot.attention[index]));
	});
});

test("a signal from somebody outside the window is dropped rather than rendered faceless", async () => {
	const { PULSE_TIMELINE, toPulseAttentionItems } = await loadAttentionHarness();
	const [member] = PULSE_TIMELINE.members;

	const items = toPulseAttentionItems(
		[
			{ id: "known", tone: "attention", memberId: member.id, title: "t", detail: "d" },
			{ id: "ghost", tone: "attention", memberId: "nobody", title: "t", detail: "d" },
		],
		[member],
		"Mon 17 Aug 08:12",
	);

	// The row model leads with an identity: a row that cannot name who it is
	// from is worse than no row. The fixture suite proves this never fires.
	assert.deepEqual(items.map((item) => item.id), ["known"]);
});

test("the section renders the shared agent-list block, flyout-free", () => {
	assert.match(SOURCES.signals, /import \{ AgentList \} from "@\/components\/blocks\/agent-list";/u);
	assert.match(SOURCES.signals, /<AgentList className="mt-3" flyout="none" items=\{items\} \/>/u);
	assert.match(
		SOURCES.signals,
		/const items = toPulseAttentionItems\(signals, members, timeLabel\);/u,
	);
	// Emptying by scoping is decided on the mapped rows, so a signal the roster
	// cannot place cannot leave the section claiming to hold something.
	assert.match(SOURCES.signals, /if \(items\.length === 0 && emptyNote === undefined\) return null;/u);
	assert.match(SOURCES.signals, /\{items\.length === 0 \? \(\s*<PulseSectionNote>/u);
	// Tone left the section with the lozenge; it is metadata on the row now.
	assert.doesNotMatch(SOURCES.signals, /Lozenge/u);
	assert.doesNotMatch(SOURCES.signals, /SIGNAL_TONE_VARIANT/u);
	// The actions section keeps the reserved-track row shape this file owns.
	assert.match(SOURCES.signals, /<PulseSignalRow[\s\S]*detail=\{action\.rationale\}/u);
	// The story hands down the window's roster and its own pre-formatted stamp.
	assert.match(SOURCES.story, /members=\{contributors\}/u);
	assert.match(
		SOURCES.story,
		/timeLabel=\{`\$\{snapshot\.dateLabel\} \$\{snapshot\.timeLabel\}`\}/u,
	);
});

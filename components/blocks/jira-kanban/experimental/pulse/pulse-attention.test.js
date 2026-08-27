/**
 * Pulse — "Needs input" as an agent list.
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

	return { items: toPulseAttentionItems(snapshot.attention, contributors), snapshot };
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
			assert.equal(item.branch, undefined, `${where} is not an agent session`);
			assert.equal(
				item.actionLabel,
				member.kind === "human" ? "Reply" : "Give input",
				where,
			);
		});
	}
});

test("rows carry the signal's own time, not the window's closing boundary", async () => {
	const { PULSE_TIMELINE } = await loadAttentionHarness();

	for (const snapshot of PULSE_TIMELINE.snapshots) {
		const { items } = await attentionRows(snapshot.id);
		const windowClose = `${snapshot.dateLabel} ${snapshot.timeLabel}`;

		items.forEach((item, index) => {
			const signal = snapshot.attention[index];
			// A fixed string, so the list states when something happened instead of
			// running a live clock per row against a week that is already over.
			assert.equal(item.timeLabel, signal.timeLabel, `${snapshot.id}/${signal.id}`);
		});

		// Stamping the whole section with the boundary is the bug this replaced: a
		// comment posted at 08:06 inside a window that closes at 08:12 said 08:12.
		assert.ok(
			items.some((item) => item.timeLabel !== windowClose),
			`${snapshot.id} stamps every row with its own closing time`,
		);
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
	const base = { detail: "d", timeLabel: "Mon 17 Aug 08:12", title: "t", tone: "attention" };

	const items = toPulseAttentionItems(
		[
			{ ...base, id: "known", memberId: member.id },
			{ ...base, id: "ghost", memberId: "nobody" },
		],
		[member],
	);

	// The row model leads with an identity: a row that cannot name who it is
	// from is worse than no row. The fixture suite proves this never fires.
	assert.deepEqual(items.map((item) => item.id), ["known"]);
});

test("human comments Reply; agents that stopped ask for input", async () => {
	const { resolveAttentionWorkItem, toAttentionActionLabel } = await loadAttentionHarness();

	assert.equal(toAttentionActionLabel("human"), "Reply");
	assert.equal(toAttentionActionLabel("agent"), "Give input");

	const { items } = await attentionRows("s1-kickoff");
	assert.equal(items.find((item) => item.id === "s1-sig-mention")?.actionLabel, "Reply");
	assert.equal(items.find((item) => item.id === "s1-sig-decision")?.actionLabel, "Reply");
	assert.equal(items.find((item) => item.id === "s1-sig-flag")?.actionLabel, "Give input");

	const { PULSE_TIMELINE } = await loadAttentionHarness();
	const kickoff = PULSE_TIMELINE.snapshots[0];
	assert.equal(
		resolveAttentionWorkItem("s1-sig-mention", kickoff.attention, PULSE_TIMELINE.workItems)?.key,
		"PAY-104",
	);
	assert.equal(
		resolveAttentionWorkItem("s1-sig-flag", kickoff.attention, PULSE_TIMELINE.workItems)?.key,
		"PAY-121",
	);
	assert.equal(
		resolveAttentionWorkItem("missing", kickoff.attention, PULSE_TIMELINE.workItems),
		undefined,
	);
});

test("the section renders the shared agent-list block, flyout-free", () => {
	assert.match(SOURCES.signals, /import \{ AgentList, type AgentListItem \} from "@\/components\/blocks\/agent-list";/u);
	assert.match(SOURCES.signals, /<AgentList chrome="raised" className="mt-3" flyout="none" items=\{items\} onView=\{onView\} \/>/u);
	assert.match(
		SOURCES.signals,
		/const items = toPulseAttentionItems\(signals, members\);/u,
	);
	assert.match(SOURCES.signals, /toSectionHeading\("attention"\)/u);
	assert.match(SOURCES.signals, /toSectionHeading\("actions"\)/u);
	// Emptying by scoping is decided on the mapped rows, so a signal the roster
	// cannot place cannot leave the section claiming to hold something.
	assert.match(SOURCES.signals, /if \(items\.length === 0 && emptyNote === undefined\) return null;/u);
	assert.match(SOURCES.signals, /\{items\.length === 0 \? \(\s*<PulseSectionNote>/u);
	// Tone left the section with the lozenge; it is metadata on the row now.
	assert.doesNotMatch(SOURCES.signals, /Lozenge/u);
	assert.doesNotMatch(SOURCES.signals, /SIGNAL_TONE_VARIANT/u);
	// Actions left the reserved-track row for the shared next-best-action block.
	assert.match(SOURCES.signals, /<NextBestAction className="mt-3" items=\{items\} onAct=\{handleAct\} \/>/u);
	// The story hands down the window's roster, and nothing else: the time is the
	// signal's own, so no window boundary can be substituted for an event time.
	assert.match(SOURCES.story, /members=\{contributors\}/u);
	assert.match(SOURCES.story, /onView=\{onViewAttention\}/u);
	assert.match(SOURCES.stream, /onViewAttention=\{handleViewAttention\}/u);
	assert.doesNotMatch(SOURCES.story, /timeLabel=/u);
});

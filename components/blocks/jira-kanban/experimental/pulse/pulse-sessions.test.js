/**
 * Pulse — local coding sessions as an agent list.
 *
 * Uncaptured GitHub work stays a dashed card. A Claude session uses the same
 * card chrome through AgentList `variant="uncaptured"`, mapped from the fixture
 * onto the shared row model. Only the rail composition is a source contract.
 */

const { test } = require("node:test");

const {
	assert,
	findSnapshotIndex,
	loadSessionsHarness,
	snapshotAt,
	SOURCES,
} = require("./pulse-test-harness");

async function sessionRows(snapshotId) {
	const { PULSE_TIMELINE, toPulseSessionItems } = await loadSessionsHarness();
	const index = findSnapshotIndex(PULSE_TIMELINE, snapshotId);
	const snapshot = snapshotAt(PULSE_TIMELINE, index);
	const contributors = PULSE_TIMELINE.members.filter((member) =>
		snapshot.memberIds.includes(member.id),
	);
	const looseWork = snapshot.looseWorkIds.map((id) =>
		PULSE_TIMELINE.looseWork.find((item) => item.id === id),
	);

	return {
		items: toPulseSessionItems(looseWork, contributors),
		sessions: looseWork.filter((item) => item.kind === "agent-session"),
		snapshot,
	};
}

test("every local session becomes one Claude agent-list row", async () => {
	const { PULSE_TIMELINE, toPulseSessionItems, toPulseSessionWorktree } = await loadSessionsHarness();

	for (const snapshot of PULSE_TIMELINE.snapshots) {
		const { items, sessions } = await sessionRows(snapshot.id);
		assert.equal(items.length, sessions.length, `${snapshot.id} dropped a session`);

		items.forEach((item, index) => {
			const session = sessions[index];
			const where = `${snapshot.id}/${session.id}`;

			assert.equal(item.id, session.id, where);
			assert.equal(item.title, session.title, where);
			assert.equal(item.host, "local", where);
			assert.equal(item.state, "complete", where);
			assert.equal(item.agent.name, "Claude", where);
			assert.equal(item.agent.brandName, "claude", where);
			assert.equal(item.metadataPrefix, undefined, where);
			assert.equal(item.timeLabel, "3 mins ago", where);
			assert.equal(item.machineName, "Venn’s MacBook", where);
			assert.equal(item.sessionDetails.issueKey, session.sourceTitle, where);
			assert.equal(
				item.sessionDetails.worktreePath,
				toPulseSessionWorktree(session.detail),
				where,
			);
		});
	}

	const githubOnly = toPulseSessionItems(
		PULSE_TIMELINE.looseWork.filter((item) => item.kind !== "agent-session"),
		PULSE_TIMELINE.members,
	);
	assert.equal(githubOnly.length, 0, "GitHub artifacts must not become session rows");
});

test("session rows name a human invoker when the roster can place one", async () => {
	const { items, sessions } = await sessionRows("s1-kickoff");
	const { PULSE_TIMELINE } = await loadSessionsHarness();
	const byId = new Map(PULSE_TIMELINE.members.map((member) => [member.id, member]));

	items.forEach((item, index) => {
		const session = sessions[index];
		const invoker = session.memberIds
			.map((id) => byId.get(id))
			.find((member) => member !== undefined && member.kind === "human");

		if (invoker === undefined) {
			assert.equal(item.invokedBy, undefined, session.id);
			return;
		}

		assert.equal(item.invokedBy.name, invoker.name, session.id);
		assert.equal(item.invokedBy.avatarSrc, invoker.avatarSrc, session.id);
	});
});

test("session activation is omitted when the host cannot resume it", async () => {
	const { PULSE_TIMELINE, toPulseSessionHandlers, toPulseSessionItems } = await loadSessionsHarness();
	const session = PULSE_TIMELINE.looseWork.find((item) => item.kind === "agent-session");
	assert.ok(session !== undefined, "fixture should include a local agent session");
	const item = toPulseSessionItems([session], PULSE_TIMELINE.members)[0];
	const handlers = toPulseSessionHandlers({
		looseWork: [session],
		onCapture() {},
	});

	assert.equal(handlers.onView, undefined);
	assert.equal(handlers.onCopyResume, undefined);
	assert.equal(handlers.isResumable(item), false);
});

test("the uncaptured column renders sessions through the Agent Session block", () => {
	assert.match(SOURCES.rail, /import \{ AgentSession \} from "@\/components\/blocks\/agent-session";/u);
	assert.match(
		SOURCES.rail,
		/const sessionItems = toPulseSessionItems\(\s*looseWork,\s*members,\s*\);/u,
	);
	assert.match(SOURCES.rail, /githubWork = looseWork\.filter\(isPulseGithubLooseWork\)/u);
	assert.match(
		SOURCES.rail,
		/<JiraIssue[\s\S]*variant="uncaptured-work"[\s\S]*<AgentSession[\s\S]*items=\{sessionItems\}/u,
	);
	assert.match(SOURCES.rail, /capturedItemIds=\{capturedIds\}/u);
	// The row -> loose work callbacks live in the shared adapter, so the rail and
	// the v2 board's untracked-work column apply one set of rules.
	assert.match(SOURCES.rail, /\{\.\.\.sessionHandlers\}/u);
	assert.match(SOURCES.sessions, /onCopyResume: onResume === undefined \? undefined : \(item: AgentSessionItem\) => \{/u);
	assert.match(SOURCES.sessions, /onLinkWorkItem: \(item: AgentSessionItem\) => \{/u);
	assert.doesNotMatch(SOURCES.rail, /variant="compact"/u);
	assert.doesNotMatch(SOURCES.rail, /canViewItem=/u);
	assert.match(SOURCES.sessions, /onView: onResume === undefined \? undefined : \(item: AgentSessionItem\) => \{/u);
	assert.match(SOURCES.sessions, /isLooseWorkResumable\?\.\(session\) \?\? true/u);
	// Resumability is declared up front so non-resumable rows never render an
	// enabled Resume control; the callback guard alone runs after the copy.
	assert.match(SOURCES.sessions, /isResumable: \(item: AgentSessionItem\) => resolveResumable\(item\) !== undefined/u);
	assert.doesNotMatch(SOURCES.rail, /onResumeAgentSession/u);
	assert.doesNotMatch(SOURCES.rail, /sourceFacts/u);
	assert.doesNotMatch(SOURCES.rail, /JiraIssueUncapturedWork/u);
});

test("the roster filter narrows sessions the way the header narrows board cards", async () => {
	const { filterPulseLooseWorkByMember, PULSE_TIMELINE } = await loadSessionsHarness();
	const all = PULSE_TIMELINE.looseWork;

	// No roster member selected means no filter.
	assert.equal(filterPulseLooseWorkByMember(all, null).length, all.length);

	// Regression: the board's untracked-work column used to map every session
	// regardless of the header selection, so picking one person hid their
	// teammates' cards while leaving every teammate's session on screen.
	const memberId = all.find((item) => item.memberIds.length > 0)?.memberIds[0];
	assert.ok(memberId !== undefined, "fixture should attribute loose work to a member");

	const filtered = filterPulseLooseWorkByMember(all, memberId);
	assert.ok(filtered.length > 0, "the selected member should keep their own loose work");
	assert.ok(filtered.length < all.length, "other members' loose work should drop out");
	for (const item of filtered) {
		assert.ok(item.memberIds.includes(memberId), `${item.id} is not attributable to the selection`);
	}

	// Only a roster-resolved id ever reaches this helper. `toPulseMemberId`
	// answers null for a selection made in the board's own assignee id space,
	// so the column is never emptied by a selection it cannot express.
	const boardOnlyIds = new Set(["maya-chen", "jordan-lee"]);
	const pulseMemberIds = new Set(PULSE_TIMELINE.members.map((member) => member.id));
	for (const id of boardOnlyIds) {
		assert.ok(!pulseMemberIds.has(id), `${id} should not name a roster member`);
	}
});

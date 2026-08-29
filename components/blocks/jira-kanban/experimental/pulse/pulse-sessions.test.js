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
	assert.match(SOURCES.rail, /onCopyResume=\{\(item\) => \{/u);
	assert.match(SOURCES.rail, /onLinkWorkItem=\{\(item\) => \{/u);
	assert.doesNotMatch(SOURCES.rail, /variant="compact"/u);
	assert.doesNotMatch(SOURCES.rail, /canViewItem=/u);
	assert.match(SOURCES.rail, /onView=\{\(item\) => \{/u);
	assert.match(SOURCES.rail, /isLooseWorkResumable\?\.\(session\) \?\? true/u);
	// The rail declares resumability up front so non-resumable rows never render
	// an enabled Resume control; the callback guard alone runs after the copy.
	assert.match(SOURCES.rail, /isResumable=\{\(item\) => \{/u);
	assert.doesNotMatch(SOURCES.rail, /onResumeAgentSession/u);
	assert.doesNotMatch(SOURCES.rail, /sourceFacts/u);
	assert.doesNotMatch(SOURCES.rail, /JiraIssueUncapturedWork/u);
});

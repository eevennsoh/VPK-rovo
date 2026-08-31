/**
 * Pulse — local coding sessions as an agent list.
 *
 * Uncaptured GitHub work stays a dashed card. A coding session uses the same
 * card chrome through AgentList `variant="uncaptured"`, mapped from the fixture
 * onto the shared row model. Only the rail composition is a source contract.
 */

const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const {
	assert,
	findSnapshotIndex,
	loadSessionsHarness,
	snapshotAt,
	SOURCES,
} = require("./pulse-test-harness");

const CARD_SOURCE = readFileSync(
	join(__dirname, "../../../agent-list/agent-list-card.tsx"),
	"utf8",
);

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
		items: toPulseSessionItems(looseWork, contributors, PULSE_TIMELINE.workItems),
		sessions: looseWork.filter((item) => item.kind === "agent-session"),
		snapshot,
	};
}

test("every local session becomes one agent-list row with fixture identity", async () => {
	const {
		PULSE_TIMELINE,
		toPulseSessionAgent,
		toPulseSessionIssueStatus,
		toPulseSessionItems,
		toPulseSessionWorktree,
	} = await loadSessionsHarness();

	for (const snapshot of PULSE_TIMELINE.snapshots) {
		const { items, sessions } = await sessionRows(snapshot.id);
		assert.equal(items.length, sessions.length, `${snapshot.id} dropped a session`);

		items.forEach((item, index) => {
			const session = sessions[index];
			const where = `${snapshot.id}/${session.id}`;
			const agent = toPulseSessionAgent(session.agentId);

			assert.equal(item.id, session.id, where);
			assert.equal(item.title, session.title, where);
			assert.equal(item.host, "local", where);
			assert.equal(item.state, "complete", where);
			assert.equal(item.agent.id, agent.id, where);
			assert.equal(item.agent.name, agent.name, where);
			assert.equal(item.agent.brandName, agent.brandName, where);
			assert.equal(item.agent.vpkLogo, agent.vpkLogo, where);
			assert.equal(item.metadataPrefix, undefined, where);
			assert.ok(typeof item.timeLabel === "string" && item.timeLabel.length > 0, where);
			assert.equal(item.timeLabel, session.timeLabel, where);
			assert.ok(typeof item.machineName === "string" && item.machineName.length > 0, where);
			assert.equal(item.machineName, session.machineName, where);
			assert.equal(item.sessionDetails.issueKey, session.sourceTitle, where);
			assert.equal(
				item.sessionDetails.issueStatus,
				toPulseSessionIssueStatus(session.sourceTitle, PULSE_TIMELINE.workItems),
				where,
			);
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

	const allItems = toPulseSessionItems(
		PULSE_TIMELINE.looseWork,
		PULSE_TIMELINE.members,
		PULSE_TIMELINE.workItems,
	);
	assert.equal(allItems.length, 16, "the untracked-work column should have sixteen sessions");
	assert.equal(
		allItems.find((item) => item.sessionDetails.issueKey === "PAY-101")?.sessionDetails.issueStatus,
		"Done",
	);
	assert.equal(
		allItems.find((item) => item.sessionDetails.issueKey === "PAY-121")?.sessionDetails.issueStatus,
		"In review",
	);

	const timeLabels = new Set(allItems.map((item) => item.timeLabel));
	const machineNames = new Set(allItems.map((item) => item.machineName));
	const agentNames = new Set(allItems.map((item) => item.agent.name));
	const calendarStamp = /Aug|Mon |Tue |Wed |Thu |Fri /u;
	const relativeStamp = /^(Just now|\d+ mins? ago|\d+ hrs? ago|Yesterday|\d+ days? ago|Last week)$/u;
	for (const item of allItems) {
		assert.doesNotMatch(item.timeLabel, calendarStamp, `${item.id} must not use a calendar stamp`);
		assert.match(item.timeLabel, relativeStamp, `${item.id} timeLabel "${item.timeLabel}" is not relative`);
	}
	assert.ok(timeLabels.size > 1, "timestamps must not all be identical");
	assert.ok(machineNames.size > 1, "machine names must not all be identical");
	assert.ok(!machineNames.has("Venn’s MacBook"), "do not stamp every row as Venn’s MacBook");
	for (const name of ["Claude", "Codex", "Cursor", "Rovo"]) {
		assert.ok(agentNames.has(name), `timeline is missing ${name}`);
	}

	const metadataIdentitySource = /function AgentListMetadataIdentity[\s\S]*?(?=\nexport function AgentListActivityHeader)/u.exec(
		CARD_SOURCE,
	)?.[0];
	assert.ok(metadataIdentitySource, "expected AgentListMetadataIdentity in the shared row");
	assert.match(metadataIdentitySource, /<DevicesIcon color="currentColor" label="" size="small" \/>/u);
	assert.doesNotMatch(metadataIdentitySource, /InvokerAvatar/u);
	assert.doesNotMatch(metadataIdentitySource, /item\.invokedBy \?/u);
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
	assert.equal(typeof handlers.onCreateWorkItem, "function");
	assert.equal(typeof handlers.onLinkWorkItem, "function");
	assert.equal(typeof handlers.onSubtasks, "function");
});

test("create, link, and subtask capture through the same host callback", async () => {
	const { PULSE_TIMELINE, toPulseSessionHandlers, toPulseSessionItems } = await loadSessionsHarness();
	const session = PULSE_TIMELINE.looseWork.find((item) => item.kind === "agent-session");
	assert.ok(session !== undefined, "fixture should include a local agent session");
	const item = toPulseSessionItems([session], PULSE_TIMELINE.members)[0];
	const captured = [];
	const handlers = toPulseSessionHandlers({
		looseWork: [session],
		onCapture(looseWork) {
			captured.push(looseWork.id);
		},
	});

	handlers.onCreateWorkItem(item);
	handlers.onLinkWorkItem(item);
	handlers.onSubtasks(item);
	assert.deepEqual(captured, [session.id, session.id, session.id]);
});

test("the uncaptured column renders sessions through the Agent Session block", () => {
	assert.match(SOURCES.rail, /import \{ AgentSession \} from "@\/components\/blocks\/agent-session";/u);
	assert.match(
		SOURCES.rail,
		/const sessionItems = toPulseSessionItems\(\s*looseWork,\s*members,\s*workItems,\s*\);/u,
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
	assert.match(SOURCES.sessions, /onCreateWorkItem: captureSession,/u);
	assert.match(SOURCES.sessions, /onLinkWorkItem: captureSession,/u);
	assert.match(SOURCES.sessions, /onSubtasks: captureSession,/u);
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

test("lw-spike-webhook-session is the Rovo session that uses the catalog VPK mark", async () => {
	const { PULSE_TIMELINE, toPulseSessionAgent, toPulseSessionItems } = await loadSessionsHarness();
	const session = PULSE_TIMELINE.looseWork.find((item) => item.id === "lw-spike-webhook-session");
	assert.ok(session !== undefined, "fixture should include lw-spike-webhook-session");
	assert.equal(session.kind, "agent-session");
	assert.equal(session.agentId, "rovo");
	const agent = toPulseSessionAgent("rovo");
	assert.equal(agent.vpkLogo, "rovo");
	assert.equal(agent.brandName, undefined);
	const [item] = toPulseSessionItems([session], PULSE_TIMELINE.members);
	assert.equal(item.id, "lw-spike-webhook-session");
	assert.equal(item.agent.vpkLogo, "rovo");
	assert.equal(item.agent.brandName, undefined);
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

/**
 * Pulse fixture integrity — a dangling id is a rendered hole.
 *
 * The fixture is walked as data rather than asserted from source: every id it
 * references has to resolve, every active member has to have a contribution,
 * and every avatar path has to exist on disk. A 404 avatar or a work-item key
 * with nothing behind it renders as a gap in the page, which no type can catch.
 *
 * Split out of `pulse.test.js` when the continuous-article reshape pushed that
 * file past the repo's 1000-line budget. It reads only the fixture, so it was
 * the one block with no coupling to the rest of the suite.
 */

const { test } = require("node:test");

const {
	assert,
	existsSync,
	join,
	loadTimelineHarness,
} = require("./pulse-test-harness");

/* ------------------------------------------------------------------ */
/* Fixture integrity — a dangling id is a rendered hole                 */
/* ------------------------------------------------------------------ */

test("Pulse fixture resolves every id it references", async () => {
	const { PULSE_TIMELINE } = await loadTimelineHarness();
	const workItemKeys = new Set(PULSE_TIMELINE.workItems.map((item) => item.key));
	const looseWorkIds = new Set(PULSE_TIMELINE.looseWork.map((item) => item.id));
	const memberIds = new Set(PULSE_TIMELINE.members.map((member) => member.id));

	assert.equal(workItemKeys.size, PULSE_TIMELINE.workItems.length, "duplicate work-item key");
	assert.equal(looseWorkIds.size, PULSE_TIMELINE.looseWork.length, "duplicate loose-work id");
	assert.equal(memberIds.size, PULSE_TIMELINE.members.length, "duplicate member id");
	assert.equal(
		new Set(PULSE_TIMELINE.snapshots.map((snapshot) => snapshot.id)).size,
		PULSE_TIMELINE.snapshots.length,
		"duplicate snapshot id",
	);

	for (const workItem of PULSE_TIMELINE.workItems) {
		for (const memberId of workItem.memberIds) {
			assert.ok(memberIds.has(memberId), `${workItem.key} credits an unknown member "${memberId}"`);
		}
	}
	for (const item of PULSE_TIMELINE.looseWork) {
		assert.ok(item.memberIds.length > 0, `${item.id} belongs to nobody`);
		for (const memberId of item.memberIds) {
			assert.ok(memberIds.has(memberId), `${item.id} credits an unknown member "${memberId}"`);
		}
	}

	PULSE_TIMELINE.snapshots.forEach((snapshot, index) => {
		const label = `${snapshot.id} (index ${index})`;
		const artifactIds = new Set(snapshot.artifacts.map((artifact) => artifact.id));
		assert.equal(artifactIds.size, snapshot.artifacts.length, `${label} has a duplicate artifact id`);

		for (const key of snapshot.workItemKeys) {
			assert.ok(workItemKeys.has(key), `${label} references a missing work item "${key}"`);
		}
		for (const id of snapshot.looseWorkIds) {
			assert.ok(looseWorkIds.has(id), `${label} references missing loose work "${id}"`);
		}
		for (const memberId of snapshot.memberIds) {
			assert.ok(memberIds.has(memberId), `${label} references an unknown member "${memberId}"`);
		}
		for (const entry of [...snapshot.attention, ...snapshot.nextActions]) {
			if (entry.workItemKey !== undefined) {
				assert.ok(workItemKeys.has(entry.workItemKey), `${label}/${entry.id} points at "${entry.workItemKey}"`);
			}
		}
	});
});

test("Pulse fixture gives every active member a contribution that resolves", async () => {
	const { findContribution, PULSE_TIMELINE } = await loadTimelineHarness();
	const workItemKeys = new Set(PULSE_TIMELINE.workItems.map((item) => item.key));
	const looseWorkIds = new Set(PULSE_TIMELINE.looseWork.map((item) => item.id));

	PULSE_TIMELINE.snapshots.forEach((snapshot) => {
		const artifactIds = new Set(snapshot.artifacts.map((artifact) => artifact.id));

		for (const memberId of snapshot.memberIds) {
			const contribution = findContribution(snapshot, memberId);
			assert.notEqual(
				contribution,
				null,
				`${snapshot.id} lists "${memberId}" as active but has no contribution for them`,
			);
			assert.ok(
				contribution.summary.trim().length > 0,
				`${snapshot.id}/${memberId} has an empty summary`,
			);
		}

		for (const contribution of snapshot.contributions) {
			const where = `${snapshot.id}/${contribution.memberId}`;
			assert.ok(
				snapshot.memberIds.includes(contribution.memberId),
				`${where} contributes but is not listed as active`,
			);
			for (const key of contribution.workItemKeys) {
				assert.ok(workItemKeys.has(key), `${where} references a missing work item "${key}"`);
			}
			for (const id of contribution.looseWorkIds) {
				assert.ok(looseWorkIds.has(id), `${where} references missing loose work "${id}"`);
				assert.ok(snapshot.looseWorkIds.includes(id), `${where} claims loose work outside its snapshot`);
			}
			// Artifact ids are snapshot-local, so they must exist in this snapshot.
			for (const id of contribution.artifactIds) {
				assert.ok(artifactIds.has(id), `${where} references an artifact "${id}" this snapshot does not have`);
			}
		}
	});
});

test("Pulse fixture keeps the story shape the timeline mode depends on", async () => {
	const { PULSE_TIMELINE } = await loadTimelineHarness();

	assert.match(PULSE_TIMELINE.projectLabel, /^PAY · /u);
	assert.ok(PULSE_TIMELINE.snapshots.length >= 7, "the arc needs its seven decision points");

	let previousTime = Number.NEGATIVE_INFINITY;
	PULSE_TIMELINE.snapshots.forEach((snapshot) => {
		const time = new Date(snapshot.timestamp).getTime();
		assert.ok(Number.isFinite(time), `${snapshot.id} has an unparseable timestamp`);
		assert.ok(time > previousTime, `${snapshot.id} is not in chronological order`);
		previousTime = time;

		for (const field of ["chapterLabel", "dateLabel", "rangeLabel", "timeLabel", "title"]) {
			assert.ok(snapshot[field].trim().length > 0, `${snapshot.id}.${field} is empty`);
		}
		assert.equal(snapshot.paragraphs.length, 1, `${snapshot.id} should be one paragraph, not multiple`);
		assert.ok(snapshot.paragraphs[0].trim().length > 0, `${snapshot.id} has empty prose`);
		assert.doesNotMatch(snapshot.paragraphs[0], /^\s*[-•*]\s/u, `${snapshot.id} slipped into a bullet list`);
		assert.ok(snapshot.artifacts.length > 0, `${snapshot.id} produced no artifacts`);
		assert.ok(snapshot.workItemKeys.length > 0, `${snapshot.id} moved no work items`);
		assert.ok(snapshot.looseWorkIds.length > 0, `${snapshot.id} has no uncaptured work, which is the whole point`);
		assert.ok(snapshot.stats.length > 0, `${snapshot.id} has no headline numbers`);
		assert.ok(snapshot.attention.length > 0, `${snapshot.id} surfaces nothing to attend to`);
		assert.ok(snapshot.nextActions.length > 0, `${snapshot.id} offers no next best action`);
		for (const action of snapshot.nextActions) {
			assert.ok(action.actionLabel.trim().length > 0, `${snapshot.id}/${action.id} has no button copy`);
			assert.ok(action.rationale.trim().length > 0, `${snapshot.id}/${action.id} has no rationale`);
		}
		for (const signal of snapshot.attention) {
			assert.ok(
				["attention", "decision", "risk", "shipped"].includes(signal.tone),
				`${snapshot.id}/${signal.id} has an unknown tone "${signal.tone}"`,
			);
		}
	});
});

test("Pulse fixture points every avatar at a file that exists", async () => {
	const { PULSE_TIMELINE } = await loadTimelineHarness();
	const publicDir = join(process.cwd(), "public");
	const sources = new Set();

	for (const member of PULSE_TIMELINE.members) {
		assert.match(
			member.avatarSrc,
			member.kind === "agent" ? /^\/avatar-agent\//u : /^\/avatar-user\//u,
			`${member.id} uses an avatar from the wrong family`,
		);
		sources.add(member.avatarSrc);
	}
	for (const workItem of PULSE_TIMELINE.workItems) {
		if (workItem.assigneeAvatarSrc !== undefined) {
			sources.add(workItem.assigneeAvatarSrc);
		}
	}

	assert.ok(sources.size > 0);
	for (const source of sources) {
		assert.ok(source.startsWith("/"), `${source} must be an absolute public path`);
		assert.ok(existsSync(join(publicDir, source)), `${source} does not exist under public/`);
	}
});

test("Pulse work-item assignees resolve to a roster member and keep agent hex art", async () => {
	const { PULSE_TIMELINE } = await loadTimelineHarness();
	const membersById = new Map(PULSE_TIMELINE.members.map((member) => [member.id, member]));
	let agentAssignees = 0;

	for (const workItem of PULSE_TIMELINE.workItems) {
		assert.ok(workItem.assigneeId, `${workItem.key} has no assigneeId`);
		const assignee = membersById.get(workItem.assigneeId);
		assert.ok(assignee, `${workItem.key} assigneeId "${workItem.assigneeId}" is not on the roster`);
		assert.equal(assignee.name, workItem.assigneeName, `${workItem.key} assignee name does not match the roster`);
		assert.equal(assignee.avatarSrc, workItem.assigneeAvatarSrc, `${workItem.key} assignee art does not match the roster`);
		if (assignee.kind === "agent") {
			agentAssignees += 1;
			assert.match(assignee.avatarSrc, /^\/avatar-agent\//u, `${workItem.key} agent assignee uses human art`);
		} else {
			assert.match(assignee.avatarSrc, /^\/avatar-user\//u, `${workItem.key} human assignee uses agent art`);
		}
	}

	assert.ok(agentAssignees > 0, "the fixture has no agent-assigned work items");
});

test("Pulse work-item summaries are long enough to wrap to two lines at 320px", async () => {
	const { PULSE_TIMELINE } = await loadTimelineHarness();

	for (const workItem of PULSE_TIMELINE.workItems) {
		assert.doesNotMatch(workItem.summary, /<br\s*\/?>/u, `${workItem.key} uses a break hack instead of real wrap`);
		assert.ok(
			workItem.summary.length >= 54,
			`${workItem.key} summary is ${workItem.summary.length} chars and will sit on one line at 320px`,
		);
	}
});


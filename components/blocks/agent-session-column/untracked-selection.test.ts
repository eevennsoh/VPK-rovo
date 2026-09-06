import assert from "node:assert/strict";
import test from "node:test";

import type { ApproveTarget } from "../agent-session/agent-session-approve";
import type { AgentSessionItem } from "../agent-session/agent-session-types";
import type { UntrackedWorkTriage } from "../agent-session/untracked-work-triage";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { runBulkAction } from "./untracked-selection-actions.ts";
// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { buildUntrackedHeaderModel, NO_SELECTION_MARKS, reduceSelectionMarks, selectEffectiveSelection } from "./untracked-selection.ts";

function session(id: string, issueKey?: string): AgentSessionItem {
	return {
		agent: { id: "claude", kind: "agent", name: "Claude" },
		host: "local",
		id,
		sessionDetails: issueKey === undefined
			? { host: "local", issueSummary: `${id} work` }
			: { host: "local", issueKey, issueSummary: `${issueKey} work` },
		state: "complete",
		title: `${id} title`,
	};
}

test("toggle adds and removes marks without pruning the set", () => {
	const added = reduceSelectionMarks(NO_SELECTION_MARKS, { type: "toggle", id: "lw-a" });
	assert.deepEqual([...added.markedIds], ["lw-a"]);

	const both = reduceSelectionMarks(added, { type: "toggle", id: "lw-b" });
	assert.deepEqual([...both.markedIds], ["lw-a", "lw-b"]);

	const removed = reduceSelectionMarks(both, { type: "toggle", id: "lw-a" });
	assert.deepEqual([...removed.markedIds], ["lw-b"]);
});

test("clear is a no-op on an empty mark set", () => {
	assert.equal(reduceSelectionMarks(NO_SELECTION_MARKS, { type: "clear" }), NO_SELECTION_MARKS);
});

test("select-all adds visible ids and keeps marks that are already there", () => {
	const marked = reduceSelectionMarks(NO_SELECTION_MARKS, { type: "toggle", id: "lw-a" });
	const selected = reduceSelectionMarks(marked, {
		type: "select-all",
		ids: ["lw-a", "lw-b", "lw-c"],
	});

	assert.deepEqual([...selected.markedIds], ["lw-a", "lw-b", "lw-c"]);
});

test("select-all is a no-op when every id is already marked", () => {
	const marked = reduceSelectionMarks(
		reduceSelectionMarks(NO_SELECTION_MARKS, { type: "toggle", id: "lw-a" }),
		{ type: "toggle", id: "lw-b" },
	);

	assert.equal(
		reduceSelectionMarks(marked, { type: "select-all", ids: ["lw-a", "lw-b"] }),
		marked,
	);
	assert.equal(
		reduceSelectionMarks(NO_SELECTION_MARKS, { type: "select-all", ids: [] }),
		NO_SELECTION_MARKS,
	);
});

test("clear empties marks and does not invent a spotlight field", () => {
	const marked = reduceSelectionMarks(NO_SELECTION_MARKS, { type: "toggle", id: "lw-a" });
	const cleared = reduceSelectionMarks(marked, { type: "clear" });
	assert.equal(cleared, NO_SELECTION_MARKS);
	assert.equal("selectedItemId" in cleared, false);
});

test("effective selection intersects marks with visible rows in list order", () => {
	const visible = [session("lw-a", "PAY-101"), session("lw-b", "PAY-102"), session("lw-c", "PAY-103")];
	const marks = {
		markedIds: new Set(["lw-c", "lw-hidden", "lw-a"]),
	};

	const selection = selectEffectiveSelection(marks, visible);
	assert.equal(selection.kind, "active");
	if (selection.kind !== "active") {
		return;
	}

	assert.deepEqual(selection.items.map((item: AgentSessionItem) => item.id), ["lw-a", "lw-c"]);
	assert.equal(selection.items.length >= 1, true);
});

test("hidden, captured, or filtered-out marks stay in the set and stay inert", () => {
	const marks = reduceSelectionMarks(
		reduceSelectionMarks(NO_SELECTION_MARKS, { type: "toggle", id: "lw-hidden" }),
		{ type: "toggle", id: "lw-visible" },
	);
	assert.deepEqual([...marks.markedIds], ["lw-hidden", "lw-visible"]);

	const selection = selectEffectiveSelection(marks, [session("lw-visible", "PAY-101")]);
	assert.equal(selection.kind, "active");
	if (selection.kind === "active") {
		assert.deepEqual(selection.items.map((item: AgentSessionItem) => item.id), ["lw-visible"]);
	}

	assert.equal(selectEffectiveSelection(marks, [session("lw-other", "PAY-102")]).kind, "empty");
	assert.deepEqual([...marks.markedIds], ["lw-hidden", "lw-visible"]);
});

test("an empty intersection is empty, not an active selection of zero", () => {
	assert.deepEqual(
		selectEffectiveSelection({ markedIds: new Set(["lw-gone"]) }, [session("lw-a")]),
		{ kind: "empty" },
	);
	assert.deepEqual(
		selectEffectiveSelection(NO_SELECTION_MARKS, [session("lw-a")]),
		{ kind: "empty" },
	);
});

test("the browsing header keeps the host title and count", () => {
	assert.deepEqual(
		buildUntrackedHeaderModel({
			approveTargetById: new Map(),
			count: 4,
			selection: { kind: "empty" },
			title: "Untracked work",
			visibleCount: 4,
		}),
		{ kind: "browsing", title: "Untracked work", count: 4 },
	);
});

test("the selecting header counts only rows Approve can attach", () => {
	const linkable = session("lw-a", "PAY-101");
	const unknown = session("lw-b", "PAY-999");
	const captured = session("lw-c", "PAY-102");
	const approveTargetById = new Map<string, ApproveTarget<{ code: string }>>([
		["lw-a", { kind: "work-item", key: "PAY-101", target: { code: "PAY-101" } }],
		["lw-b", { kind: "unavailable", reason: "unknown-work-item" }],
		["lw-c", { kind: "unavailable", reason: "already-attached" }],
	]);

	const model = buildUntrackedHeaderModel({
		approveTargetById,
		count: 8,
		selection: { kind: "active", items: [linkable, unknown, captured] },
		title: "Untracked work",
		visibleCount: 8,
	});

	assert.equal(model.kind, "selecting");
	if (model.kind !== "selecting") {
		return;
	}

	assert.equal(model.count, 3);
	assert.equal(model.allSelected, false);
	assert.deepEqual(model.actions, [
		{
			id: "approve",
			eligibleCount: 1,
			hint: { kind: "available", text: "Link agent sessions" },
		},
		{
			id: "create",
			eligibleCount: 2,
			hint: { kind: "available", text: "Create 3 work items" },
		},
		{
			id: "archive",
			eligibleCount: 3,
			hint: { kind: "available", text: "Archive 3 agent sessions" },
		},
		{
			id: "clear",
			eligibleCount: 3,
			hint: { kind: "available", text: "Clear" },
		},
	]);
});

test("header Create copy uses selectedCount, not eligibleCount", () => {
	const linkable = session("lw-a", "PAY-101");
	const captured = session("lw-c", "PAY-102");
	const model = buildUntrackedHeaderModel({
		approveTargetById: new Map([
			["lw-a", { kind: "work-item", key: "PAY-101", target: { code: "PAY-101" } }],
			["lw-c", { kind: "unavailable", reason: "already-attached" }],
		]),
		count: 2,
		selection: { kind: "active", items: [linkable, captured] },
		title: "Untracked work",
		visibleCount: 2,
	});

	assert.equal(model.kind, "selecting");
	if (model.kind !== "selecting") {
		return;
	}

	const create = model.actions.find((action) => action.id === "create");
	assert.equal(create?.eligibleCount, 1);
	assert.deepEqual(create?.hint, { kind: "available", text: "Create 2 work items" });
});

test("the selecting header is all-selected only when every visible row is marked", () => {
	const first = session("lw-a", "PAY-101");
	const second = session("lw-b", "PAY-102");
	const partial = buildUntrackedHeaderModel({
		approveTargetById: new Map(),
		count: 2,
		selection: { kind: "active", items: [first] },
		title: "Untracked work",
		visibleCount: 2,
	});
	const complete = buildUntrackedHeaderModel({
		approveTargetById: new Map(),
		count: 2,
		selection: { kind: "active", items: [first, second] },
		title: "Untracked work",
		visibleCount: 2,
	});

	assert.equal(partial.kind, "selecting");
	assert.equal(complete.kind, "selecting");
	if (partial.kind !== "selecting" || complete.kind !== "selecting") {
		return;
	}

	assert.equal(partial.allSelected, false);
	assert.equal(complete.allSelected, true);
});

test("header copy table pins exact available and unavailable strings", () => {
	const captured = session("lw-c", "PAY-102");
	const model = buildUntrackedHeaderModel({
		approveTargetById: new Map([
			["lw-c", { kind: "unavailable", reason: "already-attached" }],
		]),
		count: 1,
		selection: { kind: "active", items: [captured] },
		title: "Untracked work",
		visibleCount: 1,
	});

	assert.equal(model.kind, "selecting");
	if (model.kind !== "selecting") {
		return;
	}

	assert.deepEqual(model.actions.map((action) => action.hint), [
		{ kind: "unavailable", text: "No selected sessions have a work item to link" },
		{ kind: "unavailable", text: "No selected sessions can create a work item" },
		{ kind: "available", text: "Archive 1 agent session" },
		{ kind: "available", text: "Clear" },
	]);
});

test("the selecting header Unarchives when the archived view is open", () => {
	const captured = session("lw-c", "PAY-102");
	const model = buildUntrackedHeaderModel({
		approveTargetById: new Map([
			["lw-c", { kind: "unavailable", reason: "already-attached" }],
		]),
		count: 1,
		selection: { kind: "active", items: [captured] },
		title: "Archived",
		visibleCount: 1,
		visibilityLabel: "Unarchive",
	});

	assert.equal(model.kind, "selecting");
	if (model.kind !== "selecting") {
		return;
	}

	const archive = model.actions.find((action) => action.id === "archive");
	assert.deepEqual(archive?.hint, { kind: "available", text: "Unarchive 1 agent session" });
});

test("bulk approve attaches the located target and skips unavailable rows", () => {
	const linkable = session("lw-a", "PAY-101");
	const unknown = session("lw-b", "PAY-999");
	const located = { code: "PAY-101" };
	const attached: Array<readonly [string, { code: string }]> = [];
	const triage: UntrackedWorkTriage<{ code: string }> = {
		archive: () => undefined,
		attach: (item: AgentSessionItem, target: { code: string }) => {
			attached.push([item.id, target]);
		},
		createFrom: () => undefined,
		locateTarget: () => located,
	};

	runBulkAction("approve", { kind: "active", items: [linkable, unknown] }, {
		approveTargetById: new Map([
			["lw-a", { kind: "work-item", key: "PAY-101", target: located }],
			["lw-b", { kind: "unavailable", reason: "unknown-work-item" }],
		]),
		triage,
	});

	assert.deepEqual(attached, [["lw-a", located]]);
	assert.equal(attached[0]?.[1], located);
});

test("bulk create and archive skip ineligible rows and ignore an empty selection", () => {
	const open = session("lw-a", "PAY-101");
	const captured = session("lw-c", "PAY-102");
	const created: string[] = [];
	const archived: string[] = [];
	const triage: UntrackedWorkTriage<{ code: string }> = {
		archive: (item: AgentSessionItem) => {
			archived.push(item.id);
		},
		attach: () => undefined,
		createFrom: (item: AgentSessionItem) => {
			created.push(item.id);
		},
		locateTarget: () => undefined,
	};
	const approveTargetById = new Map<string, ApproveTarget<{ code: string }>>([
		["lw-a", { kind: "unavailable", reason: "no-suggestion" }],
		["lw-c", { kind: "unavailable", reason: "already-attached" }],
	]);

	runBulkAction("create", { kind: "active", items: [open, captured] }, {
		approveTargetById,
		triage,
	});
	runBulkAction("archive", { kind: "active", items: [open, captured] }, {
		approveTargetById,
		triage,
	});
	runBulkAction("approve", { kind: "empty" }, { approveTargetById, triage });

	assert.deepEqual(created, ["lw-a"]);
	assert.deepEqual(archived, ["lw-a", "lw-c"]);
});

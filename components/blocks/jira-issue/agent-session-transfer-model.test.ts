import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { filterJiraIssueMoveWorkItems, getJiraIssueMoveMenuRows, resolveNearestDropZone } from "./agent-session-transfer-model.ts";

const WORK_ITEMS = [
	{ key: "PAY-105", summary: "Payment retry banner", type: "Task" },
	{ key: "PAY-212", summary: "Refund ledger drift", type: "Bug" },
	{ key: "BILL-8", summary: "Invoice export payload", type: "Story" },
] as const;

test("an empty query returns every work item unfiltered", () => {
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, ""), WORK_ITEMS);
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "   "), WORK_ITEMS);
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "\t\n"), WORK_ITEMS);
});

test("filtering an empty work item list returns an empty list", () => {
	assert.deepEqual(filterJiraIssueMoveWorkItems([], ""), []);
	assert.deepEqual(filterJiraIssueMoveWorkItems([], "pay"), []);
});

test("a query that matches nothing returns an empty list", () => {
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "zzz"), []);
});

test("matching is case-insensitive across the key and the summary", () => {
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "pay-105"), [WORK_ITEMS[0]]);
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "REFUND"), [WORK_ITEMS[1]]);
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "LeDgEr"), [WORK_ITEMS[1]]);
});

test("a query matches across the key and summary boundary", () => {
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "PAY-105 Payment"), [WORK_ITEMS[0]]);
});

test("a shared substring keeps every matching work item in source order", () => {
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "pay"), [
		WORK_ITEMS[0],
		WORK_ITEMS[1],
		WORK_ITEMS[2],
	]);
});

test("the query is trimmed before matching", () => {
	assert.deepEqual(filterJiraIssueMoveWorkItems(WORK_ITEMS, "  refund  "), [WORK_ITEMS[1]]);
});

test("menu rows carry the heading on the first row only", () => {
	assert.deepEqual(getJiraIssueMoveMenuRows(WORK_ITEMS, "pay", "Recent work items"), [
		{
			description: "PAY-105",
			headingLabel: "Recent work items",
			id: "PAY-105",
			label: "Payment retry banner",
		},
		{ description: "PAY-212", id: "PAY-212", label: "Refund ledger drift" },
		{ description: "BILL-8", id: "BILL-8", label: "Invoice export payload" },
	]);
});

test("only the first menu row owns a headingLabel key", () => {
	const rows = getJiraIssueMoveMenuRows(WORK_ITEMS, "", "Recent work items");

	assert.equal(rows.length, 3);
	assert.deepEqual(
		rows.map((row: { headingLabel?: string }) => Object.hasOwn(row, "headingLabel")),
		[true, false, false],
	);
});

test("a single match still receives the heading", () => {
	assert.deepEqual(getJiraIssueMoveMenuRows(WORK_ITEMS, "BILL", "Recent work items"), [
		{
			description: "BILL-8",
			headingLabel: "Recent work items",
			id: "BILL-8",
			label: "Invoice export payload",
		},
	]);
});

test("an empty result set produces no rows and therefore no orphan heading", () => {
	assert.deepEqual(getJiraIssueMoveMenuRows(WORK_ITEMS, "zzz", "Recent work items"), []);
	assert.deepEqual(getJiraIssueMoveMenuRows([], "", "Recent work items"), []);
});

const UNLINK_ZONE = { id: "unlink", rect: { bottom: 40, left: 0, right: 100, top: 0 } } as const;
const MOVE_ZONE = { id: "move", rect: { bottom: 140, left: 0, right: 100, top: 100 } } as const;
const ZONES = [UNLINK_ZONE, MOVE_ZONE] as const;

test("a pointer inside a rect resolves to that zone", () => {
	assert.equal(resolveNearestDropZone({ x: 50, y: 20 }, ZONES, 12), "unlink");
	assert.equal(resolveNearestDropZone({ x: 50, y: 120 }, ZONES, 12), "move");
});

test("a pointer outside the rect but inside the halo still resolves", () => {
	assert.equal(resolveNearestDropZone({ x: 50, y: 48 }, ZONES, 12), "unlink");
	assert.equal(resolveNearestDropZone({ x: -10, y: 20 }, ZONES, 12), "unlink");
	assert.equal(resolveNearestDropZone({ x: 50, y: 92 }, ZONES, 12), "move");
});

test("halo edges are inclusive", () => {
	assert.equal(resolveNearestDropZone({ x: 50, y: 52 }, [UNLINK_ZONE], 12), "unlink");
	assert.equal(resolveNearestDropZone({ x: 50, y: 53 }, [UNLINK_ZONE], 12), null);
});

test("a pointer outside every halo resolves to null", () => {
	assert.equal(resolveNearestDropZone({ x: 50, y: 70 }, ZONES, 12), null);
	assert.equal(resolveNearestDropZone({ x: 500, y: 500 }, ZONES, 12), null);
});

test("overlapping halos tie-break on the smallest centre distance", () => {
	const overlappingZones = [UNLINK_ZONE, MOVE_ZONE] as const;

	// y = 68 sits inside both halos (unlink halo ends at 80, move halo starts at 60)
	// but is nearer the unlink centre (20) than the move centre (120).
	assert.equal(resolveNearestDropZone({ x: 50, y: 68 }, overlappingZones, 40), "unlink");
	// y = 72 flips the nearer centre to move.
	assert.equal(resolveNearestDropZone({ x: 50, y: 72 }, overlappingZones, 40), "move");
});

test("an exact centre-distance tie resolves to the earlier zone", () => {
	assert.equal(resolveNearestDropZone({ x: 50, y: 70 }, ZONES, 40), "unlink");
	assert.equal(resolveNearestDropZone({ x: 50, y: 70 }, [MOVE_ZONE, UNLINK_ZONE], 40), "move");
});

test("an empty zone list resolves to null", () => {
	assert.equal(resolveNearestDropZone({ x: 50, y: 20 }, [], 12), null);
	assert.equal(resolveNearestDropZone({ x: 50, y: 20 }, []), null);
});

test("the halo defaults to zero so only rect containment matches", () => {
	assert.equal(resolveNearestDropZone({ x: 50, y: 40 }, [UNLINK_ZONE]), "unlink");
	assert.equal(resolveNearestDropZone({ x: 50, y: 41 }, [UNLINK_ZONE]), null);
});

import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { buildMemoryArtifactSelection, resolveExplicitMemoryArtifactNode } from "./memory-artifact-selection.ts";

const SELECTED_NODE = {
	id: "canonical:work",
	title: "Work Context",
};

test("memory artifact selection preserves the full filtered view when no node was explicitly selected", () => {
	assert.deepEqual(
		buildMemoryArtifactSelection({
			kind: "brief",
			selectedNode: SELECTED_NODE,
			selectedNodeId: null,
		}),
		{
			selectedNodeIds: [],
			title: "Memory Explorer Brief",
		},
	);
});

test("explicit memory artifact node resolution does not fall back to the first visible node", () => {
	assert.equal(resolveExplicitMemoryArtifactNode([SELECTED_NODE], null), null);
	assert.equal(resolveExplicitMemoryArtifactNode([SELECTED_NODE], "proposal:missing"), null);
	assert.deepEqual(resolveExplicitMemoryArtifactNode([SELECTED_NODE], "canonical:work"), SELECTED_NODE);
});

test("memory artifact selection targets an explicitly selected node", () => {
	assert.deepEqual(
		buildMemoryArtifactSelection({
			kind: "deck",
			selectedNode: SELECTED_NODE,
			selectedNodeId: "canonical:work",
		}),
		{
			selectedNodeIds: ["canonical:work"],
			title: "Work Context deck",
		},
	);
});

test("memory artifact selection falls back to the full filtered view for stale selections", () => {
	assert.deepEqual(
		buildMemoryArtifactSelection({
			kind: "brief",
			selectedNode: SELECTED_NODE,
			selectedNodeId: "proposal:missing",
		}),
		{
			selectedNodeIds: [],
			title: "Memory Explorer Brief",
		},
	);
});

const assert = require("node:assert/strict");
const test = require("node:test");

async function loadRouting() {
	return import("./activity-composer-session-routing.ts");
}

function session(overrides = {}) {
	return {
		id: "session-1",
		agentId: "agent-one",
		agentName: "Agent One",
		status: "running",
		...overrides,
	};
}

test("steers only the latest active sessions named by whole agent and skill tokens", async () => {
	const { findSteeredWorkingSessions } = await loadRouting();
	const sessions = [
		session({ id: "agent-one-earlier" }),
		session({ id: "agent-two-completed", agentId: "agent-two", agentName: "Agent Two", status: "completed" }),
		session({ id: "agent-one-latest", status: "waiting" }),
		session({ id: "summarize-earlier", agentId: "skill:summarize", agentName: "Rovo", title: "Summarize comments" }),
		session({ id: "summarize-latest", agentId: "skill:summarize", agentName: "Rovo", title: "Summarize comments", status: "waiting" }),
	];

	const steered = findSteeredWorkingSessions(
		sessions,
		"email@Agent One and /Summarize commentsLater stay plain text; @Agent One and /Summarize comments receive this.",
	);

	assert.deepEqual(steered.map((entry) => entry.id), ["summarize-latest", "agent-one-latest"]);
});

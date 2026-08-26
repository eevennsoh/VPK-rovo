const assert = require("node:assert/strict");
const test = require("node:test");

async function loadChatContext() {
	return import("./pulse-chat-context.ts");
}

test("Pulse chat context names the week, or the scoped epic/sprint", async () => {
	const { toPulseChatContextBar } = await loadChatContext();

	assert.deepEqual(toPulseChatContextBar(null, "Payments SDK v2"), {
		iconName: "board",
		label: "Payments SDK v2",
		showDismissPlaceholder: false,
		signature: "pulse-week",
	});

	assert.deepEqual(
		toPulseChatContextBar(
			{
				kind: "epic",
				id: "epic-pay-90",
				key: "PAY-90",
				name: "Retire LegacyGatewayAdapter",
				goal: "Delete the adapter.",
				targetDate: "12 Sep 2026",
				targetNote: "three weeks out",
				workItemKeys: ["PAY-101"],
				segments: [],
				children: [],
			},
			"Payments SDK v2",
		),
		{
			iconName: "work-item",
			label: "PAY-90: Retire LegacyGatewayAdapter",
			showDismissPlaceholder: false,
			signature: "pulse-scope:epic-pay-90",
		},
	);
});

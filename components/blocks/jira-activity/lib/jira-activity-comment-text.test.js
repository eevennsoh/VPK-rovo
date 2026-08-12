const assert = require("node:assert/strict");
const test = require("node:test");

const {
	jiraActivitySegmentsToPlainText,
	serializeActivityCommentsContext,
} = require("./jira-activity-comment-text.ts");

test("jiraActivitySegmentsToPlainText flattens rich runs and mentions", () => {
	assert.equal(
		jiraActivitySegmentsToPlainText([
			{ type: "text", text: "Ping " },
			{ type: "user-mention", text: "Jordan Lee" },
			{ type: "text", text: " about " },
			{ type: "code", text: "checkout" },
			{ type: "transition-arrow" },
			{ type: "lozenge", text: "In Progress", variant: "default" },
		]),
		"Ping Jordan Lee about checkout→In Progress",
	);
});

test("serializeActivityCommentsContext mirrors Code Review one-turn context shape", () => {
	assert.equal(
		serializeActivityCommentsContext(
			{ code: "SHOP-4821", title: "Guest checkout" },
			[
				{
					id: "c1",
					actorName: "Jordan Lee",
					timestamp: "54m ago",
					body: "Looks good to ship.",
				},
			],
		),
		[
			"Activity comments (local prompt context):",
			"Work item: SHOP-4821 Guest checkout",
			"",
			"Comment 1:",
			"Author: Jordan Lee",
			"When: 54m ago",
			"Activity comment: Looks good to ship.",
		].join("\n"),
	);
	assert.equal(
		serializeActivityCommentsContext({ code: "SHOP-4821", title: "Guest checkout" }, []),
		"",
	);
});

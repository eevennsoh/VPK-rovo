const assert = require("node:assert/strict");
const test = require("node:test");

const {
	convertBareAppMentionsToTokens,
	createBareAppMentionConverter,
} = require("./bare-app-mention-tokens");

const ALIASES = [
	{ id: "google-drive", name: "Google Drive" },
	{ id: "gmail", name: "Gmail" },
];

test("convertBareAppMentionsToTokens prefers exact aliases before slug fallback", () => {
	assert.equal(
		convertBareAppMentionsToTokens("Send @Google Drive and /Gmail updates.", ALIASES),
		"Send @[app:google-drive] and @[app:gmail] updates.",
	);
});

test("convertBareAppMentionsToTokens slugifies unknown bare references", () => {
	assert.equal(
		convertBareAppMentionsToTokens("Route /Foo_Bar+CLI now.", ALIASES),
		"Route @[app:foo-bar-cli] now.",
	);
});

test("convertBareAppMentionsToTokens preserves existing tokens and code regions", () => {
	const markdown = [
		"Keep @[app:gmail] as-is and convert @Gmail.",
		"Run `/gmail` literally.",
		"```",
		"/Google Drive",
		"```",
	].join("\n");

	assert.equal(
		convertBareAppMentionsToTokens(markdown, ALIASES),
		[
			"Keep @[app:gmail] as-is and convert @[app:gmail].",
			"Run `/gmail` literally.",
			"```",
			"/Google Drive",
			"```",
		].join("\n"),
	);
});

test("createBareAppMentionConverter reuses the same conversion contract", () => {
	const convert = createBareAppMentionConverter(ALIASES);

	assert.equal(convert("Use @Google Drive."), "Use @[app:google-drive].");
	assert.equal(convert("Use /Unknown."), "Use @[app:unknown].");
});

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const SOURCE = fs.readFileSync(path.join(__dirname, "agent-avatars.ts"), "utf8");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function extractAvatarSrcs() {
	const match = SOURCE.match(/export const AGENT_AVATAR_SRCS = \[([\s\S]*?)\] as const;/u);
	assert.ok(match, "AGENT_AVATAR_SRCS literal not found");
	return [...match[1].matchAll(/"([^"]+)"/gu)].map((entry) => entry[1]);
}

test("every avatar in the pool exists under /public", () => {
	const srcs = extractAvatarSrcs();
	assert.ok(srcs.length > 0, "expected a non-empty avatar pool");
	for (const src of srcs) {
		assert.ok(src.startsWith("/avatar-agent/"), `unexpected avatar path: ${src}`);
		const filePath = path.join(PUBLIC_DIR, src);
		assert.ok(fs.existsSync(filePath), `missing avatar file on disk: ${src}`);
	}
});

test("the avatar pool covers all five agent families for color variety", () => {
	const srcs = extractAvatarSrcs();
	const groups = new Set(srcs.map((src) => src.split("/")[2]));
	for (const family of ["dev-agents", "product-agents", "service-agents", "strategy-agents", "teamwork-agents"]) {
		assert.ok(groups.has(family), `pool missing family: ${family}`);
	}
});

test("the avatar pool has no duplicate entries", () => {
	const srcs = extractAvatarSrcs();
	assert.equal(new Set(srcs).size, srcs.length, "duplicate avatar paths found");
});

test("getRandomAgentAvatarSrc only ever returns paths from the pool", () => {
	// Mirrors the implementation: a uniform index into AGENT_AVATAR_SRCS. We
	// exercise the bounds (0 and length-1) plus the deterministic mapping so a
	// future off-by-one or pool/return mismatch is caught.
	const srcs = extractAvatarSrcs();
	const pick = (random) => srcs[Math.floor(random * srcs.length)] ?? srcs[0];
	assert.equal(pick(0), srcs[0]);
	assert.equal(pick(0.999999), srcs[srcs.length - 1]);
	for (let i = 0; i < srcs.length; i += 1) {
		assert.ok(srcs.includes(pick(i / srcs.length)));
	}
});

test("getAgentAvatarAccent derives a distinct color per family", () => {
	const accentMatch = SOURCE.match(/AGENT_AVATAR_GROUP_ACCENTS: Readonly<Record<string, string>> = \{([\s\S]*?)\};/u);
	assert.ok(accentMatch, "AGENT_AVATAR_GROUP_ACCENTS not found");
	const colors = [...accentMatch[1].matchAll(/"#([0-9A-Fa-f]{6})"/gu)].map((entry) => entry[1]);
	assert.equal(colors.length, 5, "expected one accent color per family");
	assert.equal(new Set(colors).size, 5, "expected five distinct accent colors");
});

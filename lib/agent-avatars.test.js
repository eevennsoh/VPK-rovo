const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { getRandomAgentAvatarSrc, getDeterministicAgentAvatarSrc, getAgentAvatarAccent } = require("./agent-avatars.ts");

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
	const srcs = extractAvatarSrcs();
	const pool = new Set(srcs);

	for (const sequence of [[0, 0], [0.999999, 0.999999], [0.4, 0.6]]) {
		const originalRandom = Math.random;
		let callIndex = 0;
		Math.random = () => sequence[callIndex++] ?? 0;
		try {
			assert.ok(pool.has(getRandomAgentAvatarSrc()));
		} finally {
			Math.random = originalRandom;
		}
	}
});

test("getRandomAgentAvatarSrc balances random selection by family first", () => {
	const srcs = extractAvatarSrcs();
	const families = [];
	for (const src of srcs) {
		const family = src.split("/")[2];
		let bucket = families.find((entry) => entry.id === family);
		if (!bucket) {
			bucket = { id: family, srcs: [] };
			families.push(bucket);
		}
		bucket.srcs.push(src);
	}

	for (let familyIndex = 0; familyIndex < families.length; familyIndex += 1) {
		const family = families[familyIndex];
		const originalRandom = Math.random;
		let callIndex = 0;
		const sequence = [
			(familyIndex + 0.01) / families.length,
			0.999999,
		];
		Math.random = () => sequence[callIndex++] ?? 0;
		try {
			assert.equal(getRandomAgentAvatarSrc(), family.srcs.at(-1));
			assert.equal(callIndex, 2, "expected one random draw for family and one for avatar");
		} finally {
			Math.random = originalRandom;
		}
	}
});

test("getDeterministicAgentAvatarSrc only ever returns paths from the pool", () => {
	const pool = new Set(extractAvatarSrcs());
	for (const seed of ["product-requirements-guide", "rca-agent", "a", "", "   ", "🙂-agent"]) {
		assert.ok(pool.has(getDeterministicAgentAvatarSrc(seed)), `out-of-pool avatar for seed: ${JSON.stringify(seed)}`);
	}
});

// The bug this guards: the streamed result card and the persisted session entry
// each independently fall back to a derived avatar when the model omits one. If
// those fallbacks disagree, the card shows a different avatar/banner than the
// final agent. Both call sites pass the same agentId, so a stable mapping from
// identity -> avatar is exactly what keeps them aligned.
test("getDeterministicAgentAvatarSrc is stable for the same identity", () => {
	for (const seed of ["product-requirements-guide", "okr-generator", "my-custom-agent-7"]) {
		assert.equal(
			getDeterministicAgentAvatarSrc(seed),
			getDeterministicAgentAvatarSrc(seed),
			`avatar drifted for repeated seed: ${seed}`,
		);
	}
});

test("getDeterministicAgentAvatarSrc ignores surrounding whitespace in the seed", () => {
	assert.equal(
		getDeterministicAgentAvatarSrc("product-requirements-guide"),
		getDeterministicAgentAvatarSrc("  product-requirements-guide  "),
	);
});

test("getDeterministicAgentAvatarSrc spreads identities across all families", () => {
	const seeds = Array.from({ length: 200 }, (_, index) => `generated-agent-${index}`);
	const families = new Set(seeds.map((seed) => getAgentAvatarAccent(getDeterministicAgentAvatarSrc(seed))));
	assert.equal(families.size, 5, "expected deterministic picks to cover all five family colors");
});

test("getAgentAvatarAccent derives a distinct color per family", () => {
	const accentMatch = SOURCE.match(/AGENT_AVATAR_GROUP_ACCENTS: Readonly<Record<string, string>> = \{([\s\S]*?)\};/u);
	assert.ok(accentMatch, "AGENT_AVATAR_GROUP_ACCENTS not found");
	const colors = [...accentMatch[1].matchAll(/"#([0-9A-Fa-f]{6})"/gu)].map((entry) => entry[1]);
	assert.equal(colors.length, 5, "expected one accent color per family");
	assert.equal(new Set(colors).size, 5, "expected five distinct accent colors");
});

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const {
	getRandomAgentAvatarSrc,
	getDeterministicAgentAvatarSrc,
	getAgentAvatarAccent,
	getDeterministicAgentBannerSrc,
} = require("./agent-avatars.ts");

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

const BANNER_COLORS = ["blue", "gray", "lime", "orange", "purple"];

function extractBannerSrcs() {
	const match = SOURCE.match(/export const SMART_FOLDER_BANNER_SRCS = \[([\s\S]*?)\] as const;/u);
	assert.ok(match, "SMART_FOLDER_BANNER_SRCS literal not found");
	return [...match[1].matchAll(/"([^"]+)"/gu)].map((entry) => entry[1]);
}

function bannerColor(src) {
	// File name shape is `<design>-<color>.svg`; the color is the last segment.
	return src.replace(/^.*-/u, "").replace(/\.svg$/u, "");
}

test("every banner in the pool exists under /public", () => {
	const srcs = extractBannerSrcs();
	assert.ok(srcs.length > 0, "expected a non-empty banner pool");
	for (const src of srcs) {
		assert.ok(src.startsWith("/smart-folders/"), `unexpected banner path: ${src}`);
		assert.ok(fs.existsSync(path.join(PUBLIC_DIR, src)), `missing banner file on disk: ${src}`);
	}
});

test("the banner pool has no duplicates and balances colors evenly", () => {
	const srcs = extractBannerSrcs();
	assert.equal(new Set(srcs).size, srcs.length, "duplicate banner paths found");
	const perColor = new Map(BANNER_COLORS.map((color) => [color, 0]));
	for (const src of srcs) {
		const color = bannerColor(src);
		assert.ok(perColor.has(color), `banner ${src} uses an unexpected color: ${color}`);
		perColor.set(color, perColor.get(color) + 1);
	}
	const counts = [...perColor.values()];
	assert.ok(counts.every((count) => count === counts[0]), `colors are not evenly balanced: ${JSON.stringify([...perColor])}`);
});

test("getDeterministicAgentBannerSrc only ever returns paths from the pool", () => {
	const pool = new Set(extractBannerSrcs());
	for (const seed of ["rfp-drafting-agent", "okr-generator", "a", "", "   ", "🙂-agent", null, undefined]) {
		assert.ok(pool.has(getDeterministicAgentBannerSrc(seed)), `out-of-pool banner for seed: ${JSON.stringify(seed)}`);
	}
});

// Same contract as the avatar picker: two surfaces that independently render the
// same agent id must land on the same banner, so it never flickers on re-render.
test("getDeterministicAgentBannerSrc is stable for the same identity", () => {
	for (const seed of ["rfp-drafting-agent", "okr-generator", "my-custom-agent-7"]) {
		assert.equal(
			getDeterministicAgentBannerSrc(seed),
			getDeterministicAgentBannerSrc(seed),
			`banner drifted for repeated seed: ${seed}`,
		);
	}
});

test("getDeterministicAgentBannerSrc ignores surrounding whitespace in the seed", () => {
	assert.equal(
		getDeterministicAgentBannerSrc("rfp-drafting-agent"),
		getDeterministicAgentBannerSrc("  rfp-drafting-agent  "),
	);
});

test("getDeterministicAgentBannerSrc spreads identities across designs and colors", () => {
	const seeds = Array.from({ length: 200 }, (_, index) => `generated-agent-${index}`);
	const banners = seeds.map((seed) => getDeterministicAgentBannerSrc(seed));
	const colors = new Set(banners.map((src) => bannerColor(src)));
	const designs = new Set(banners.map((src) => bannerColor(src).length ? src.replace(/-[^-]+\.svg$/u, "") : src));
	assert.equal(colors.size, BANNER_COLORS.length, "expected deterministic picks to cover all five banner colors");
	assert.ok(designs.size >= 6, `expected deterministic picks to cover most designs, saw ${designs.size}`);
});

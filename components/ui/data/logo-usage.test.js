import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import {
	THIRD_PARTY_BORDERLESS_LOGO_IDS,
	resolveBrandLogoPresentation,
	resolveAtlassianLogoBorder,
} from "./logo-usage.ts";

const here = dirname(fileURLToPath(import.meta.url));
// components/ui/data -> repo root -> public/3p
const THIRD_PARTY_DIR = join(here, "..", "..", "..", "public", "3p");

/**
 * The borderless ID list in logo-usage.json is a hand-maintained mirror of which
 * `/public/3p/<id>/` folders ship a `16-borderless.svg`. If a new 3P asset is
 * added (or a borderless variant added/removed) without updating the JSON, the
 * border treatment silently breaks — so assert the list equals on-disk reality.
 */
test("THIRD_PARTY_BORDERLESS_LOGO_IDS matches the folders shipping 16-borderless.svg", () => {
	const onDisk = readdirSync(THIRD_PARTY_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.filter((entry) => existsSync(join(THIRD_PARTY_DIR, entry.name, "16-borderless.svg")))
		.map((entry) => entry.name)
		.sort();

	const inSet = [...THIRD_PARTY_BORDERLESS_LOGO_IDS].sort();

	assert.deepEqual(
		inSet,
		onDisk,
		"borderlessIds in components/ui/data/logo-usage.json is out of sync with " +
			"/public/3p. Update the JSON to match the folders containing a 16-borderless.svg.",
	);
});

test("2P partner logos always get a bordered tile, src unchanged", () => {
	assert.deepEqual(resolveBrandLogoPresentation("/2p/appfire.png"), {
		src: "/2p/appfire.png",
		hasBorder: true,
	});
});

test("white-tile 3P logos swap to the borderless variant and get a border", () => {
	assert.deepEqual(resolveBrandLogoPresentation("/3p/airtable/20.svg"), {
		src: "/3p/airtable/16-borderless.svg",
		hasBorder: true,
	});
});

test("solid-fill 3P logos render bare (no border), src unchanged", () => {
	assert.deepEqual(resolveBrandLogoPresentation("/3p/github/24.svg"), {
		src: "/3p/github/24.svg",
		hasBorder: false,
	});
});

test("unknown logo paths fall back to no border, src unchanged", () => {
	assert.deepEqual(resolveBrandLogoPresentation("/illustration/foo.svg"), {
		src: "/illustration/foo.svg",
		hasBorder: false,
	});
});

test("the Atlassian master logo (no solid background) gets a bordered tile", () => {
	assert.equal(resolveAtlassianLogoBorder("atlassian"), true);
});

test("solid-background 1P product logos render bare (no border)", () => {
	for (const name of ["jira", "confluence", "loom", "trello", "compass"]) {
		assert.equal(
			resolveAtlassianLogoBorder(name),
			false,
			`expected ${name} to render without a border`,
		);
	}
});

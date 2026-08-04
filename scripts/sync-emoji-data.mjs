#!/usr/bin/env node
// Copies the two Emojibase JSON files that `frimousse` fetches at runtime out of
// the `emojibase-data` dev dependency and into `public/emoji-data/en/`, so the
// picker can be pointed at a same-origin `emojibaseUrl="/emoji-data"` instead of
// a CDN. The copies are committed — this is a manual sync, not a build step, so
// the static export stays self-contained with no extra pipeline.
//
// frimousse requests exactly `${emojibaseUrl}/${locale}/data.json` and
// `${emojibaseUrl}/${locale}/messages.json` (plus a HEAD on each for etag
// revalidation), so only those two files are needed per locale.
//
// Run via `pnpm run sync:emoji-data`.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packageDir = join(rootDir, "node_modules", "emojibase-data");
const locale = "en";
const files = ["data.json", "messages.json"];

const sourceDir = join(packageDir, locale);
const targetDir = join(rootDir, "public", "emoji-data", locale);

function fail(message) {
	console.error(`sync:emoji-data — ${message}`);
	process.exit(1);
}

if (!existsSync(packageDir)) {
	fail("`emojibase-data` is not installed. Run `pnpm install` first.");
}

const missing = files.filter((file) => !existsSync(join(sourceDir, file)));
if (missing.length > 0) {
	fail(`missing source file(s) in ${sourceDir}: ${missing.join(", ")}. Reinstall \`emojibase-data\`.`);
}

let version = "unknown";
try {
	version = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")).version ?? "unknown";
} catch {
	// A missing or unreadable manifest is not fatal — the JSON files are what matter.
}

mkdirSync(targetDir, { recursive: true });

console.log(`Syncing emojibase-data@${version} (${locale}) → public/emoji-data/${locale}/`);

for (const file of files) {
	const source = join(sourceDir, file);
	const target = join(targetDir, file);
	copyFileSync(source, target);

	const bytes = statSync(target).size;
	const kilobytes = (bytes / 1024).toFixed(1);
	console.log(`  ✓ ${file} — ${bytes.toLocaleString("en-US")} bytes (${kilobytes} KB)`);
}

console.log(`Done. Commit public/emoji-data/${locale}/ so the static export stays self-contained.`);

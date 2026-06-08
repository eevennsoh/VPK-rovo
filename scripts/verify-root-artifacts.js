#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const BLOCKED_ROOT_PATHS = new Set([
	"--full-page",
	"--out",
	"--output",
]);

const ROOT_IMAGE_PATTERN = /^[^/]+\.(?:png|jpe?g|gif|webp|bmp|tiff?|avif|hei[cf])$/iu;

function findBlockedRootArtifacts(trackedFiles) {
	return trackedFiles.filter((filePath) => {
		return BLOCKED_ROOT_PATHS.has(filePath) || ROOT_IMAGE_PATTERN.test(filePath);
	});
}

function main() {
	const result = spawnSync("git", ["ls-files"], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "inherit"],
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	const blockedFiles = findBlockedRootArtifacts(result.stdout.split("\n").filter(Boolean));

	if (blockedFiles.length === 0) {
		console.log("Verified no tracked root-level screenshot artifacts");
		return;
	}

	console.error("Tracked root-level screenshot artifacts are not allowed:");
	for (const filePath of blockedFiles) {
		console.error(`- ${filePath}`);
	}
	console.error("Move browser screenshots under output/agent-browser/ instead.");
	process.exitCode = 1;
}

if (require.main === module) {
	main();
}

module.exports = {
	findBlockedRootArtifacts,
};

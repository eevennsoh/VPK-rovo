const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const {
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const test = require("node:test");

const SCRIPT_PATH = join(__dirname, "create-env-local.js");

function runSetup(existingEnv = "") {
	const workingDirectory = mkdtempSync(join(tmpdir(), "vpk-setup-env-"));
	writeFileSync(join(workingDirectory, ".asap-config"), JSON.stringify({
		privateKey: "fixture-private-key",
		kid: "fixture-kid",
		issuer: "fixture-issuer",
	}));
	if (existingEnv) {
		writeFileSync(join(workingDirectory, ".env.local"), existingEnv);
	}

	try {
		execFileSync(
			process.execPath,
			[SCRIPT_PATH, "fixture-use-case", "fixture@atlassian.com"],
			{ cwd: workingDirectory, stdio: "pipe" },
		);
		return readFileSync(join(workingDirectory, ".env.local"), "utf8");
	} finally {
		rmSync(workingDirectory, { recursive: true, force: true });
	}
}

test("writes the current Google image model for a fresh environment", () => {
	assert.match(runSetup(), /^GOOGLE_IMAGE_MODEL=gemini-3-pro-image$/mu);
});

test("preserves an explicitly configured Google image model", () => {
	assert.match(
		runSetup("GOOGLE_IMAGE_MODEL=custom-image-model\n"),
		/^GOOGLE_IMAGE_MODEL=custom-image-model$/mu,
	);
});

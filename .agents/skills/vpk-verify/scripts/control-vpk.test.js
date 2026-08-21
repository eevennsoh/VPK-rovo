const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const CONTROL_VPK = path.join(__dirname, "control-vpk");
const { resolveAgentBrowserBin } = require(CONTROL_VPK);

test("resolves agent-browser from this worktree, not PATH", () => {
	const bin = resolveAgentBrowserBin();
	assert.equal(path.isAbsolute(bin), true);
	assert.ok(existsSync(bin), `missing worktree agent-browser bin: ${bin}`);
	assert.match(bin, /node_modules[/].*agent-browser[/]bin[/]agent-browser\.js$/u);
});

test("fails with pnpm install guidance when agent-browser is not in the worktree", () => {
	const repoRoot = mkdtempSync(path.join(os.tmpdir(), "control-vpk-no-agent-browser-"));
	try {
		assert.throws(
			() => resolveAgentBrowserBin(repoRoot),
			/pnpm install/u,
		);
	} finally {
		rmSync(repoRoot, { recursive: true, force: true });
	}
});

test("session does not invoke a PATH agent-browser when the worktree package exists", () => {
	const root = mkdtempSync(path.join(os.tmpdir(), "control-vpk-path-"));
	const fakeBin = path.join(root, "bin");
	mkdirSync(fakeBin, { recursive: true });
	const fakeAgentBrowser = path.join(fakeBin, "agent-browser");
	writeFileSync(
		fakeAgentBrowser,
		"#!/bin/sh\nprintf 'PATH_HIT\\n' >&2\nexit 42\n",
	);
	chmodSync(fakeAgentBrowser, 0o755);

	try {
		const result = spawnSync(process.execPath, [CONTROL_VPK, "session"], {
			encoding: "utf8",
			env: {
				...process.env,
				PATH: `${fakeBin}${path.delimiter}${process.env.PATH || "/usr/bin:/bin"}`,
			},
		});
		assert.notEqual(result.status, 42);
		assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /PATH_HIT/u);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

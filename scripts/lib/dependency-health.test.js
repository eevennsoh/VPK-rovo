const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	assertWorkspaceDependencies,
	formatMissingDependenciesError,
	resolveWorkspaceBinary,
	resolveWorkspaceDependency,
} = require("./dependency-health");

function createFixture() {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-deps-"));
	return {
		cwd,
		dispose: () => rmSync(cwd, { force: true, recursive: true }),
	};
}

function writePackage(cwd, packageName) {
	const packageDir = path.join(cwd, "node_modules", ...packageName.split("/"));
	mkdirSync(packageDir, { recursive: true });
	writeFileSync(path.join(packageDir, "package.json"), JSON.stringify({
		name: packageName,
		version: "1.0.0",
	}));
}

function writeBinary(cwd, binaryName) {
	const binDir = path.join(cwd, "node_modules", ".bin");
	mkdirSync(binDir, { recursive: true });
	writeFileSync(path.join(binDir, binaryName), "#!/usr/bin/env node\n");
}

test("resolveWorkspaceDependency finds a linked workspace package", () => {
	const fixture = createFixture();
	try {
		writePackage(fixture.cwd, "concurrently");
		const result = resolveWorkspaceDependency("concurrently", { cwd: fixture.cwd });

		assert.equal(result.ok, true);
		assert.equal(result.name, "concurrently");
		assert.match(result.resolvedPath, /node_modules\/concurrently\/package\.json$/u);
	} finally {
		fixture.dispose();
	}
});

test("resolveWorkspaceBinary finds a linked workspace binary", () => {
	const fixture = createFixture();
	try {
		writeBinary(fixture.cwd, "concurrently");
		const result = resolveWorkspaceBinary("concurrently", { cwd: fixture.cwd });

		assert.equal(result.ok, true);
		assert.equal(result.name, "concurrently");
		assert.match(result.resolvedPath, /node_modules\/\.bin\/concurrently$/u);
	} finally {
		fixture.dispose();
	}
});

test("assertWorkspaceDependencies reports the noninteractive repair command", () => {
	const fixture = createFixture();
	try {
		assert.throws(
			() => assertWorkspaceDependencies(["typescript"], {
				commandName: "pnpm run typecheck",
				cwd: fixture.cwd,
			}),
			(error) => {
				assert.equal(error.code, "VPK_MISSING_WORKSPACE_DEPENDENCIES");
				assert.match(error.message, /Missing workspace dependency: typescript/u);
				assert.match(error.message, /CI=true pnpm install --prefer-offline/u);
				assert.match(error.message, /Then rerun: pnpm run typecheck/u);
				return true;
			}
		);
	} finally {
		fixture.dispose();
	}
});

test("assertWorkspaceDependencies reports missing workspace binaries", () => {
	const fixture = createFixture();
	try {
		writePackage(fixture.cwd, "next");

		assert.throws(
			() => assertWorkspaceDependencies(["next"], {
				binaryNames: ["concurrently"],
				commandName: "pnpm run dev",
				cwd: fixture.cwd,
			}),
			(error) => {
				assert.equal(error.code, "VPK_MISSING_WORKSPACE_DEPENDENCIES");
				assert.match(error.message, /Missing workspace binary: concurrently/u);
				assert.match(error.message, /Repair with: CI=true pnpm install --prefer-offline/u);
				assert.match(error.message, /Then rerun: pnpm run dev/u);
				return true;
			}
		);
	} finally {
		fixture.dispose();
	}
});

test("formatMissingDependenciesError pluralizes multiple missing packages", () => {
	const message = formatMissingDependenciesError([
		{ name: "concurrently" },
		{ name: "next" },
	], {
		commandName: "pnpm run dev",
	});

	assert.match(message, /Missing workspace dependencies: concurrently, next/u);
	assert.match(message, /node_modules is missing or incomplete/u);
});

test("check-workspace-deps exits nonzero with a repair message", () => {
	const fixture = createFixture();
	try {
		const scriptPath = path.resolve(__dirname, "../check-workspace-deps.js");
		const result = spawnSync(process.execPath, [
			scriptPath,
			"--command",
			"pnpm run dev:tmux:start",
			"--bin",
			"portless",
			"portless",
		], {
			cwd: fixture.cwd,
			encoding: "utf8",
		});

		assert.equal(result.status, 1);
		assert.match(result.stderr, /Missing workspace binary: portless/u);
		assert.match(result.stderr, /Missing workspace dependency: portless/u);
		assert.match(result.stderr, /Repair with: CI=true pnpm install --prefer-offline/u);
		assert.match(result.stderr, /Then rerun: pnpm run dev:tmux:start/u);
	} finally {
		fixture.dispose();
	}
});

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const WORKTREE_CREATE_HOOK = path.join(__dirname, "worktree-create.sh");

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: "utf8",
		...options,
	});

	assert.equal(
		result.status,
		0,
		[
			`${command} ${args.join(" ")} failed with status ${result.status}`,
			result.stdout,
			result.stderr,
		].join("\n"),
	);

	return result;
}

function createTempGitRepo(t) {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-create-hook-"));
	const repoRoot = path.join(tempRoot, "repo");
	fs.mkdirSync(repoRoot);

	t.after(() => {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	});

	run("git", ["init"], { cwd: repoRoot });
	fs.writeFileSync(path.join(repoRoot, "README.md"), "# hook fixture\n");
	fs.writeFileSync(
		path.join(repoRoot, ".gitignore"),
		[
			".env*",
			"!*.example",
			"node_modules/",
			".cache/",
			".claude/worktrees/",
			".rovo/worktrees/",
			".codex/worktrees/",
			".cursor/worktrees/",
			"",
		].join("\n"),
	);
	fs.writeFileSync(path.join(repoRoot, "package.json"), '{"private":true}\n');
	fs.writeFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
	fs.writeFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), "packages:\n  - .\n  - backend\n");
	fs.writeFileSync(path.join(repoRoot, ".env.local.example"), "EXAMPLE_ONLY=true\n");
	fs.mkdirSync(path.join(repoRoot, "backend"), { recursive: true });
	fs.writeFileSync(path.join(repoRoot, "backend", "package.json"), '{"private":true}\n');
	fs.mkdirSync(path.join(repoRoot, ".agents", "hooks", "lib"), { recursive: true });
	fs.copyFileSync(
		path.join(__dirname, "lib", "worktree-bootstrap.sh"),
		path.join(repoRoot, ".agents", "hooks", "lib", "worktree-bootstrap.sh"),
	);
	run(
		"git",
		[
			"add",
			"README.md",
			".gitignore",
			"package.json",
			"pnpm-lock.yaml",
			"pnpm-workspace.yaml",
			".env.local.example",
			"backend/package.json",
			".agents/hooks/lib/worktree-bootstrap.sh",
		],
		{ cwd: repoRoot },
	);
	run("git", ["commit", "-m", "Initial commit"], {
		cwd: repoRoot,
		env: {
			...process.env,
			GIT_AUTHOR_EMAIL: "test@example.com",
			GIT_AUTHOR_NAME: "Test User",
			GIT_COMMITTER_EMAIL: "test@example.com",
			GIT_COMMITTER_NAME: "Test User",
		},
	});

	return { repoRoot, tempRoot };
}

function createPnpmStub(tempRoot, exitCode = 0) {
	const binDir = path.join(tempRoot, "bin");
	const recordPath = path.join(tempRoot, "pnpm-args.log");
	const pnpmPath = path.join(binDir, "pnpm");
	fs.mkdirSync(binDir, { recursive: true });
	fs.writeFileSync(
		pnpmPath,
		[
			"#!/usr/bin/env bash",
			"printf '%s\\n' \"$*\" >> \"$PNPM_RECORD\"",
			`exit ${exitCode}`,
			"",
		].join("\n"),
	);
	fs.chmodSync(pnpmPath, 0o755);

	return { binDir, recordPath };
}

function createCpStub(tempRoot, { cloneExitCode = 0 } = {}) {
	const binDir = path.join(tempRoot, "cp-bin");
	const recordPath = path.join(tempRoot, "cp-args.log");
	const cpPath = path.join(binDir, "cp");
	fs.mkdirSync(binDir, { recursive: true });
	fs.writeFileSync(
		cpPath,
		[
			"#!/usr/bin/env bash",
			"if [ \"$1\" = \"-c\" ]; then",
			"  printf '%s\\n' \"$*\" >> \"$CP_RECORD\"",
			`  if [ ${cloneExitCode} -ne 0 ]; then exit ${cloneExitCode}; fi`,
			"  shift",
			"  exec /bin/cp \"$@\"",
			"fi",
			"exec /bin/cp \"$@\"",
			"",
		].join("\n"),
	);
	fs.chmodSync(cpPath, 0o755);

	return { binDir, recordPath };
}

function runWorktreeCreateHook(repoRoot, payload, env = {}) {
	return spawnSync("bash", [WORKTREE_CREATE_HOOK], {
		cwd: repoRoot,
		encoding: "utf8",
		input: JSON.stringify(payload),
		env: {
			...process.env,
			...env,
		},
	});
}

test("WorktreeCreate creates the requested worktree while keeping stdout path-only", (t) => {
	const { repoRoot, tempRoot } = createTempGitRepo(t);
	const { binDir, recordPath } = createPnpmStub(tempRoot);
	const worktreeDir = path.join(tempRoot, "agent-worktree");
	fs.writeFileSync(path.join(repoRoot, ".env.local"), "ROVO_SESSION_TOKEN=test-token\n");
	fs.writeFileSync(path.join(repoRoot, ".env.development"), "NEXT_PUBLIC_FIXTURE=true\n");
	fs.mkdirSync(path.join(repoRoot, "nested"), { recursive: true });
	fs.writeFileSync(path.join(repoRoot, "nested", ".env.local"), "NESTED=true\n");
	fs.mkdirSync(path.join(repoRoot, ".cache"), { recursive: true });
	fs.writeFileSync(path.join(repoRoot, ".cache", "not-env"), "cache artifact\n");
	for (const providerRoot of [".claude", ".rovo", ".codex", ".cursor"]) {
		fs.mkdirSync(path.join(repoRoot, providerRoot, "worktrees", "stale"), { recursive: true });
		fs.writeFileSync(
			path.join(repoRoot, providerRoot, "worktrees", "stale", ".env.local"),
			`${providerRoot}=stale\n`,
		);
	}

	const result = runWorktreeCreateHook(
		repoRoot,
		{
			name: "agent-worktree",
			base_ref: "HEAD",
			worktree_ref: "claude/agent-worktree",
			worktree_path: worktreeDir,
		},
		{
			PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
			PNPM_RECORD: recordPath,
		},
	);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout, `${worktreeDir}\n`);
	assert.match(result.stderr, /running pnpm install --prefer-offline/u);
	assert.equal(
		fs.readFileSync(path.join(worktreeDir, ".env.local"), "utf8"),
		"ROVO_SESSION_TOKEN=test-token\n",
	);
	assert.equal(
		fs.readFileSync(path.join(worktreeDir, ".env.development"), "utf8"),
		"NEXT_PUBLIC_FIXTURE=true\n",
	);
	assert.equal(
		fs.readFileSync(path.join(worktreeDir, "nested", ".env.local"), "utf8"),
		"NESTED=true\n",
	);
	assert.equal(fs.existsSync(path.join(worktreeDir, ".cache", "not-env")), false);
	for (const providerRoot of [".claude", ".rovo", ".codex", ".cursor"]) {
		assert.equal(
			fs.existsSync(path.join(worktreeDir, providerRoot, "worktrees", "stale", ".env.local")),
			false,
		);
	}
	assert.equal(fs.readFileSync(recordPath, "utf8"), "install --prefer-offline\n");

	const branch = run("git", ["branch", "--show-current"], { cwd: worktreeDir });
	assert.equal(branch.stdout.trim(), "claude/agent-worktree");
});

test("WorktreeCreate warms dependencies with clonefile copy when lockfiles match", (t) => {
	const { repoRoot, tempRoot } = createTempGitRepo(t);
	const pnpm = createPnpmStub(tempRoot);
	const cp = createCpStub(tempRoot);
	const worktreeDir = path.join(tempRoot, "clone-worktree");
	fs.mkdirSync(path.join(repoRoot, "node_modules", "fixture"), { recursive: true });
	fs.writeFileSync(path.join(repoRoot, "node_modules", "fixture", "index.js"), "module.exports = true;\n");
	fs.mkdirSync(path.join(repoRoot, "backend", "node_modules", "fixture"), { recursive: true });
	fs.writeFileSync(path.join(repoRoot, "backend", "node_modules", "fixture", "index.js"), "module.exports = 'backend';\n");
	fs.mkdirSync(path.join(repoRoot, ".claude", "worktrees", "stale", "node_modules", "fixture"), { recursive: true });
	fs.writeFileSync(
		path.join(repoRoot, ".claude", "worktrees", "stale", "node_modules", "fixture", "index.js"),
		"module.exports = 'stale';\n",
	);

	const result = runWorktreeCreateHook(
		repoRoot,
		{
			name: "clone-worktree",
			base_ref: "HEAD",
			worktree_path: worktreeDir,
		},
		{
			PATH: `${cp.binDir}${path.delimiter}${pnpm.binDir}${path.delimiter}${process.env.PATH}`,
			CP_RECORD: cp.recordPath,
			PNPM_RECORD: pnpm.recordPath,
		},
	);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout, `${worktreeDir}\n`);
	assert.match(fs.readFileSync(cp.recordPath, "utf8"), /-c -R/u);
	assert.equal(
		fs.readFileSync(path.join(worktreeDir, "node_modules", "fixture", "index.js"), "utf8"),
		"module.exports = true;\n",
	);
	assert.equal(
		fs.readFileSync(path.join(worktreeDir, "backend", "node_modules", "fixture", "index.js"), "utf8"),
		"module.exports = 'backend';\n",
	);
	assert.equal(
		fs.existsSync(
			path.join(worktreeDir, ".claude", "worktrees", "stale", "node_modules", "fixture", "index.js"),
		),
		false,
	);
	assert.equal(fs.existsSync(pnpm.recordPath), false);
});

test("WorktreeCreate falls back to pnpm install when clonefile copy fails", (t) => {
	const { repoRoot, tempRoot } = createTempGitRepo(t);
	const pnpm = createPnpmStub(tempRoot);
	const cp = createCpStub(tempRoot, { cloneExitCode: 64 });
	const worktreeDir = path.join(tempRoot, "clone-fails-worktree");
	fs.mkdirSync(path.join(repoRoot, "node_modules", "fixture"), { recursive: true });
	fs.writeFileSync(path.join(repoRoot, "node_modules", "fixture", "index.js"), "module.exports = true;\n");

	const result = runWorktreeCreateHook(
		repoRoot,
		{
			name: "clone-fails-worktree",
			base_ref: "HEAD",
			worktree_path: worktreeDir,
		},
		{
			PATH: `${cp.binDir}${path.delimiter}${pnpm.binDir}${path.delimiter}${process.env.PATH}`,
			CP_RECORD: cp.recordPath,
			PNPM_RECORD: pnpm.recordPath,
		},
	);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout, `${worktreeDir}\n`);
	assert.match(result.stderr, /falling back to pnpm install/u);
	assert.equal(fs.readFileSync(pnpm.recordPath, "utf8"), "install --prefer-offline\n");
	assert.equal(fs.existsSync(path.join(worktreeDir, "node_modules", "fixture", "index.js")), false);
});

test("WorktreeCreate creates a named branch when worktree_ref is omitted", (t) => {
	const { repoRoot, tempRoot } = createTempGitRepo(t);
	const { binDir, recordPath } = createPnpmStub(tempRoot, 23);
	const worktreeDir = path.join(tempRoot, "install-fails-worktree");

	const result = runWorktreeCreateHook(
		repoRoot,
		{
			name: "install-fails-worktree",
			base_ref: "HEAD",
			worktree_path: worktreeDir,
		},
		{
			PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
			PNPM_RECORD: recordPath,
		},
	);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout, `${worktreeDir}\n`);
	assert.match(result.stderr, /pnpm install failed/u);
	assert.match(result.stderr, /\.env files missing/u);
	assert.equal(fs.readFileSync(recordPath, "utf8"), "install --prefer-offline\n");
	assert.ok(fs.existsSync(path.join(worktreeDir, "README.md")));

	const branch = run("git", ["branch", "--show-current"], { cwd: worktreeDir });
	assert.equal(branch.stdout.trim(), "claude/install-fails-worktree");
});

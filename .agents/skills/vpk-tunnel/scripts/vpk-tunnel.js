#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");
const { getAllWorktreePortInfo } = require("../../../../scripts/lib/worktree-ports");
const { probePortAlive } = require("../../../../scripts/lib/port-liveness");
const { loadPortlessRoutes, isOwnerAlive } = require("../../../../scripts/lib/portless-routes");

const DEFAULT_TARGET_URL = "https://vpk-rovo.localhost";
const SESSION_PREFIX = "vpk-tunnel-";
const START_TIMEOUT_MS = 30_000;
const START_POLL_INTERVAL_MS = 250;

function normalizeTargetUrl(value = DEFAULT_TARGET_URL) {
	let parsed;
	try {
		parsed = new URL(value || DEFAULT_TARGET_URL);
	} catch {
		throw new Error(`Invalid Portless URL: ${value}`);
	}

	if (!["http:", "https:"].includes(parsed.protocol)) {
		throw new Error("Portless URL must use http or https.");
	}
	if (!parsed.hostname.endsWith(".localhost")) {
		throw new Error(`Expected a Portless .localhost URL, received: ${parsed.href}`);
	}
	if (parsed.username || parsed.password) {
		throw new Error("Portless URL must not contain credentials.");
	}

	return parsed;
}

function chooseRoute(routes, hostname, ownerAlive = isOwnerAlive) {
	const matches = routes.filter(
		(route) => route && String(route.hostname).toLowerCase() === hostname.toLowerCase(),
	);
	if (matches.length === 0) {
		throw new Error(
			`No Portless route matches ${hostname}. Run \`pnpm ports once\` and choose an exact live URL.`,
		);
	}

	const liveRoute = matches.find((route) => ownerAlive(route.pid));
	if (!liveRoute) {
		throw new Error(
			`Portless route ${hostname} is stale because its owning process is not running. Run \`pnpm ports once\` and choose an exact live URL.`,
		);
	}
	return liveRoute;
}

function readFrontendPort(worktreePath) {
	try {
		return fs.readFileSync(path.join(worktreePath, ".dev-frontend-port"), "utf8").trim();
	} catch {
		return null;
	}
}

function findSourceWorktree(port, worktrees = getAllWorktreePortInfo()) {
	const match = worktrees.find((worktree) => Number(readFrontendPort(worktree.path)) === Number(port));
	if (!match) return null;

	return {
		branch: match.branch,
		identifier: match.identifier,
		isMain: Boolean(match.isMain),
		path: match.path,
	};
}

async function resolvePortlessTarget({
	targetUrl = DEFAULT_TARGET_URL,
	routes = loadPortlessRoutes(),
	ownerAlive = isOwnerAlive,
	probePort = probePortAlive,
	worktrees,
} = {}) {
	const parsed = normalizeTargetUrl(targetUrl);
	const route = chooseRoute(routes, parsed.hostname, ownerAlive);
	const port = Number(route.port);
	if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
		throw new Error(`Portless route ${parsed.hostname} has an invalid frontend port.`);
	}
	if (!(await probePort(port))) {
		throw new Error(
			`Portless route ${parsed.hostname} points to frontend port ${port}, but that port is not responding.`,
		);
	}

	return {
		hostname: parsed.hostname,
		localUrl: parsed.href,
		port,
		sourceWorktree: findSourceWorktree(port, worktrees),
	};
}

function sessionNameForHostname(hostname) {
	const slug = String(hostname)
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "");
	const candidate = `${SESSION_PREFIX}${slug}`;
	if (candidate.length <= 80) return candidate;

	const digest = crypto.createHash("sha256").update(hostname).digest("hex").slice(0, 8);
	return `${candidate.slice(0, 71)}-${digest}`;
}

function createRunner(spawn = spawnSync) {
	return (command, args, options = {}) => {
		const result = spawn(command, args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
			...options,
		});
		return {
			error: result.error ?? null,
			status: result.status,
			stderr: result.stderr ?? "",
			stdout: result.stdout ?? "",
		};
	};
}

function commandExists(command, run) {
	const result = run("/bin/sh", ["-lc", `command -v ${command}`]);
	return !result.error && result.status === 0 && result.stdout.trim().length > 0;
}

function dependencySetupMessage(missing) {
	const lines = [`Missing required tunnel dependency: ${missing.join(", ")}.`];
	if (missing.includes("atlas")) {
		lines.push("Install or update Atlas CLI, then run: atlas plugin install --name tunnel");
	}
	if (missing.includes("cloudflared")) {
		lines.push("Install cloudflared after user approval: brew install cloudflared");
	}
	if (missing.includes("tmux")) {
		lines.push("Install tmux before using persistent scoped tunnel sessions.");
	}
	if (missing.includes("curl")) {
		lines.push("Install curl so the prototype route can be health-checked before exposure.");
	}
	return lines.join("\n");
}

function checkDependencies(run) {
	const required = ["atlas", "cloudflared", "tmux", "curl"];
	const missing = required.filter((command) => !commandExists(command, run));
	if (missing.length > 0) {
		throw new Error(dependencySetupMessage(missing));
	}

	const plugins = run("atlas", ["plugin", "installed"]);
	if (plugins.error || plugins.status !== 0) {
		throw new Error(
			`Could not inspect installed Atlas plugins. ${plugins.stderr.trim() || "Run atlas plugin installed and retry."}`,
		);
	}
	if (!/^\s*tunnel\s+/imu.test(plugins.stdout)) {
		throw new Error(
			"Atlas Tunnel plugin is not installed. After user approval, run: atlas plugin install --name tunnel",
		);
	}
}

function verifyHttpTarget(localUrl, run) {
	const result = run("curl", [
		"-k",
		"-sS",
		"-L",
		"--max-time",
		"10",
		"-o",
		"/dev/null",
		"-w",
		"%{http_code}",
		localUrl,
	]);
	const statusCode = Number(result.stdout.trim());
	if (result.error || result.status !== 0 || statusCode < 200 || statusCode >= 400) {
		const detail = result.stderr.trim() || `HTTP ${result.stdout.trim() || "probe failed"}`;
		throw new Error(`Local prototype did not return a successful HTTP response: ${detail}`);
	}
	return statusCode;
}

function tmuxSessionExists(sessionName, run) {
	const result = run("tmux", ["has-session", "-t", sessionName]);
	return !result.error && result.status === 0;
}

function captureSession(sessionName, run) {
	const result = run("tmux", ["capture-pane", "-p", "-t", sessionName, "-S", "-200"]);
	if (result.error || result.status !== 0) return "";
	return result.stdout;
}

function readStoredPublicBaseUrl(sessionName, run) {
	const result = run("tmux", [
		"show-options",
		"-v",
		"-t",
		sessionName,
		"@vpk-tunnel-public-url",
	]);
	if (result.error || result.status !== 0) return null;
	return extractPublicBaseUrl(result.stdout);
}

function storePublicBaseUrl(sessionName, publicBaseUrl, run) {
	const result = run("tmux", [
		"set-option",
		"-t",
		sessionName,
		"@vpk-tunnel-public-url",
		publicBaseUrl,
	]);
	if (result.error || result.status !== 0) {
		throw new Error(`Could not persist the public URL on scoped tunnel session ${sessionName}.`);
	}
}

function extractPublicBaseUrl(output) {
	const matches = String(output).match(/https:\/\/[^\s"'<>\\]+/gu) ?? [];
	const publicMatches = matches.filter((candidate) => {
		try {
			const parsed = new URL(candidate.replace(/[),.;]+$/gu, ""));
			return parsed.hostname === "atlastunnel.com" || parsed.hostname.endsWith(".atlastunnel.com");
		} catch {
			return false;
		}
	});
	return publicMatches.length > 0
		? publicMatches[publicMatches.length - 1].replace(/[),.;]+$/gu, "")
		: null;
}

function buildPublicUrl(publicBaseUrl, localUrl) {
	const base = new URL(publicBaseUrl);
	const local = normalizeTargetUrl(localUrl);
	base.pathname = local.pathname;
	base.search = local.search;
	base.hash = local.hash;
	return base.href;
}

async function waitForPublicUrl(sessionName, run, {
	sleep = delay,
	timeoutMs = START_TIMEOUT_MS,
	pollIntervalMs = START_POLL_INTERVAL_MS,
} = {}) {
	const deadline = Date.now() + timeoutMs;
	let latestOutput = "";
	while (Date.now() < deadline) {
		if (!tmuxSessionExists(sessionName, run)) {
			throw new Error(
				`Atlas Tunnel exited before publishing a URL.${latestOutput.trim() ? `\n${latestOutput.trim()}` : ""}`,
			);
		}
		latestOutput = captureSession(sessionName, run);
		const publicBaseUrl = extractPublicBaseUrl(latestOutput);
		if (publicBaseUrl) return publicBaseUrl;
		await sleep(pollIntervalMs);
	}

	throw new Error(
		`Timed out waiting for Atlas Tunnel to publish a URL.${latestOutput.trim() ? `\n${latestOutput.trim()}` : ""}`,
	);
}

async function startTunnel({
	targetUrl = DEFAULT_TARGET_URL,
	confirmPublic = false,
	run = createRunner(),
	resolveTarget = resolvePortlessTarget,
	waitForUrl = waitForPublicUrl,
} = {}) {
	if (!confirmPublic) {
		throw new Error(
			"Public tunnel not started. Confirm the prototype contains only synthetic or fake data, then retry with --confirm-public.",
		);
	}

	checkDependencies(run);
	const target = await resolveTarget({ targetUrl });
	const httpStatus = verifyHttpTarget(target.localUrl, run);
	const sessionName = sessionNameForHostname(target.hostname);
	const reused = tmuxSessionExists(sessionName, run);

	if (!reused) {
		const atlasCommand = `atlas tunnel start --port ${target.port} --public`;
		const started = run("tmux", ["new-session", "-d", "-s", sessionName, atlasCommand]);
		if (started.error || started.status !== 0) {
			throw new Error(
				`Could not start scoped tunnel session ${sessionName}: ${started.stderr.trim() || "tmux failed"}`,
			);
		}
	}

	const existingOutput = captureSession(sessionName, run);
	const publicBaseUrl = readStoredPublicBaseUrl(sessionName, run)
		?? extractPublicBaseUrl(existingOutput)
		?? await waitForUrl(sessionName, run);
	storePublicBaseUrl(sessionName, publicBaseUrl, run);
	return {
		httpStatus,
		localUrl: target.localUrl,
		port: target.port,
		publicBaseUrl,
		publicUrl: buildPublicUrl(publicBaseUrl, target.localUrl),
		reused,
		sessionName,
		sourceWorktree: target.sourceWorktree ?? null,
	};
}

function statusTunnel({ targetUrl = DEFAULT_TARGET_URL, run = createRunner() } = {}) {
	const parsed = normalizeTargetUrl(targetUrl);
	const sessionName = sessionNameForHostname(parsed.hostname);
	const running = tmuxSessionExists(sessionName, run);
	const output = running ? captureSession(sessionName, run) : "";
	const publicBaseUrl = running
		? readStoredPublicBaseUrl(sessionName, run) ?? extractPublicBaseUrl(output)
		: null;
	return {
		localUrl: parsed.href,
		publicBaseUrl,
		publicUrl: publicBaseUrl ? buildPublicUrl(publicBaseUrl, parsed.href) : null,
		running,
		sessionName,
	};
}

async function stopTunnel({
	targetUrl = DEFAULT_TARGET_URL,
	run = createRunner(),
	sleep = delay,
} = {}) {
	const parsed = normalizeTargetUrl(targetUrl);
	const sessionName = sessionNameForHostname(parsed.hostname);
	if (!tmuxSessionExists(sessionName, run)) {
		return { localUrl: parsed.href, sessionName, stopped: false };
	}

	run("tmux", ["send-keys", "-t", sessionName, "C-c"]);
	await sleep(500);
	if (tmuxSessionExists(sessionName, run)) {
		const killed = run("tmux", ["kill-session", "-t", sessionName]);
		if (killed.error || killed.status !== 0) {
			throw new Error(
				`Could not stop scoped tunnel session ${sessionName}: ${killed.stderr.trim() || "tmux failed"}`,
			);
		}
	}
	return { localUrl: parsed.href, sessionName, stopped: true };
}

function parseCliArguments(argv) {
	const [command = "start", ...rest] = argv;
	const confirmPublic = rest.includes("--confirm-public");
	const positional = rest.filter((value) => value !== "--confirm-public");
	if (!["resolve", "start", "status", "stop"].includes(command)) {
		throw new Error("Usage: vpk-tunnel.js <resolve|start|status|stop> [Portless URL] [--confirm-public]");
	}
	if (positional.length > 1) {
		throw new Error("Pass at most one Portless URL.");
	}
	return { command, confirmPublic, targetUrl: positional[0] ?? DEFAULT_TARGET_URL };
}

async function main(argv = process.argv.slice(2)) {
	const { command, confirmPublic, targetUrl } = parseCliArguments(argv);
	let result;
	if (command === "resolve") {
		result = await resolvePortlessTarget({ targetUrl });
	} else if (command === "start") {
		result = await startTunnel({ confirmPublic, targetUrl });
	} else if (command === "status") {
		result = statusTunnel({ targetUrl });
	} else {
		result = await stopTunnel({ targetUrl });
	}
	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
}

module.exports = {
	DEFAULT_TARGET_URL,
	buildPublicUrl,
	checkDependencies,
	chooseRoute,
	createRunner,
	dependencySetupMessage,
	extractPublicBaseUrl,
	normalizeTargetUrl,
	parseCliArguments,
	readStoredPublicBaseUrl,
	resolvePortlessTarget,
	sessionNameForHostname,
	startTunnel,
	statusTunnel,
	storePublicBaseUrl,
	stopTunnel,
	tmuxSessionExists,
	verifyHttpTarget,
	waitForPublicUrl,
};

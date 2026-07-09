import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export function deriveRepoName(filePath) {
	const abs = path.resolve(filePath);
	const dirName = path.basename(path.dirname(abs));
	const fileName = path.basename(abs, path.extname(abs));
	const normalize = value => value
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^[._-]+|[._-]+$/g, "")
		.replace(/-{2,}/g, "-");
	const normalized = dirName && dirName !== "." ? normalize(dirName) : "";
	if (normalized) return normalized;
	const fileNormalized = normalize(fileName);
	if (fileNormalized) return fileNormalized;
	return normalized || "vpk-html-artifact";
}

export function parseRepoSpec(repo) {
	if (!repo) return null;
	const trimmed = repo.trim();
	const match = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
	if (!match) {
		throw new Error(`--repo must use owner/name, received: ${repo}`);
	}
	return { owner: match[1], name: match[2], fullName: `${match[1]}/${match[2]}` };
}

function run(command, args, options = {}) {
	const { cwd = process.cwd(), allowFailure = false } = options;
	try {
		return execFileSync(command, args, {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();
	} catch (error) {
		if (allowFailure) return null;
		const stderr = error.stderr?.toString().trim();
		const stdout = error.stdout?.toString().trim();
		const detail = stderr || stdout || error.message;
		throw new Error(`${command} ${args.join(" ")} failed: ${detail}`);
	}
}

function getGithubLogin(cwd) {
	const login = run("gh", ["api", "user", "--jq", ".login"], { cwd });
	if (!login) throw new Error("Could not resolve GitHub login from `gh api user`");
	return login;
}

function repoExists(repo, cwd) {
	return run("gh", ["repo", "view", repo, "--json", "nameWithOwner"], { cwd, allowFailure: true }) !== null;
}

function remoteUrl(repo) {
	return `git@github.com:${repo}.git`;
}

function ensureRemote(repo, cwd) {
	const expected = remoteUrl(repo);
	const current = run("git", ["remote", "get-url", "origin"], { cwd, allowFailure: true });
	if (!current) {
		run("git", ["remote", "add", "origin", expected], { cwd });
		return;
	}
	if (current !== expected) {
		throw new Error(`origin remote points at ${current}, expected ${expected}`);
	}
}

function ensureLocalRepo(cwd) {
	if (!fs.existsSync(path.join(cwd, ".git"))) {
		run("git", ["init", "-b", "main"], { cwd });
		return;
	}
	const branch = run("git", ["branch", "--show-current"], { cwd, allowFailure: true });
	if (branch && branch !== "main") {
		throw new Error(`GitHub Pages publish repo must be on main, currently on ${branch}`);
	}
}

function ensureLocalExcludes(cwd, sourceFileName) {
	const excludePath = path.join(cwd, ".git", "info", "exclude");
	const existing = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, "utf8") : "";
	const additions = [];
	if (sourceFileName !== "index.html" && !existing.includes(`${sourceFileName}\n`)) {
		additions.push(sourceFileName);
	}
	if (!existing.includes("screenshots/\n")) additions.push("screenshots/");
	if (additions.length === 0) return;
	fs.appendFileSync(excludePath, `${existing.endsWith("\n") ? "" : "\n"}${additions.join("\n")}\n`);
}

function preparePayload(filePath) {
	const abs = path.resolve(filePath);
	if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
	if (path.extname(abs).toLowerCase() !== ".html") {
		throw new Error(`--github requires an HTML file, received: ${abs}`);
	}
	const dir = path.dirname(abs);
	const indexPath = path.join(dir, "index.html");
	if (abs !== indexPath) fs.copyFileSync(abs, indexPath);
	fs.closeSync(fs.openSync(path.join(dir, ".nojekyll"), "a"));
	return { dir, indexPath, sourceFileName: path.basename(abs) };
}

function hasStagedChanges(cwd) {
	return run("git", ["diff", "--cached", "--quiet"], { cwd, allowFailure: true }) === null;
}

function commitPayload(cwd, message) {
	run("git", ["add", "index.html", ".nojekyll"], { cwd });
	if (!hasStagedChanges(cwd)) return false;
	run("git", ["commit", "-m", message], { cwd });
	return true;
}

function enablePages(repo, cwd) {
	const endpoint = `repos/${repo}/pages`;
	const current = run("gh", ["api", endpoint], { cwd, allowFailure: true });
	if (current) {
		const parsed = JSON.parse(current);
		if (parsed.source?.branch === "main" && parsed.source?.path === "/") {
			return parsed;
		}
		const updated = run("gh", [
			"api",
			"--method", "PUT",
			endpoint,
			"-f", "source[branch]=main",
			"-f", "source[path]=/",
		], { cwd });
		return JSON.parse(updated);
	}
	const created = run("gh", [
		"api",
		"--method", "POST",
		endpoint,
		"-f", "source[branch]=main",
		"-f", "source[path]=/",
	], { cwd });
	return JSON.parse(created);
}

function latestBuild(repo, cwd) {
	const output = run("gh", ["api", `repos/${repo}/pages/builds/latest`], { cwd, allowFailure: true });
	return output ? JSON.parse(output) : null;
}

export async function publishGithubPages(filePath, options = {}) {
	const payload = preparePayload(filePath);
	ensureLocalRepo(payload.dir);
	ensureLocalExcludes(payload.dir, payload.sourceFileName);

	const parsedRepo = parseRepoSpec(options.repo);
	const repo = parsedRepo?.fullName ?? `${getGithubLogin(payload.dir)}/${deriveRepoName(filePath)}`;
	const visibility = options.visibility ?? "public";
	const didCommit = commitPayload(payload.dir, options.message ?? "Publish vpk-html artifact");

	if (repoExists(repo, payload.dir)) {
		ensureRemote(repo, payload.dir);
		run("git", ["push", "-u", "origin", "main"], { cwd: payload.dir });
	} else {
		const visibilityFlag = visibility === "private" ? "--private" : "--public";
		const currentRemote = run("git", ["remote", "get-url", "origin"], { cwd: payload.dir, allowFailure: true });
		if (currentRemote && currentRemote !== remoteUrl(repo)) {
			throw new Error(`origin remote points at ${currentRemote}, expected ${remoteUrl(repo)}`);
		}
		const createArgs = ["repo", "create", repo, visibilityFlag, "--source", ".", "--push"];
		if (!currentRemote) createArgs.push("--remote", "origin");
		run("gh", createArgs, { cwd: payload.dir });
	}

	const pages = enablePages(repo, payload.dir);
	let build = latestBuild(repo, payload.dir);
	for (let attempt = 0; build?.status === "building" && attempt < 10; attempt++) {
		await new Promise(resolve => setTimeout(resolve, 3_000));
		build = latestBuild(repo, payload.dir);
	}

	return {
		repo,
		htmlUrl: pages.html_url,
		source: pages.source,
		build,
		didCommit,
		publishDir: payload.dir,
		indexPath: payload.indexPath,
	};
}

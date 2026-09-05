#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_SECTIONS = [
	"Sub-features",
	"How to get to it (user POV)",
	"Driving it with control-vpk",
	"Gotchas",
];

const REPO_ROOT = path.resolve(__dirname, "../../../..");
const DEFAULT_FEATURES_DIR = path.join(REPO_ROOT, ".agents/skills/vpk-verify/features");
const DEFAULT_REPO_MAP_PATH = path.join(REPO_ROOT, ".agents/knowledge/repo-map.json");

function sectionBody(content, heading) {
	const marker = `## ${heading}`;
	const start = content.indexOf(marker);
	if (start === -1) return "";
	const bodyStart = start + marker.length;
	const nextHeading = content.indexOf("\n## ", bodyStart);
	return content.slice(bodyStart, nextHeading === -1 ? content.length : nextHeading);
}

function indexedFeatureFiles(indexContent) {
	const featuresSection = sectionBody(indexContent, "Features");
	return [...featuresSection.matchAll(/\]\(\.\/([^)]+\.md)\)/gu)]
		.map((match) => match[1]);
}

function featureHeadings(content) {
	return [...content.matchAll(/^##\s+(.+)$/gmu)].map((match) => match[1].trim());
}

function subFeatureIds(content) {
	return [...sectionBody(content, "Sub-features").matchAll(/^-\s+`([^`]+)`/gmu)]
		.map((match) => match[1]);
}

function entryRoutes(content) {
	const routes = new Set();
	const entrySection = sectionBody(content, "How to get to it (user POV)");
	for (const match of entrySection.matchAll(/`([^`\n]+)`/gu)) {
		const code = match[1];
		if (code === "/") routes.add("/");
		for (const routeMatch of code.matchAll(/\/[A-Za-z0-9][A-Za-z0-9._~!$&()*+,;=:@%/-]*/gu)) {
			routes.add(routeMatch[0].replace(/[.,;:]$/u, ""));
		}
	}
	return [...routes].sort((left, right) => left.localeCompare(right));
}

function resolvableRoutes(repoMap) {
	const routes = new Set(["/"]);
	for (const page of repoMap.appPages?.pages ?? []) {
		if (typeof page.routePath !== "string") continue;
		if (!page.routePath.includes("[")) {
			routes.add(page.routePath);
			continue;
		}
		const optionalCatchAllIndex = page.routePath.indexOf("/[[...");
		if (optionalCatchAllIndex !== -1) {
			routes.add(page.routePath.slice(0, optionalCatchAllIndex) || "/");
		}
	}
	for (const categoryEntry of repoMap.components?.categories ?? []) {
		if (typeof categoryEntry.category === "string") {
			routes.add(`/${categoryEntry.category}`);
		}
		for (const component of categoryEntry.entries ?? []) {
			if (typeof component.category === "string" && typeof component.slug === "string") {
				routes.add(`/components/${component.category}/${component.slug}`);
			}
		}
	}
	return routes;
}

function verifyFeatureMap({
	featuresDir = DEFAULT_FEATURES_DIR,
	repoMapPath = DEFAULT_REPO_MAP_PATH,
} = {}) {
	const failures = [];
	const indexPath = path.join(featuresDir, "README.md");
	const indexContent = fs.readFileSync(indexPath, "utf8");
	const indexedFiles = indexedFeatureFiles(indexContent);
	const actualFiles = fs.readdirSync(featuresDir)
		.filter((name) => name.endsWith(".md") && name !== "README.md")
		.sort((left, right) => left.localeCompare(right));
	const actualFileSet = new Set(actualFiles);
	const indexedFileSet = new Set(indexedFiles);
	const seenIndexFiles = new Set();

	for (const file of indexedFiles) {
		if (seenIndexFiles.has(file)) {
			failures.push({
				file: "README.md",
				message: `Feature is indexed more than once: ${file}`,
				type: "feature-index-duplicate",
			});
		}
		seenIndexFiles.add(file);
		if (!actualFileSet.has(file)) {
			failures.push({
				file: "README.md",
				message: `Indexed feature file does not exist: ${file}`,
				type: "feature-index-missing-file",
			});
		}
	}
	for (const file of actualFiles) {
		if (!indexedFileSet.has(file)) {
			failures.push({
				file,
				message: `Feature file is not listed in README.md: ${file}`,
				type: "feature-file-unindexed",
			});
		}
	}

	const repoMap = JSON.parse(fs.readFileSync(repoMapPath, "utf8"));
	const knownRoutes = resolvableRoutes(repoMap);
	const allEntryRoutes = new Set();
	const idOwners = new Map();
	let subFeatureCount = 0;

	for (const file of actualFiles) {
		const content = fs.readFileSync(path.join(featuresDir, file), "utf8");
		const headings = featureHeadings(content);
		if (
			headings.length !== REQUIRED_SECTIONS.length ||
			headings.some((heading, index) => heading !== REQUIRED_SECTIONS[index])
		) {
			failures.push({
				file,
				message: `Expected exactly these H2 sections in order: ${REQUIRED_SECTIONS.join("; ")}`,
				type: "feature-section-contract",
			});
		}

		const ids = subFeatureIds(content);
		subFeatureCount += ids.length;
		for (const id of ids) {
			const firstOwner = idOwners.get(id);
			if (firstOwner) {
				failures.push({
					file,
					message: `Sub-feature ID ${id} is already declared in ${firstOwner}`,
					type: "sub-feature-id-duplicate",
				});
			} else {
				idOwners.set(id, file);
			}
		}

		for (const route of entryRoutes(content)) {
			allEntryRoutes.add(route);
			if (!knownRoutes.has(route)) {
				failures.push({
					file,
					message: `User-entry route is not present in the generated repo map: ${route}`,
					type: "feature-entry-route-unresolved",
				});
			}
		}
	}

	return {
		entryRoutes: [...allEntryRoutes].sort((left, right) => left.localeCompare(right)),
		failures,
		featureCount: actualFiles.length,
		ok: failures.length === 0,
		subFeatureCount,
	};
}

function printHelp() {
	process.stdout.write([
		"Usage: node .agents/skills/vpk-verify/scripts/verify-feature-map.js [--json]",
		"",
		"Checks the VPK verification-map index, feature structure, IDs, and user-entry routes.",
	].join("\n") + "\n");
}

function main(argv = process.argv.slice(2)) {
	if (argv.includes("--help") || argv.includes("-h")) {
		printHelp();
		return;
	}
	const unknown = argv.filter((arg) => arg !== "--json");
	if (unknown.length > 0) {
		throw new Error(`Unknown argument: ${unknown[0]}`);
	}
	const report = verifyFeatureMap();
	if (argv.includes("--json")) {
		process.stdout.write(`${JSON.stringify(report, null, "\t")}\n`);
	} else if (report.ok) {
		process.stdout.write(
			`Verified VPK feature map: ${report.featureCount} features, ${report.subFeatureCount} sub-features, ${report.entryRoutes.length} entry routes.\n`,
		);
	} else {
		for (const failure of report.failures) {
			process.stderr.write(`${failure.file}: ${failure.message} [${failure.type}]\n`);
		}
	}
	if (!report.ok) process.exitCode = 1;
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exitCode = 1;
	}
}

module.exports = {
	entryRoutes,
	indexedFeatureFiles,
	resolvableRoutes,
	sectionBody,
	verifyFeatureMap,
};

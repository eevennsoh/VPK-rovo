#!/usr/bin/env node

"use strict";

const {
	assertWorkspaceDependencies,
} = require("./lib/dependency-health");

function printUsage() {
	console.error("Usage: node scripts/check-workspace-deps.js [--command <rerun-command>] [--bin <binary>] <package>...");
}

function parseArgs(argv) {
	const binaryNames = [];
	const packageNames = [];
	let commandName = null;

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--command") {
			commandName = argv[index + 1] ?? null;
			index += 1;
			continue;
		}
		if (arg === "--bin" || arg === "--binary") {
			binaryNames.push(argv[index + 1] ?? "");
			index += 1;
			continue;
		}
		if (arg.startsWith("--bin=") || arg.startsWith("--binary=")) {
			binaryNames.push(arg.slice(arg.indexOf("=") + 1));
			continue;
		}
		if (arg === "-h" || arg === "--help" || arg === "help") {
			return {
				binaryNames,
				commandName,
				help: true,
				packageNames,
			};
		}
		packageNames.push(arg);
	}

	return {
		binaryNames,
		commandName,
		help: false,
		packageNames,
	};
}

function main(argv = process.argv.slice(2)) {
	const { binaryNames, commandName, help, packageNames } = parseArgs(argv);
	if (help) {
		printUsage();
		return 0;
	}

	if (
		(packageNames.length === 0 && binaryNames.length === 0) ||
		packageNames.some((packageName) => !packageName.trim()) ||
		binaryNames.some((binaryName) => !binaryName.trim())
	) {
		printUsage();
		return 1;
	}

	try {
		assertWorkspaceDependencies(packageNames, {
			binaryNames,
			commandName,
			cwd: process.cwd(),
		});
		return 0;
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		return 1;
	}
}

if (require.main === module) {
	process.exit(main());
}

module.exports = {
	main,
	parseArgs,
};

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const REPAIR_COMMAND = "CI=true pnpm install --prefer-offline";

function packageNameToPathSegments(packageName) {
	return packageName.split("/").filter(Boolean);
}

function resolveWorkspaceBinary(binaryName, { cwd = process.cwd(), fsModule = fs } = {}) {
	const name = String(binaryName ?? "").trim();
	if (!name) {
		throw new Error("Workspace binary name is required.");
	}

	const candidateNames = process.platform === "win32"
		? [name, `${name}.cmd`, `${name}.ps1`]
		: [name];
	for (const candidateName of candidateNames) {
		const binaryPath = path.join(cwd, "node_modules", ".bin", candidateName);
		if (fsModule.existsSync(binaryPath)) {
			return {
				name,
				ok: true,
				resolvedPath: binaryPath,
			};
		}
	}

	return {
		name,
		ok: false,
		resolvedPath: null,
	};
}

function resolveWorkspaceDependency(packageName, { cwd = process.cwd(), resolver = require.resolve } = {}) {
	const name = String(packageName ?? "").trim();
	if (!name) {
		throw new Error("Workspace dependency name is required.");
	}

	const packageJsonPath = path.join(
		cwd,
		"node_modules",
		...packageNameToPathSegments(name),
		"package.json"
	);
	if (fs.existsSync(packageJsonPath)) {
		return {
			name,
			ok: true,
			resolvedPath: packageJsonPath,
			specifier: `${name}/package.json`,
		};
	}

	const attempts = [`${name}/package.json`, name];
	const errors = [];
	for (const specifier of attempts) {
		try {
			return {
				name,
				ok: true,
				resolvedPath: resolver(specifier, { paths: [cwd] }),
				specifier,
			};
		} catch (error) {
			errors.push(error);
		}
	}

	return {
		error: errors[errors.length - 1] ?? null,
		name,
		ok: false,
		resolvedPath: null,
		specifier: null,
	};
}

function createWorkspaceDependencyReport(packageNames, options = {}) {
	const checked = packageNames.map((packageName) =>
		resolveWorkspaceDependency(packageName, options)
	);
	const checkedBinaries = (options.binaryNames ?? []).map((binaryName) =>
		resolveWorkspaceBinary(binaryName, options)
	);

	return {
		checked,
		checkedBinaries,
		missing: checked.filter((dependency) => !dependency.ok),
		missingBinaries: checkedBinaries.filter((binary) => !binary.ok),
		ok: checked.every((dependency) => dependency.ok) && checkedBinaries.every((binary) => binary.ok),
	};
}

function formatMissingDependenciesError(
	missingDependencies,
	{ commandName = null, missingBinaries = [] } = {},
) {
	const names = missingDependencies.map((dependency) => dependency.name);
	const binaryNames = missingBinaries.map((binary) => binary.name);
	const lines = [
		"node_modules is missing or incomplete for this worktree.",
		`Repair with: ${REPAIR_COMMAND}`,
	];
	if (names.length > 0) {
		const noun = names.length === 1 ? "dependency" : "dependencies";
		lines.unshift(`[setup] Missing workspace ${noun}: ${names.join(", ")}`);
	}
	if (binaryNames.length > 0) {
		const noun = binaryNames.length === 1 ? "binary" : "binaries";
		lines.unshift(`[setup] Missing workspace ${noun}: ${binaryNames.join(", ")}`);
	}

	if (commandName) {
		lines.push(`Then rerun: ${commandName}`);
	}

	return lines.join("\n");
}

function assertWorkspaceDependencies(packageNames, options = {}) {
	const report = createWorkspaceDependencyReport(packageNames, options);
	if (report.ok) {
		return report;
	}

	const error = new Error(formatMissingDependenciesError(report.missing, {
		...options,
		missingBinaries: report.missingBinaries,
	}));
	error.code = "VPK_MISSING_WORKSPACE_DEPENDENCIES";
	error.missingDependencies = report.missing;
	error.missingBinaries = report.missingBinaries;
	error.report = report;
	throw error;
}

module.exports = {
	REPAIR_COMMAND,
	assertWorkspaceDependencies,
	createWorkspaceDependencyReport,
	formatMissingDependenciesError,
	resolveWorkspaceBinary,
	resolveWorkspaceDependency,
};

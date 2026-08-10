export const FAILED_PR_CHECKS = [
	{ id: "lint-types", name: "Lint and typecheck", status: "failed", details: "Failed after 42s · deliveryAddress may be null", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471001" },
	{ id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests in 2m 46s", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471002" },
	{ id: "browser-tests", name: "Guest checkout browser tests", status: "passed", details: "5 scenarios in 1m 32s", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471003" },
] as const;

export const QUEUED_PR_CHECKS = [
	{ id: "lint-types", name: "Lint and typecheck", status: "queued", details: "Queued", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471001" },
	{ id: "unit-tests", name: "Unit tests", status: "queued", details: "Queued", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471002" },
	{ id: "browser-tests", name: "Guest checkout browser tests", status: "queued", details: "Queued", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471003" },
] as const;

export const RUNNING_PR_CHECKS = [
	{ id: "lint-types", name: "Lint and typecheck", status: "running", details: "Running for 18s", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471001" },
	{ id: "unit-tests", name: "Unit tests", status: "queued", details: "Waiting for a runner", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471002" },
	{ id: "browser-tests", name: "Guest checkout browser tests", status: "queued", details: "Waiting for CI", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471003" },
] as const;

export const RERUNNING_PR_CHECKS = [
	{ id: "lint-types", name: "Lint and typecheck", status: "running", details: "Rerunning after delivery-address repair", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471004" },
	{ id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests in 2m 46s", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471002" },
	{ id: "browser-tests", name: "Guest checkout browser tests", status: "passed", details: "5 scenarios in 1m 32s", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471003" },
] as const;

export const PASSED_PR_CHECKS = [
	{ id: "lint-types", name: "Lint and typecheck", status: "passed", details: "Rerun completed in 1m 18s", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471004" },
	{ id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests in 2m 46s", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471002" },
	{ id: "browser-tests", name: "Guest checkout browser tests", status: "passed", details: "5 scenarios in 1m 32s", url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471003" },
] as const;

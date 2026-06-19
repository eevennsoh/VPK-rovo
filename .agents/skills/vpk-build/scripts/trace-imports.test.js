const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const TRACE_IMPORTS_PATH = path.resolve(__dirname, "trace-imports.mjs");

function writeFile(filePath, contents) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, contents, "utf8");
}

function createFixture() {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpk-build-trace-"));
	const repoRoot = path.join(tempDir, "repo");
	const planPath = path.join(tempDir, "plan.json");

	try {
		writeFile(
			path.join(repoRoot, "package.json"),
			JSON.stringify(
				{
					dependencies: {
						next: "16.2.6",
						react: "19.2.6",
					},
					devDependencies: {
						typescript: "6.0.3",
					},
				},
				null,
				2,
			),
		);
		writeFile(
			path.join(repoRoot, "app", "studio", "[[...id]]", "page.tsx"),
			`import { SAMPLE_AGENT_PEOPLE } from "@/app/data/directory/people";

export default function Page() {
	return <div>{SAMPLE_AGENT_PEOPLE[0].name}</div>;
}
`,
		);
		writeFile(
			path.join(repoRoot, "app", "data", "directory", "people.ts"),
			`import peopleData from "./people.json";

export const SAMPLE_AGENT_PEOPLE = peopleData;
`,
		);
		writeFile(
			path.join(repoRoot, "app", "data", "directory", "people.json"),
			JSON.stringify(
				[
					{
						name: "Maia Ma",
						avatarSrc: "/avatar-human/maia-ma.png",
						profileAvatarSrc: "/avatar-agent/dev-agents/feature-flag-cleaner.svg",
						apps: [
							{
								name: "Slack",
								iconSrc: "/3p/slack/16.svg",
							},
							{
								name: "Notion",
								iconSrc: "/3p/notion/16.svg",
							},
						],
					},
				],
				null,
				2,
			),
		);
		writeFile(
			path.join(repoRoot, "public", "avatar-agent-unmasked", "dev-agents", "feature-flag-cleaner.svg"),
			"<svg />",
		);
		writeFile(
			path.join(repoRoot, "public", "3p", "notion", "16-borderless.svg"),
			"<svg />",
		);

		return {
			planPath,
			repoRoot,
			cleanup() {
				fs.rmSync(tempDir, { recursive: true, force: true });
			},
		};
	} catch (error) {
		fs.rmSync(tempDir, { recursive: true, force: true });
		throw error;
	}
}

test("trace-imports follows imported JSON files and records their public asset references", () => {
	const fixture = createFixture();

	try {
		execFileSync(
			process.execPath,
			[
				TRACE_IMPORTS_PATH,
				"/studio/[[...id]]",
				"--repo",
				fixture.repoRoot,
				"--out",
				fixture.planPath,
			],
			{ encoding: "utf8", stdio: "pipe" },
		);

		const plan = JSON.parse(fs.readFileSync(fixture.planPath, "utf8"));

		assert.ok(
			plan.files.includes("app/data/directory/people.json"),
			"imported JSON should be copied as source data",
		);
		assert.ok(
			plan.assets.includes("/avatar-human/maia-ma.png"),
			"asset paths inside JSON should be traced",
		);
		assert.ok(
			plan.assets.includes("/3p/slack/16.svg"),
			"nested asset paths inside JSON should be traced",
		);
		assert.ok(
			plan.assets.includes("/avatar-agent-unmasked/dev-agents/feature-flag-cleaner.svg"),
			"unmasked avatar companion assets should be traced",
		);
		assert.ok(
			plan.assets.includes("/3p/notion/16-borderless.svg"),
			"third-party borderless logo companion assets should be traced",
		);
		assert.ok(
			!plan.assets.includes("/app/data/directory/people.json"),
			"imported JSON should not be treated as a public asset",
		);
	} finally {
		fixture.cleanup();
	}
});

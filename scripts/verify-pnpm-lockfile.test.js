const test = require("node:test");
const assert = require("node:assert/strict");

const { findBlockedLockfileRegistryUrls } = require("./verify-pnpm-lockfile");

test("accepts npmjs tarball URLs for public Atlaskit packages", () => {
	const findings = findBlockedLockfileRegistryUrls(`
packages:
  '@atlaskit/icon@34.3.0':
    resolution: {tarball: https://registry.npmjs.org/@atlaskit/icon/-/icon-34.3.0.tgz}
`);

	assert.deepEqual(findings, []);
});

test("accepts npm-remote tarball URLs for non-Atlaskit packages", () => {
	const findings = findBlockedLockfileRegistryUrls(`
packages:
  '@example/package@1.0.0':
    resolution: {tarball: https://packages.atlassian.com/api/npm/npm-remote/@example/package/-/package-1.0.0.tgz}
`);

	assert.deepEqual(findings, []);
});

test("rejects npm-remote tarball URLs for public Atlaskit packages", () => {
	const findings = findBlockedLockfileRegistryUrls(`
packages:
  '@atlaskit/icon@34.3.0':
    resolution: {tarball: https://packages.atlassian.com/artifactory/api/npm/npm-remote/@atlaskit/icon/-/icon-34.3.0.tgz}
`);

	assert.equal(findings.length, 1);
	assert.equal(findings[0].line, 4);
	assert.match(findings[0].text, /npm-remote/u);
});

test("rejects atlassian-npm tarball URLs", () => {
	const findings = findBlockedLockfileRegistryUrls(`
packages:
  '@atlaskit/icon@34.3.0':
    resolution: {tarball: https://packages.atlassian.com/api/npm/atlassian-npm/@atlaskit/icon/-/icon-34.3.0.tgz}
`);

	assert.equal(findings.length, 1);
	assert.equal(findings[0].line, 4);
	assert.match(findings[0].text, /atlassian-npm/u);
});

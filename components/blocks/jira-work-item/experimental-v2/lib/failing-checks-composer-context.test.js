import assert from "node:assert/strict";
import test from "node:test";

import {
	FAILING_CHECKS_COMPOSER_PROMPT,
	serializeFailingChecksContext,
} from "./failing-checks-composer-context.ts";

test("serializeFailingChecksContext stays demo-scale and empty-safe", () => {
	assert.equal(serializeFailingChecksContext([]), "");
	assert.equal(
		serializeFailingChecksContext([
			{ name: "Lint and typecheck", details: "deliveryAddress may be null" },
		]),
		[
			"Failing PR checks:",
			"- Lint and typecheck: deliveryAddress may be null",
		].join("\n"),
	);
	assert.match(FAILING_CHECKS_COMPOSER_PROMPT, /Fix the failing CI check/u);
});

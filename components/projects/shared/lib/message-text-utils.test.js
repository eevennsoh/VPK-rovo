const test = require("node:test");
const assert = require("node:assert/strict");

const {
	extractPlanRenderableText,
	removeActionItemsSection,
	sanitizeMarkdownArtifactMarkers,
	suppressToolJsonTrace,
} = require("./message-text-utils.ts");

test("removes action items list but preserves surrounding text", () => {
	const input = `Let me load the create-plan skill.

Scope
- In: Agenda and speakers
- Out: Travel bookings

Action items
- [ ] Define event goals and format
- [ ] Establish budget and sponsorship
- [ ] Secure venue and AV setup

Follow-up
Share this plan with stakeholders.`;

	const output = removeActionItemsSection(input);
	assert.equal(
		output,
		`Let me load the create-plan skill.

Scope
- In: Agenda and speakers
- Out: Travel bookings

Follow-up
Share this plan with stakeholders.`
	);
});

test("supports unicode checklist bullets", () => {
	const input = `Plan intro

Action items
\u2022 \u2610 Define event goals and format
\u2022 \u2610 Establish budget and sponsorship`;

	const output = removeActionItemsSection(input);
	assert.equal(output, "Plan intro");
});

test("returns original text when no action items section exists", () => {
	const input = `Scope
- In: Agenda
- Out: Travel`;

	const output = removeActionItemsSection(input);
	assert.equal(output, input);
});

test("extracts mermaid and concise summary for plan rendering", () => {
	const input = `Used expand_folder
Invoking get_skill
Completed get_skill
Great idea! Let me quickly scan.

## Plan

Action items
- [ ] Define milestones
- [ ] Assign owners

\`\`\`mermaid
graph TD
  task_1["Define milestones"]
  task_2["Assign owners"]
  task_1 --> task_2
\`\`\`

This plan is ready to execute.
Share with the onboarding team.`;

	const output = extractPlanRenderableText(input, { maxSummaryLines: 2 });
	assert.equal(
		output.text,
		`\`\`\`mermaid
graph TD
  task_1["Define milestones"]
  task_2["Assign owners"]
  task_1 --> task_2
\`\`\`

This plan is ready to execute.
Share with the onboarding team.`
	);
	assert.equal(
		output.summary,
		`This plan is ready to execute.
Share with the onboarding team.`
	);
});

test("drops plan text when only action items and log lines exist", () => {
	const input = `Used expand_folder
Invoking open_files
Action items
- [ ] Draft onboarding plan
- [ ] Review with HR`;

	const output = extractPlanRenderableText(input);
	assert.equal(output.text, "");
	assert.equal(output.summary, "");
	assert.equal(output.mermaid, "");
});

test("extracts summary without trailing tool-results suppression phrase", () => {
	const input = `# Plan

Rebuild the sprint board at /sprint-board with a clean 4-column layout.
The existing route, data types, and dependencies are already in place.
Tool results were large and are omitted for performance. Open Tools for details.`;

	const output = extractPlanRenderableText(input, { maxSummaryLines: 3 });
	assert.equal(
		output.summary,
		`Rebuild the sprint board at /sprint-board with a clean 4-column layout.
The existing route, data types, and dependencies are already in place.`
	);
	assert.equal(
		output.text,
		`Rebuild the sprint board at /sprint-board with a clean 4-column layout.
The existing route, data types, and dependencies are already in place.`
	);
});

test("extracts full executive summary body from the plan section", () => {
	const input = `Perfect! I have all the context I need. Let me create a comprehensive plan.

# Plan

## Scope
- In: Jira integration, drag and drop, responsive layout
- Out: real-time collaboration

Implementation approach:
Use existing board primitives and add dependency-aware task flow.
Tool results were large and are omitted for performance. Open Tools for details.`;

	const output = extractPlanRenderableText(input, { summaryMode: "full" });
	assert.equal(
		output.summary,
		`## Scope
- In: Jira integration, drag and drop, responsive layout
- Out: real-time collaboration

Implementation approach:
Use existing board primitives and add dependency-aware task flow.`
	);
});

test("full summary mode omits mermaid fences from summary text", () => {
	const input = `# Plan

Define execution order and communicate build phases.

\`\`\`mermaid
graph TD
  task_1["Define execution order"]
  task_2["Communicate build phases"]
  task_1 --> task_2
\`\`\``;

	const output = extractPlanRenderableText(input, { summaryMode: "full" });
	assert.equal(
		output.summary,
		"Define execution order and communicate build phases."
	);
	assert.match(output.mermaid, /task_1 --> task_2/);
});

test("keeps only dependency mermaid blocks in rendered plan text", () => {
	const input = `# Plan

Use the dependency diagram for execution order.

\`\`\`mermaid
graph TD
  note["Context only"]
\`\`\`

\`\`\`mermaid
graph TD
  task_1["Define execution order"]
  task_2["Communicate build phases"]
  task_1 --> task_2
\`\`\`

Share with the team.`;

	const output = extractPlanRenderableText(input, { summaryMode: "full" });
	assert.match(output.mermaid, /task_1 --> task_2/);
	assert.doesNotMatch(output.mermaid, /Context only/);
	assert.equal(
		output.summary,
		`Use the dependency diagram for execution order.

Share with the team.`
	);
});

test("suppresses raw tool json and preserves summary narrative", () => {
	const input = `I'll help you list your Google Calendar events.
{
  "calendarId": "esoh@atlassian.com",
  "events": [
    {
      "id": "event-1",
      "summary": "Home",
      "start": { "date": "2026-02-20" },
      "end": { "date": "2026-02-21" }
    }
  ],
  "htmlLink": "https://calendar.google.com/calendar/event?id=abc123",
  "status": "confirmed"
}

Great! I successfully retrieved your Google Calendar events.
Here is a summary of your next 7 days.`;

	const output = suppressToolJsonTrace(input);
	assert.equal(
		output.text,
		`I'll help you list your Google Calendar events.

Great! I successfully retrieved your Google Calendar events.
Here is a summary of your next 7 days.`
	);
	assert.equal(output.replaced, true);
});

test("does not suppress normal non-json assistant text", () => {
	const input = `Here are your next 7 days:
- Friday: Home (all-day)
- Saturday: Team sync (10:00 AM)`;

	const output = suppressToolJsonTrace(input);
	assert.equal(output.text, input);
	assert.equal(output.replaced, false);
});

test("removes markdown artifact markers from assistant text", () => {
	const input = `I'm using text streaming fallback because I couldn't confirm tool context. (markdown:incomplete-link)`;
	const output = sanitizeMarkdownArtifactMarkers(input);
	assert.equal(
		output,
		"I'm using text streaming fallback because I couldn't confirm tool context."
	);
});

test("keeps normal markdown content while removing artifact markers", () => {
	const input = `See [calendar](https://calendar.google.com) for details. (markdown:incomplete-link)`;
	const output = sanitizeMarkdownArtifactMarkers(input);
	assert.equal(
		output,
		"See [calendar](https://calendar.google.com) for details."
	);
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WORKSPACE_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/asx/components/queue-conversation-workspace.tsx"),
	"utf8",
);
const CHAT_MESSAGES_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/shared/components/chat-messages.tsx"),
	"utf8",
);

test("awaiting Queue sessions replace the composer with the shared question experience", () => {
	assert.match(WORKSPACE_SOURCE, /import \{ QuestionCard \} from "@\/components\/blocks\/question-card\/components\/question-card"/u);
	assert.match(WORKSPACE_SOURCE, /import \{ QuestionCardShortcutsFooter \} from "@\/components\/projects\/shared\/components\/question-card-shortcuts-footer"/u);
	assert.match(WORKSPACE_SOURCE, /session\.status === "awaiting-input" \? session\.question : undefined/u);
	assert.match(WORKSPACE_SOURCE, /<ChatMessages[\s\S]*showAwaitingIndicator=\{Boolean\(awaitingQuestion\)\}/u);
	assert.match(WORKSPACE_SOURCE, /resizeTarget=\{awaitingQuestion \? "bottom" : "follow"\}/u);
	assert.match(CHAT_MESSAGES_SOURCE, /<Conversation[\s\S]*resizeTarget=\{resizeTarget\}/u);
	assert.match(WORKSPACE_SOURCE, /if \(!awaitingQuestion\) return;[\s\S]*requestAnimationFrame\(\(\) => \{[\s\S]*scrollToBottom\(\{[\s\S]*animation: false,[\s\S]*ignoreEscapes: true,[\s\S]*target: "bottom"[\s\S]*cancelAnimationFrame\(frameId\)/u);
	assert.doesNotMatch(WORKSPACE_SOURCE, /StatusInformationIcon|components\/ui-custom\/shimmer/u);
	assert.match(CHAT_MESSAGES_SOURCE, /import \{[\s\S]*ChainOfThought,[\s\S]*ChainOfThoughtHeader,[\s\S]*\} from "@\/components\/ui-custom\/chain-of-thought"/u);
	assert.match(CHAT_MESSAGES_SOURCE, /<ChainOfThought>[\s\S]*<ChainOfThoughtHeader showChevron=\{false\} state="thinking">[\s\S]*\{awaitingIndicatorLabel\}/u);
	assert.match(WORKSPACE_SOURCE, /onSubmit=\{\(answers\) => void handleAnswerQuestion\(answers\)\}/u);
	assert.match(WORKSPACE_SOURCE, /<QuestionCard[\s\S]*<QuestionCardShortcutsFooter \/>/u);
	assert.match(WORKSPACE_SOURCE, /await onAnswerQuestion\(answers\)/u);
});

test("completed Queue sessions render the appropriate context above the composer", () => {
	assert.match(WORKSPACE_SOURCE, /session\.fileChanges\?\.isDismissed \? undefined : session\.fileChanges/u);
	assert.match(WORKSPACE_SOURCE, /session\.status === "pr-open"/u);
	assert.match(WORKSPACE_SOURCE, /<ContextBarTagGroup[\s\S]*overflowAriaLabel="Show more session actions"/u);
	assert.match(WORKSPACE_SOURCE, /<ContextBarPill[\s\S]*aria-label="Dismiss file changes"[\s\S]*onClick=\{onDismissFileChanges\}/u);
	assert.match(
		WORKSPACE_SOURCE,
		/Changes:[\s\S]*inline-flex items-center gap-0\.5[\s\S]*font-mono font-normal text-text-success[\s\S]*font-mono font-normal text-text-danger/u,
	);
	assert.match(WORKSPACE_SOURCE, /Move to:[\s\S]*<ButtonGroup aria-label="Move Jira issue" variant="split">/u);
	assert.match(WORKSPACE_SOURCE, /"To do",[\s\S]*"In progress",[\s\S]*"In review",[\s\S]*"Done"/u);
	assert.match(WORKSPACE_SOURCE, /<ContextBarPill[\s\S]*interactive=\{false\}[\s\S]*Move to:/u);
	assert.match(WORKSPACE_SOURCE, /aria-label=\{`Move Jira issue to \$\{session\.jiraColumn\}`\}[\s\S]*onClick=\{\(\) => onJiraColumnChange\(session\.jiraColumn\)\}[\s\S]*size="compact"/u);
	assert.match(WORKSPACE_SOURCE, /<DropdownMenuTrigger[\s\S]*aria-label="Choose Jira column"[\s\S]*size="icon-compact"/u);
	assert.match(WORKSPACE_SOURCE, /<Lozenge className="pointer-events-none" variant=\{QUEUE_JIRA_COLUMN_VARIANTS\[column\]\}>/u);
	assert.match(WORKSPACE_SOURCE, /id: "jira-column",[\s\S]*onSelect: \(\) => onJiraColumnChange\(session\.jiraColumn\)/u);
	assert.doesNotMatch(WORKSPACE_SOURCE, /import \{ Tag \} from "@\/components\/ui\/tag"/u);
	assert.doesNotMatch(WORKSPACE_SOURCE, /selected=\{column === session\.jiraColumn\}/u);
	assert.match(WORKSPACE_SOURCE, /onSelect=\{\(\) => onJiraColumnChange\(column\)\}/u);
	assert.match(WORKSPACE_SOURCE, /<QueueSessionContextBar[\s\S]*<RovoAppComposer[\s\S]*<Footer \/>/u);
});

test("the Queue chat body centers within the space beside the environment panel", () => {
	assert.match(WORKSPACE_SOURCE, /const availableCenter = \(workspaceRect\.left \+ panelLeft\) \/ 2;/u);
	assert.match(WORKSPACE_SOURCE, /const unshiftedChatCenter = \(unshiftedChatLeft \+ unshiftedChatRight\) \/ 2;/u);
	assert.match(WORKSPACE_SOURCE, /const centeredShift = availableCenter - unshiftedChatCenter;/u);
	assert.match(WORKSPACE_SOURCE, /const leftEdgeShift = workspaceRect\.left - unshiftedChatLeft;/u);
	assert.match(WORKSPACE_SOURCE, /Math\.min\(0, Math\.max\(leftEdgeShift, centeredShift\)\)/u);
	assert.doesNotMatch(WORKSPACE_SOURCE, /unshiftedChatRight - panelLeft/u);
});

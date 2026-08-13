import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PULL_REQUEST_FIX_DETAIL: ComponentDetail = {
	description:
		'Pull request fix composer with a compact and an expanded presentation. Compact is the single-row prompt bar (`[ + ] [ editor ] [ send ]`); expanded grows it into a fix card with a "Fix" heading, a CI check-name badge, a dismiss control, and a coding-agent dropdown (logo + agent name, e.g. "Claude") beside Send. Both presentations render the same composer subtree, so expanding preserves the caret and draft. Uncontrolled blocks expand when the composer takes focus; pass `variant` to drive it from a host.',
	importStatement: `import { PullRequestFix } from "@/components/blocks/pull-request-fix";
import type { PullRequestFixProps } from "@/components/blocks/pull-request-fix";`,
	usage: `import { PullRequestFix } from "@/components/blocks/pull-request-fix";

// Uncontrolled — compact at rest, expands on composer focus
<PullRequestFix
  checkName="Lint and typecheck"
  onSubmit={({ body, agentId }) => startCiFix(agentId, body)}
/>

// Controlled presentation
<PullRequestFix
  variant={isReviewing ? "expanded" : "compact"}
  onVariantChange={setVariantFromBlock}
  onClose={() => setIsReviewing(false)}
  agentId={agentId}
  onAgentChange={setAgentId}
  value={draft}
  onValueChange={setDraft}
/>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "variant",
			type: '"compact" | "expanded"',
			description:
				"Controlled presentation. Takes precedence over `expandOnFocus`, so a host that owns open/closed state can drive both directions.",
		},
		{
			name: "defaultVariant",
			type: '"compact" | "expanded"',
			default: '"compact"',
			description: "Initial presentation for an uncontrolled block.",
		},
		{
			name: "onVariantChange",
			type: '(variant: "compact" | "expanded") => void',
			description:
				"Called when the block changes presentation — focus expansion or the dismiss control.",
		},
		{
			name: "expandOnFocus",
			type: "boolean",
			default: "true",
			description:
				"Expand into the fix card when the composer takes focus. Ignored while `variant` is controlled.",
		},
		{
			name: "title",
			type: "string",
			default: '"Fix"',
			description: "Heading shown in the expanded card.",
		},
		{
			name: "checkName",
			type: "string",
			description:
				'Failing CI check name rendered as a neutral badge beside the Fix heading (e.g. "Lint and typecheck"). Omitted when undefined or empty.',
		},
		{
			name: "placeholder",
			type: "string",
			default: '"write your instruction..."',
			description: "Composer placeholder, also used as its accessible name.",
		},
		{
			name: "value",
			type: "string",
			description: "Controlled draft body. Prefer with `onValueChange`.",
		},
		{
			name: "defaultValue",
			type: "string",
			default: '""',
			description: "Initial draft for an uncontrolled composer.",
		},
		{
			name: "onValueChange",
			type: "(value: string) => void",
			description: "Called on every composer keystroke.",
		},
		{
			name: "agentId",
			type: '"claude-code" | "codex" | "rovo-cli" | "cursor" | "github-copilot" | "gemini"',
			description:
				"Controlled coding agent for the agent dropdown. Prefer with `onAgentChange`. Defaults to Claude.",
		},
		{
			name: "defaultAgentId",
			type: '"claude-code" | "codex" | "rovo-cli" | "cursor" | "github-copilot" | "gemini"',
			default: '"codex"',
			description: "Uncontrolled coding-agent default.",
		},
		{
			name: "onAgentChange",
			type: "(agentId: PullRequestFixAgentId) => void",
			description: "Called when a coding agent is selected from the menu.",
		},
		{
			name: "onSubmit",
			type: "(submission: { body: string; agentId: PullRequestFixAgentId }) => void",
			description:
				"Called with the trimmed body and the selected coding agent. Send stays disabled while the body is empty.",
		},
		{
			name: "onClose",
			type: "() => void",
			description:
				"Called when the expanded card's dismiss control is activated. The block also collapses to compact.",
		},
		{
			name: "onAddClick",
			type: "() => void",
			description: 'Called when the leading "+" control is activated.',
		},
		{
			name: "inputContext",
			type: "ReactNode",
			description:
				"One-turn context pills (e.g. a selected diff range) rendered above the editor, below the heading row.",
		},
	],
};

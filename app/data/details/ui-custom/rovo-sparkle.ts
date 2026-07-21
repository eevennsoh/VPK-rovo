import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ROVO_SPARKLE_DETAIL: ComponentDetail = {
	description:
		"A compact Rovo generative-action button with a dark Jira-style tile, four-color hover mark, Motion-powered scale and rotation, and a composed Ask Rovo, agent, and skill selector.",
	usage: `import { RovoSparkle } from "@/components/ui-custom/rovo-sparkle";

<RovoSparkle
	agents={agents}
	skills={skills}
	size="compact"
	onSubmit={(request) => handleRovoAction(request)}
/>

<RovoSparkle
	agents={agents}
	skills={skills}
	onSubmit={(request) => handleRovoAction(request)}
/>`,
	props: [
		{ name: "agents", type: "readonly RovoSparkleItem[]", description: "Agent rows shown before the Skills section." },
		{ name: "skills", type: "readonly RovoSparkleItem[]", description: "Skill rows shown after the Agents section." },
		{ name: "size", type: '"compact" | "default"', default: '"default"', description: "24px compact or 32px default button geometry." },
		{ name: "onSubmit", type: "(request: RovoSparkleActionRequest) => void | Promise<void>", description: "Receives a discriminated Ask Rovo, agent, or skill action and closes the selector." },
		{ name: "open", type: "boolean", description: "Controlled popover state." },
		{ name: "defaultOpen", type: "boolean", default: "false", description: "Initial popover state when uncontrolled." },
		{ name: "onOpenChange", type: "(open: boolean) => void", description: "Called whenever the selector opens or closes." },
		{ name: "ariaLabel", type: "string", default: '"Open Rovo actions"', description: "Accessible label for the icon-only trigger." },
		{ name: "triggerElement", type: "ReactElement", description: "Optional custom trigger; use RovoSparkleButton to retain the shared visual treatment." },
	],
	examples: [
		{
			title: "Sizes and selector",
			description: "Compact and default sparkles with the shared Ask Rovo, Agents, and Skills selector.",
			demoSlug: "rovo-sparkle",
		},
	],
};

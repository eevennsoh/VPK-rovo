import AutomationIcon from "@atlaskit/icon/core/automation";
import BranchIcon from "@atlaskit/icon/core/branch";
import FlaskIcon from "@atlaskit/icon/core/flask";
import LinkIcon from "@atlaskit/icon/core/link";
import BookOpenIcon from "@atlaskit/icon-lab/core/book-open";
import SuggestedEditIcon from "@atlaskit/icon-lab/core/suggested-edit";
import type { RovoSuggestion } from "@/lib/rovo-suggestions";

export const AGENT_EDIT_GREETING_HEADING = "Improve your agent?";
export const AGENT_EDIT_GREETING_ILLUSTRATION_SRC = "/illustration-ai/ai/light.svg";
export const AGENT_EDIT_GREETING_ILLUSTRATION_DARK_SRC = "/illustration-ai/ai/dark.svg";

export const agentEditSuggestions: RovoSuggestion[] = [
	{
		id: "agent-edit-test",
		label: "Test this agent",
		prompt: "Test this agent",
		icon: FlaskIcon,
		type: "skill",
	},
	{
		id: "agent-edit-advanced-logic",
		label: "Add advanced logic",
		prompt: "Add advanced logic to this agent",
		icon: BranchIcon,
		type: "skill",
	},
	{
		id: "agent-edit-configure-runs",
		label: "Configure when the agent runs",
		prompt: "Configure when this agent runs",
		icon: AutomationIcon,
		type: "skill",
	},
	{
		id: "agent-edit-improve",
		label: "Improve this agent",
		prompt: "Improve this agent",
		icon: SuggestedEditIcon,
		type: "skill",
	},
	{
		id: "agent-edit-instructions",
		label: "Update the agent's instructions",
		prompt: "Update this agent's instructions",
		icon: BookOpenIcon,
		type: "skill",
	},
	{
		id: "agent-edit-connect-tools",
		label: "Connect tools and knowledge",
		prompt: "Connect tools and knowledge to this agent",
		icon: LinkIcon,
		type: "skill",
	},
];

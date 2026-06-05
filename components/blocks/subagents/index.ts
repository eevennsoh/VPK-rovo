export { default } from "./page";
export { SubagentsNavigator } from "./subagents-navigator";
export { SubagentPromptFields } from "./components/subagent-prompt-fields";
export { ManageSubagentsDialog } from "./components/manage-subagents-dialog";
export {
	cloneConfig,
	cloneBaseAgent,
	cloneSubagentPrompt,
	createDraftSubagentPrompt,
	getBaseConfigWithSubagents,
	getDerivedSubagentNames,
	getListItems,
	normalizeBaseAgent,
	normalizeSubagentPrompts,
	updateConfigListItem,
} from "./lib/subagent-prompts";

export type { SubagentPrompt, SubagentsBaseAgent } from "./data/demo-agents";

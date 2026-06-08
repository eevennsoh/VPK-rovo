import templatesData from "./agent-templates.json";

/**
 * Tabs the agent-template directory is grouped by, mirrored by the bento and
 * agents-directory surfaces. Owned here so the data layer is the single source
 * of truth; the UI components import this union rather than redeclaring it.
 */
export type AgentTemplateCategoryId =
	| "brainstorm"
	| "analyze"
	| "review"
	| "summarize"
	| "create";

export const AGENT_TEMPLATE_CATEGORY_IDS: readonly AgentTemplateCategoryId[] = [
	"brainstorm",
	"analyze",
	"review",
	"summarize",
	"create",
];

/**
 * Authored config for one agent template. Richer than a directory agent record:
 * it carries `instructions` (the template's robust setup guidance) plus the
 * stats/attribution the directory cards render. Connected-app `sourceKeys` are
 * resolved to display sources by the component loader; skills/capabilities are
 * derived there too, so this stays pure, serializable data.
 */
export interface AgentTemplateConfig {
	id: string;
	categoryId: AgentTemplateCategoryId;
	name: string;
	description: string;
	/** Robust, structured setup/usage guidance shown in the template detail. */
	instructions: string;
	avatarSrc: string;
	publisher: string;
	attributionKind?: "company" | "team" | "person";
	publisherLogoSrc?: string;
	verified?: boolean;
	/** Keys into the component loader's connected-app SOURCE map. */
	sourceKeys?: readonly string[];
	/** Optional override for the generated "remix this template" prompt. */
	templatePrompt?: string;
	remix: string;
	updated: string;
	peopleOffset: number;
	collaboratorOverflow?: number;
}

/**
 * The complete agent-template catalog, sourced from `agent-templates.json` as the
 * single source of truth. Powers the agent-templates directory, the agents-directory
 * template tab, and the agent-bento operations tiles.
 */
export const AGENT_TEMPLATE_CONFIGS: readonly AgentTemplateConfig[] =
	templatesData as readonly AgentTemplateConfig[];

/** Convenience lookup by id. */
export function getAgentTemplateConfigById(id: string): AgentTemplateConfig | undefined {
	return AGENT_TEMPLATE_CONFIGS.find((template) => template.id === id);
}

/** All template configs in a given category, in catalog order. */
export function getAgentTemplateConfigsByCategory(
	categoryId: AgentTemplateCategoryId,
): readonly AgentTemplateConfig[] {
	return AGENT_TEMPLATE_CONFIGS.filter((template) => template.categoryId === categoryId);
}

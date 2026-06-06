import {
	DEFAULT_KNOWLEDGE_APPS,
	DEFAULT_SKILLS,
	DEMO_AGENT_BROWSER_AGENTS,
	DEMO_SESSION_TOOLS,
	DEMO_TEAMS,
	DEMO_TOOLS,
	getAgentDirectoryVisual,
	getPersonDirectoryVisual,
	getSkillDirectoryVisual,
	getTeamDirectoryVisual,
	getToolDirectoryVisual,
	resolveDirectoryVisual,
	SAMPLE_AGENT_PEOPLE,
	type AgentPerson,
	type DirectoryTeam,
	type KnowledgeDirectoryApp,
	type SkillsDirectorySkill,
	type ToolsDirectoryTool,
} from "@/app/data/directory";
import type { AgentBrowserAgent } from "@/components/blocks/agent-browser";
import type {
	RichTextMentionCategory,
	RichTextMentionItem,
	RichTextMentionSources,
	RichTextReferenceCategory,
} from "@/components/ui-custom/rich-text-editor";

function toMentionId(category: RichTextMentionCategory, id: string): string {
	return `${category}:${id.trim().replace(/\s+/g, "-")}`;
}

function normalizeLookupValue(value: string): string {
	return value.trim().toLowerCase();
}

function mapAgentToMentionItem(agent: AgentBrowserAgent): RichTextMentionItem {
	return {
		category: "subagent",
		description: agent.description ?? agent.byline,
		id: toMentionId("subagent", agent.id),
		label: agent.name,
		visual: resolveDirectoryVisual(getAgentDirectoryVisual(agent)),
	};
}

function mapSkillToMentionItem(skill: SkillsDirectorySkill): RichTextMentionItem {
	return {
		category: "skill",
		description: skill.description,
		id: toMentionId("skill", skill.id),
		label: skill.name,
		visual: resolveDirectoryVisual(getSkillDirectoryVisual(skill)),
	};
}

function mapToolToMentionItem(tool: ToolsDirectoryTool): RichTextMentionItem {
	return {
		category: "tool",
		description: tool.description,
		id: toMentionId("tool", tool.id),
		label: tool.name,
		visual: resolveDirectoryVisual(getToolDirectoryVisual(tool)),
	};
}

function mapPersonToMentionItem(person: AgentPerson): RichTextMentionItem {
	return {
		category: "human",
		id: toMentionId("human", person.id),
		label: person.name,
		visual: resolveDirectoryVisual(getPersonDirectoryVisual(person)),
	};
}

function mapTeamToMentionItem(team: DirectoryTeam): RichTextMentionItem {
	return {
		category: "team",
		description: team.description,
		id: toMentionId("team", team.id),
		label: team.name,
		visual: resolveDirectoryVisual(getTeamDirectoryVisual(team)),
	};
}

function getKnowledgeMentionItems(): RichTextMentionItem[] {
	return DEFAULT_KNOWLEDGE_APPS.flatMap((app: KnowledgeDirectoryApp) => {
		const visual = resolveDirectoryVisual(app.visual);

		return [
			{
				category: "knowledge" as const,
				description: app.description,
				id: toMentionId("knowledge", `${app.id}:all`),
				label: `${app.name} - all content`,
				visual,
			},
			...app.contents.map((content) => ({
				category: "knowledge" as const,
				description: content.description,
				id: toMentionId("knowledge", `${app.id}:${content.id}`),
				label: content.name,
				visual,
			})),
		];
	});
}

function uniqueMentionItems(items: readonly RichTextMentionItem[]): readonly RichTextMentionItem[] {
	const seen = new Set<string>();

	return items.filter((item) => {
		const key = `${item.category}:${normalizeLookupValue(item.label)}`;
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

/**
 * The unified mention/token catalog for the composer/editor surfaces. Every
 * category is built from the `@/app/data/directory` loaders — the single source
 * of truth — via each vertical's `getXDirectoryVisual` helper so the `@` and `/`
 * surfaces draw the same tokens the directories render.
 */
export const EDITOR_PALETTE_MENTION_SOURCES: RichTextMentionSources = {
	knowledge: uniqueMentionItems(getKnowledgeMentionItems()),
	skill: uniqueMentionItems(DEFAULT_SKILLS.map(mapSkillToMentionItem)),
	subagent: uniqueMentionItems(DEMO_AGENT_BROWSER_AGENTS.map(mapAgentToMentionItem)),
	tool: uniqueMentionItems([...DEMO_TOOLS, ...DEMO_SESSION_TOOLS].map(mapToolToMentionItem)),
	human: uniqueMentionItems(SAMPLE_AGENT_PEOPLE.map(mapPersonToMentionItem)),
	team: uniqueMentionItems(DEMO_TEAMS.map(mapTeamToMentionItem)),
};

export function getDirectoryMentionItem(
	category: RichTextReferenceCategory,
	label: string,
): RichTextMentionItem | undefined {
	const normalizedLabel = normalizeLookupValue(label);

	return EDITOR_PALETTE_MENTION_SOURCES[category]?.find(
		(item) => normalizeLookupValue(item.label) === normalizedLabel,
	);
}

export function getDirectoryMentionItemOrFallback(
	category: RichTextReferenceCategory,
	label: string,
): RichTextMentionItem {
	return getDirectoryMentionItem(category, label) ?? {
		category,
		id: toMentionId(category, label),
		label,
	};
}

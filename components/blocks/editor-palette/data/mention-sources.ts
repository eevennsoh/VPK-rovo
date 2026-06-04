import { DEMO_AGENT_BROWSER_AGENTS } from "@/components/blocks/agent-browser/data/demo-agents";
import { DEFAULT_KNOWLEDGE_APPS } from "@/components/blocks/knowledge-directory/data/apps";
import {
	DEFAULT_SKILLS,
	getSkillIcon,
	type SkillsDirectorySkill,
} from "@/components/blocks/skills-directory/data/skills";
import { DEMO_SESSION_TOOLS, DEMO_TOOLS } from "@/components/blocks/tools-directory/data/demo-tools";
import type { ToolsDirectoryTool } from "@/components/blocks/tools-directory";
import type { AgentBrowserAgent } from "@/components/blocks/agent-browser";
import type {
	RichTextMentionItem,
	RichTextMentionSources,
	RichTextReferenceCategory,
} from "@/components/ui-custom/rich-text-editor";

function toMentionId(category: RichTextReferenceCategory, id: string): string {
	return `${category}:${id.trim().replace(/\s+/g, "-")}`;
}

function normalizeLookupValue(value: string): string {
	return value.trim().toLowerCase();
}

function getAgentVisual(agent: AgentBrowserAgent): RichTextMentionItem["visual"] {
	if (agent.logoName) {
		return { kind: "logo", logoName: agent.logoName };
	}

	if (!agent.avatarSrc) {
		return undefined;
	}

	return {
		kind: agent.avatarSrc.startsWith("/avatar-agent/") ? "avatar" : "image",
		shape: agent.avatarSrc.startsWith("/avatar-agent/") ? "hexagon" : "square",
		src: agent.avatarSrc,
	};
}

function mapAgentToMentionItem(agent: AgentBrowserAgent): RichTextMentionItem {
	return {
		category: "subagent",
		description: agent.description ?? agent.byline,
		id: toMentionId("subagent", agent.id),
		label: agent.name,
		visual: getAgentVisual(agent),
	};
}

function mapSkillToMentionItem(skill: SkillsDirectorySkill): RichTextMentionItem {
	const iconKey = skill.icon ?? "page";

	return {
		category: "skill",
		description: skill.description,
		id: toMentionId("skill", skill.id),
		label: skill.name,
		visual: {
			kind: "icon",
			icon: getSkillIcon(iconKey),
			iconColor: skill.iconColor,
			iconKey,
		},
	};
}

function getToolVisual(tool: ToolsDirectoryTool): RichTextMentionItem["visual"] {
	if (tool.logoName) {
		return { kind: "logo", logoName: tool.logoName };
	}

	if (!tool.avatarSrc) {
		return undefined;
	}

	return {
		kind: tool.avatarSrc.startsWith("/avatar-agent/") ? "avatar" : "image",
		shape: tool.avatarSrc.startsWith("/avatar-agent/") ? "hexagon" : "square",
		src: tool.avatarSrc,
	};
}

function mapToolToMentionItem(tool: ToolsDirectoryTool): RichTextMentionItem {
	return {
		category: "tool",
		description: tool.description,
		id: toMentionId("tool", tool.id),
		label: tool.name,
		visual: getToolVisual(tool),
	};
}

function getKnowledgeMentionItems(): RichTextMentionItem[] {
	return DEFAULT_KNOWLEDGE_APPS.flatMap((app) => [
		{
			category: "knowledge" as const,
			description: app.description,
			id: toMentionId("knowledge", `${app.id}:all`),
			label: `${app.name} - all content`,
			visual: app.visual,
		},
		...app.contents.map((content) => ({
			category: "knowledge" as const,
			description: content.description,
			id: toMentionId("knowledge", `${app.id}:${content.id}`),
			label: content.name,
			visual: app.visual,
		})),
	]);
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

export const EDITOR_PALETTE_MENTION_SOURCES: RichTextMentionSources = {
	knowledge: uniqueMentionItems(getKnowledgeMentionItems()),
	skill: uniqueMentionItems(DEFAULT_SKILLS.map(mapSkillToMentionItem)),
	subagent: uniqueMentionItems(DEMO_AGENT_BROWSER_AGENTS.map(mapAgentToMentionItem)),
	tool: uniqueMentionItems([...DEMO_TOOLS, ...DEMO_SESSION_TOOLS].map(mapToolToMentionItem)),
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

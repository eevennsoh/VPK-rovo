"use strict";

const MAX_LABEL_LENGTH = 96;
const MAX_ITEMS_PER_SECTION = 8;
const MERMAID_FENCE_PATTERN = /```(?:mermaid|mmd)?\s*([\s\S]*?)```/iu;
const MERMAID_EDGE_PATTERN = /(?:-->|---|==>|-.->|--[^\n]*-->)/u;
const MEMORY_REFERENCE_PATTERNS = [
	/\bmemory\s*:\s*([^\]\)\n,;]+)/giu,
	/\[\[memory\s*:\s*([^\]\n]+)\]\]/giu,
	/\[@memory\s*:\s*([^\]\n]+)\]/giu,
];

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeAgentDataFlowConfig(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return value;
}

function normalizeStringList(value) {
	if (!Array.isArray(value)) {
		return [];
	}

	const seen = new Set();
	const items = [];
	for (const item of value) {
		const normalized = getNonEmptyString(item);
		if (!normalized) {
			continue;
		}

		const key = normalized.toLowerCase();
		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		items.push(normalized);
	}
	return items;
}

function truncateLabel(value) {
	const normalized = value.replace(/\s+/gu, " ").trim();
	if (normalized.length <= MAX_LABEL_LENGTH) {
		return normalized;
	}

	return `${normalized.slice(0, MAX_LABEL_LENGTH - 1).trim()}...`;
}

function escapeMermaidLabel(value) {
	return truncateLabel(String(value))
		.replace(/"/gu, "#quot;")
		.replace(/\[/gu, "(")
		.replace(/\]/gu, ")")
		.replace(/\{/gu, "(")
		.replace(/\}/gu, ")")
		.replace(/\|/gu, "/");
}

function mermaidNode(id, label) {
	return `${id}["${escapeMermaidLabel(label)}"]`;
}

function extractMemoryReferences(instructions) {
	const source = getNonEmptyString(instructions);
	if (!source) {
		return [];
	}

	const references = [];
	const seen = new Set();
	for (const pattern of MEMORY_REFERENCE_PATTERNS) {
		pattern.lastIndex = 0;
		for (const match of source.matchAll(pattern)) {
			const label = getNonEmptyString(match[1])
				.replace(/^["'`]+|["'`]+$/gu, "")
				.replace(/\s+(?:before|after|and|then|when|while|for)\b.*$/iu, "")
				.replace(/[.!?]+$/gu, "")
				.trim();
			if (!label) {
				continue;
			}
			const key = label.toLowerCase();
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			references.push(label);
		}
	}

	return references;
}

function getAgentTriggerItems(config) {
	const triggers = normalizeStringList(config?.triggers);
	if (triggers.length > 0) {
		return triggers;
	}

	const trigger = getNonEmptyString(config?.trigger);
	return trigger ? [trigger] : [];
}

function buildSection(lines, rootId, sectionId, sectionLabel, items, edgeLabel) {
	if (items.length === 0) {
		return;
	}

	lines.push(`\t${mermaidNode(sectionId, sectionLabel)}`);
	lines.push(`\t${rootId} -->|"${escapeMermaidLabel(edgeLabel)}"| ${sectionId}`);

	items.slice(0, MAX_ITEMS_PER_SECTION).forEach((item, index) => {
		const itemId = `${sectionId}_${index + 1}`;
		lines.push(`\t${mermaidNode(itemId, item)}`);
		lines.push(`\t${sectionId} --> ${itemId}`);
	});

	if (items.length > MAX_ITEMS_PER_SECTION) {
		const overflowId = `${sectionId}_more`;
		lines.push(`\t${mermaidNode(overflowId, `${items.length - MAX_ITEMS_PER_SECTION} more`)}`);
		lines.push(`\t${sectionId} --> ${overflowId}`);
	}
}

function buildAgentDataFlowMermaid(config = {}) {
	config = normalizeAgentDataFlowConfig(config);

	const agentName =
		getNonEmptyString(config.name) ||
		getNonEmptyString(config.agentId) ||
		"Untitled agent";
	const description =
		getNonEmptyString(config.description) ||
		getNonEmptyString(config.summary);
	const instructions = getNonEmptyString(config.instructions);
	const context = getNonEmptyString(config.contextDescription);
	const guardrail = getNonEmptyString(config.guardrail);
	const triggers = getAgentTriggerItems(config);
	const skills = normalizeStringList(config.skills);
	const tools = normalizeStringList(config.tools);
	const subagents = normalizeStringList(config.subagents);
	const knowledge = normalizeStringList(config.knowledge);
	const starters = normalizeStringList(config.conversationStarters);
	const memory = extractMemoryReferences(instructions);

	const lines = [
		"flowchart LR",
		`\t${mermaidNode("agent", agentName)}`,
	];

	const coreItems = [
		description ? `Description: ${description}` : "",
		instructions ? `Instructions: ${instructions}` : "",
		context ? `Context: ${context}` : "",
		guardrail ? `Guardrail: ${guardrail}` : "",
	].filter(Boolean);

	buildSection(lines, "agent", "core", "Core setup", coreItems, "defined by");
	buildSection(lines, "agent", "triggers", "Triggers", triggers, "runs when");
	buildSection(lines, "agent", "knowledge", "Knowledge", knowledge, "grounds on");
	buildSection(lines, "agent", "memory", "Memory", memory, "recalls");
	buildSection(lines, "agent", "skills", "Skills", skills, "uses");
	buildSection(lines, "agent", "tools", "Tools", tools, "connects to");
	buildSection(lines, "agent", "subagents", "Subagents", subagents, "delegates to");
	buildSection(lines, "agent", "starters", "Conversation starters", starters, "suggests");

	if (lines.length === 2) {
		lines.push(`\t${mermaidNode("draft", "Draft configuration")}`);
		lines.push("\tagent --> draft");
	}

	return lines.join("\n");
}

function extractMermaidCode(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return "";
	}

	const fenced = text.match(MERMAID_FENCE_PATTERN);
	const candidate = fenced ? fenced[1] : text;
	return candidate.trim();
}

function isValidAgentDataFlowMermaid(value) {
	const mermaid = extractMermaidCode(value);
	if (!/^(?:flowchart|graph)\s+(?:LR|RL|TB|BT|TD)\b/iu.test(mermaid)) {
		return false;
	}

	return MERMAID_EDGE_PATTERN.test(mermaid);
}

function buildAgentDataFlowRefinementPrompt({ config = {}, baselineMermaid = "" } = {}) {
	return [
		"Refine this agent setup into a concise Mermaid data-flow diagram.",
		"Return Mermaid code only. Do not include markdown fences, explanations, or prose.",
		"Use flowchart LR or graph LR. Keep labels short. Preserve concrete setup values.",
		"Show relationships between the agent, instructions, triggers, knowledge, memory, skills, tools, subagents, guardrails, and conversation starters when present.",
		"",
		"Agent setup JSON:",
		JSON.stringify(config, null, 2),
		"",
		"Baseline Mermaid:",
		baselineMermaid,
	].join("\n");
}

async function refineAgentDataFlowMermaid({
	config = {},
	baselineMermaid,
	generateText,
	signal,
} = {}) {
	const baseline = isValidAgentDataFlowMermaid(baselineMermaid)
		? extractMermaidCode(baselineMermaid)
		: buildAgentDataFlowMermaid(config);

	if (typeof generateText !== "function") {
		return { mermaid: baseline };
	}

	const text = await generateText({
		system: "You turn agent configuration into valid Mermaid data-flow diagrams. Return Mermaid code only.",
		prompt: buildAgentDataFlowRefinementPrompt({
			config,
			baselineMermaid: baseline,
		}),
		maxOutputTokens: 1200,
		temperature: 0.2,
		signal,
	});
	const refined = extractMermaidCode(text);

	return {
		mermaid: isValidAgentDataFlowMermaid(refined) ? refined : baseline,
	};
}

module.exports = {
	buildAgentDataFlowMermaid,
	buildAgentDataFlowRefinementPrompt,
	escapeMermaidLabel,
	extractMemoryReferences,
	extractMermaidCode,
	isValidAgentDataFlowMermaid,
	normalizeAgentDataFlowConfig,
	refineAgentDataFlowMermaid,
};

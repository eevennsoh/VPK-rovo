export interface StudioAgentDataFlowConfig {
	agentId?: string;
	name?: string;
	description?: string;
	summary?: string;
	instructions?: string;
	contextDescription?: string;
	trigger?: string;
	triggers?: readonly string[];
	skills?: readonly string[];
	guardrail?: string;
	tools?: readonly string[];
	subagents?: readonly string[];
	knowledge?: readonly string[];
	conversationStarters?: readonly string[];
	action?: string;
}

export function buildAgentDataFlowMermaid(config?: StudioAgentDataFlowConfig): string;
export function buildAgentDataFlowRefinementPrompt(input?: {
	config?: StudioAgentDataFlowConfig;
	baselineMermaid?: string;
}): string;
export function escapeMermaidLabel(value: string): string;
export function extractMemoryReferences(instructions?: string): string[];
export function extractMermaidCode(value?: string): string;
export function isValidAgentDataFlowMermaid(value?: string): boolean;
export function refineAgentDataFlowMermaid(input?: {
	config?: StudioAgentDataFlowConfig;
	baselineMermaid?: string;
	generateText?: (options: {
		system?: string;
		prompt?: string;
		maxOutputTokens?: number;
		temperature?: number;
		signal?: AbortSignal;
	}) => Promise<string>;
	signal?: AbortSignal;
}): Promise<{ mermaid: string }>;

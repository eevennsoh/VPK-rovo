"use client";

import { type ReactNode, useState } from "react";
import { AgentAccess } from "@/components/blocks/agent-access";
import { AgentEvaluation } from "@/components/blocks/agent-evaluation";
import { AgentInsights } from "@/components/blocks/agent-insights";
import { AgentSurfaces } from "@/components/blocks/agent-surfaces";
import { AgentUsers } from "@/components/blocks/agent-users";
import {
	Agent,
	AgentConfigFields,
	type AgentConfigFormValue,
	type AgentCompactHeaderSection,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
	AgentContent,
	AgentCompactHeaderNav,
	AgentHeader,
} from "@/components/ui-custom/agent";
import {
	serializeAgentTriggerLabels,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/page";
import { DEFAULT_CONFIGURED_TRIGGER_VALUES } from "@/components/blocks/triggers/data/trigger-catalog";
import { cn } from "@/lib/utils";

const AGENT_DEMO_SURFACE_CLASSNAME = "min-h-[852px] w-full";

const initialAgentConfig: AgentConfigFormValue = {
	name: "",
	description: "",
	summary: "",
	instructions: "",
	contextDescription: "",
	trigger: "",
	guardrail: "",
	tools: [],
	conversationStarters: [],
	agentId: "policy-checker",
	action: "draft",
};

const emptyAgentConfig: AgentConfigFormValue = {
	...initialAgentConfig,
	name: "Untitled agent",
	description: "",
	summary: "",
	agentId: "customer-insights",
};

const filledAgentConfig: AgentConfigFormValue = {
	name: "Policy Checker",
	description:
		"This agent helps employees quickly find and understand company guidelines, HR policies, and benefits information.",
	summary:
		"This agent helps employees quickly find and understand company guidelines, HR policies, and benefits information.",
	instructions: "",
	contextDescription: "",
	triggerDefinitions: DEFAULT_CONFIGURED_TRIGGER_VALUES,
	triggers: serializeAgentTriggerLabels(DEFAULT_CONFIGURED_TRIGGER_VALUES),
	skills: ["create-work-items", "create-work-items"],
	tools: ["Tool name", "Tool name"],
	subagents: ["Subagent 1", "Subagent 1"],
	knowledge: ["Knowledge 1", "Knowledge 2"],
	conversationStarters: [],
	agentId: "policy-checker",
	action: "draft",
};

function useAgentDemoConfig(initialConfig: AgentConfigFormValue) {
	const [config, setConfig] = useState<AgentConfigFormValue>(initialConfig);

	function handleTextChange(field: AgentConfigTextFieldName, value: string) {
		setConfig((current) => ({
			...current,
			[field]: value,
			...(field === "description" ? { summary: value } : {}),
		}));
	}

	function updateListItem(field: AgentConfigListFieldName, index: number, value: string) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? [...current[field]] : [];
			items[index] = value;
			return { ...current, [field]: items };
		});
	}

	function removeListItem(field: AgentConfigListFieldName, index: number) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? current[field] : [];
			return { ...current, [field]: items.filter((_, itemIndex) => itemIndex !== index) };
		});
	}

	function appendListItem(field: AgentConfigListFieldName) {
		setConfig((current) => {
			const items = Array.isArray(current[field]) ? current[field] : [];
			return { ...current, [field]: [...items, ""] };
		});
	}

	function handleTriggerDefinitionsChange(triggerDefinitions: readonly AgentTriggerValue[]) {
		const triggerLabels = serializeAgentTriggerLabels(triggerDefinitions);
		setConfig((current) => ({
			...current,
			triggerDefinitions,
			trigger: triggerLabels[0] ?? "",
			triggers: triggerLabels,
		}));
	}

	return {
		config,
		appendListItem,
		handleTextChange,
		handleTriggerDefinitionsChange,
		removeListItem,
		updateListItem,
	};
}

/**
 * Shared body for the compact agent demos. The header nav is a *controlled*
 * component — it only reacts when a parent owns `activeSection` and feeds it
 * back — so every nav-bearing demo routes its selected section through here.
 * Each section's screen owns its own scroll container + padding, so panels
 * render inside a bounded `flex-1 min-h-0` region rather than the padded
 * `AgentContent`; when no section is active we fall back to `configView`.
 */
function AgentDemoCompactBody({
	activeSection,
	configView,
}: Readonly<{
	activeSection: AgentCompactHeaderSection | null;
	configView: ReactNode;
}>) {
	if (activeSection === "insights") {
		return (
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<AgentInsights />
			</div>
		);
	}
	if (activeSection === "evaluation") {
		return (
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<AgentEvaluation />
			</div>
		);
	}
	if (activeSection === "access") {
		return (
			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="mx-auto w-full max-w-4xl px-6 py-5">
					<AgentAccess />
				</div>
			</div>
		);
	}
	if (activeSection === "users") {
		return (
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
				<AgentUsers />
			</div>
		);
	}
	if (activeSection === "surfaces") {
		return (
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
				<AgentSurfaces />
			</div>
		);
	}
	return configView;
}

export function AgentDemoFull() {
	const {
		appendListItem,
		config,
		handleTextChange,
		handleTriggerDefinitionsChange,
		removeListItem,
		updateListItem,
	} = useAgentDemoConfig(filledAgentConfig);
	const [activeSection, setActiveSection] = useState<AgentCompactHeaderSection | null>(null);

	return (
		<Agent className={cn(AGENT_DEMO_SURFACE_CLASSNAME, "flex flex-col")}>
			<AgentHeader
				leadingContent={
					<AgentCompactHeaderNav activeSection={activeSection} onSectionChange={setActiveSection} />
				}
				name={config.name?.trim() || "Untitled agent"}
			/>
			<AgentDemoCompactBody
				activeSection={activeSection}
				configView={
					<AgentContent>
						<AgentConfigFields
							config={config}
							idPrefix="agent-demo-full"
							onTextChange={handleTextChange}
							onListItemChange={updateListItem}
							onRemoveListItem={removeListItem}
							onAppendListItem={appendListItem}
							onTriggerDefinitionsChange={handleTriggerDefinitionsChange}
						/>
					</AgentContent>
				}
			/>
		</Agent>
	);
}

export function AgentDemoEmpty() {
	const {
		appendListItem,
		config,
		handleTextChange,
		handleTriggerDefinitionsChange,
		removeListItem,
		updateListItem,
	} = useAgentDemoConfig(emptyAgentConfig);
	const [activeSection, setActiveSection] = useState<AgentCompactHeaderSection | null>(null);

	return (
		<Agent className={cn(AGENT_DEMO_SURFACE_CLASSNAME, "flex flex-col")}>
			<AgentHeader
				leadingContent={
					<AgentCompactHeaderNav activeSection={activeSection} onSectionChange={setActiveSection} />
				}
				name={config.name?.trim() || "Untitled agent"}
			/>
			<AgentDemoCompactBody
				activeSection={activeSection}
				configView={
					<AgentContent>
						<AgentConfigFields
							config={config}
							idPrefix="agent-demo-empty"
							onTextChange={handleTextChange}
							onListItemChange={updateListItem}
							onRemoveListItem={removeListItem}
							onAppendListItem={appendListItem}
							onTriggerDefinitionsChange={handleTriggerDefinitionsChange}
						/>
					</AgentContent>
				}
			/>
		</Agent>
	);
}

export default function AgentDemo() {
	return <AgentDemoFull />;
}

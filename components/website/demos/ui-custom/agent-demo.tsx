"use client";

import { useState } from "react";
import {
	Agent,
	AgentConfigFields,
	type AgentConfigFormValue,
	type AgentCompactHeaderSection,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
	AgentContent,
	AgentCompactHeaderNav,
	AgentCompactSurfacesPanel,
	AgentHeader,
} from "@/components/ui-custom/agent";

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
	triggers: ["Company Handbook", "Company Handbook"],
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

	return {
		config,
		appendListItem,
		handleTextChange,
		removeListItem,
		updateListItem,
	};
}

export function AgentDemoFull() {
	const {
		appendListItem,
		config,
		handleTextChange,
		removeListItem,
		updateListItem,
	} = useAgentDemoConfig(filledAgentConfig);

	return (
		<Agent className="mx-auto min-h-[852px] w-full max-w-[720px]">
			<AgentHeader
				name={config.name?.trim() || "Untitled agent"}
				model="Draft"
			/>
			<AgentContent>
				<AgentConfigFields
					config={config}
					idPrefix="agent-demo-full"
					onTextChange={handleTextChange}
					onListItemChange={updateListItem}
					onRemoveListItem={removeListItem}
					onAppendListItem={appendListItem}
				/>
			</AgentContent>
		</Agent>
	);
}

export function AgentDemoEmpty() {
	const {
		appendListItem,
		config,
		handleTextChange,
		removeListItem,
		updateListItem,
	} = useAgentDemoConfig(emptyAgentConfig);

	return (
		<Agent className="mx-auto min-h-[852px] w-full max-w-[720px]">
			<AgentHeader
				name={config.name?.trim() || "Untitled agent"}
				model="Draft"
			/>
			<AgentContent>
				<AgentConfigFields
					config={config}
					idPrefix="agent-demo-empty"
					onTextChange={handleTextChange}
					onListItemChange={updateListItem}
					onRemoveListItem={removeListItem}
					onAppendListItem={appendListItem}
				/>
			</AgentContent>
		</Agent>
	);
}

export function AgentDemoCompactFilled() {
	const {
		appendListItem,
		config,
		handleTextChange,
		removeListItem,
		updateListItem,
	} = useAgentDemoConfig(filledAgentConfig);

	return (
		<Agent className="mx-auto min-h-[852px] w-full max-w-[720px]">
			<AgentHeader
				leadingContent={<AgentCompactHeaderNav />}
				name={config.name?.trim() || "Untitled agent"}
			/>
			<AgentContent>
				<AgentConfigFields
					config={config}
					idPrefix="agent-demo-compact-filled"
					layout="compact"
					onTextChange={handleTextChange}
					onListItemChange={updateListItem}
					onRemoveListItem={removeListItem}
					onAppendListItem={appendListItem}
				/>
			</AgentContent>
		</Agent>
	);
}

export function AgentDemoCompactEmpty() {
	const {
		appendListItem,
		config,
		handleTextChange,
		removeListItem,
		updateListItem,
	} = useAgentDemoConfig(emptyAgentConfig);

	return (
		<Agent className="mx-auto min-h-[852px] w-full max-w-[720px]">
			<AgentHeader
				leadingContent={<AgentCompactHeaderNav />}
				name={config.name?.trim() || "Untitled agent"}
			/>
			<AgentContent>
				<AgentConfigFields
					config={config}
					idPrefix="agent-demo-compact-empty"
					layout="compact"
					onTextChange={handleTextChange}
					onListItemChange={updateListItem}
					onRemoveListItem={removeListItem}
					onAppendListItem={appendListItem}
				/>
			</AgentContent>
		</Agent>
	);
}

export function AgentDemoCompactSurfaces() {
	const [activeSection, setActiveSection] = useState<AgentCompactHeaderSection | null>("surfaces");

	function handleSectionChange(section: AgentCompactHeaderSection) {
		setActiveSection(section === "surfaces" ? "surfaces" : null);
	}

	return (
		<Agent className="mx-auto min-h-[852px] w-full max-w-[720px]">
			<AgentHeader
				leadingContent={
					<AgentCompactHeaderNav
						activeSection={activeSection}
						onSectionChange={handleSectionChange}
					/>
				}
				name="Policy Checker"
			/>
			<AgentContent>
				{activeSection === "surfaces" ? (
					<AgentCompactSurfacesPanel />
				) : (
					<AgentConfigFields
						config={filledAgentConfig}
						idPrefix="agent-demo-compact-surfaces"
						layout="compact"
					/>
				)}
			</AgentContent>
		</Agent>
	);
}

export default function AgentDemo() {
	return <AgentDemoCompactFilled />;
}

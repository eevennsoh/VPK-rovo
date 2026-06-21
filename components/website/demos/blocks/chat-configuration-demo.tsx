"use client";

import { useState } from "react";
import { token } from "@/lib/tokens";
import CustomizeMenu from "@/components/projects/shared/components/chat-configuration/customize-menu";

export default function ChatConfigurationDemo() {
	const [selectedReasoning, setSelectedReasoning] = useState("let-rovo-decide");
	const [webResultsEnabled, setWebResultsEnabled] = useState(true);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: token("color.background.neutral.subtle"),
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: token("space.300"),
			}}
		>
			<div
				style={{
					maxWidth: 460,
					width: "100%",
					backgroundColor: token("elevation.surface"),
					borderRadius: token("radius.large"),
					padding: token("space.100"),
					boxShadow: token("elevation.shadow.overlay"),
				}}
			>
				<CustomizeMenu
					selectedReasoning={selectedReasoning}
					onReasoningChange={setSelectedReasoning}
					webResultsEnabled={webResultsEnabled}
					onWebResultsChange={setWebResultsEnabled}
					companyKnowledgeEnabled={companyKnowledgeEnabled}
					onCompanyKnowledgeChange={setCompanyKnowledgeEnabled}
					onClose={() => {}}
				/>
			</div>
		</div>
	);
}

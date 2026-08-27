"use client";

import { useState } from "react";

import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout/components/agent-session-flyout";
import type { JiraSessionFlyoutContent } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { Button } from "@/components/ui/button";

export {
	AgentSessionFlyout,
	type AgentSessionFlyoutProps,
} from "@/components/blocks/agent-session-flyout/components/agent-session-flyout";
export { AGENT_SESSION_FLYOUT_SESSIONS } from "@/components/blocks/agent-session-flyout/agent-session-flyout-data";

const FLYOUT_CONTENT: readonly { label: string; value: JiraSessionFlyoutContent }[] = [
	{ label: "Details", value: "details" },
	{ label: "Composer", value: "composer" },
];

export default function AgentSessionFlyoutPage({
	content = "details",
}: Readonly<{ content?: JiraSessionFlyoutContent }>): React.ReactElement {
	const [flyoutContent, setFlyoutContent] = useState(content);

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
			<div className="flex items-center gap-2">
				{FLYOUT_CONTENT.map((item) => (
					<Button
						aria-pressed={flyoutContent === item.value}
						key={item.value}
						onClick={() => setFlyoutContent(item.value)}
						size="compact"
						type="button"
						variant={flyoutContent === item.value ? "default" : "outline"}
					>
						{item.label}
					</Button>
				))}
			</div>
			<AgentSessionFlyout content={flyoutContent} />
		</div>
	);
}

"use client";

import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout/components/agent-session-flyout";

export {
	AgentSessionFlyout,
	AGENT_SESSION_FLYOUT_SESSIONS,
	type AgentSessionFlyoutProps,
} from "@/components/blocks/agent-session-flyout/components/agent-session-flyout";

export default function AgentSessionFlyoutPage(): React.ReactElement {
	return (
		<div className="flex h-full w-full items-center justify-center p-6">
			<AgentSessionFlyout />
		</div>
	);
}

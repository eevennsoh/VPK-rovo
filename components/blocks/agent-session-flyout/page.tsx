"use client";

import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout/components/agent-session-flyout";

export {
	AgentSessionFlyout,
	type AgentSessionFlyoutProps,
} from "@/components/blocks/agent-session-flyout/components/agent-session-flyout";
export { AGENT_SESSION_FLYOUT_SESSIONS } from "@/components/blocks/agent-session-flyout/agent-session-flyout-data";

export default function AgentSessionFlyoutPage(): React.ReactElement {
	return (
		<div className="flex h-full w-full items-center justify-center p-6">
			<AgentSessionFlyout />
		</div>
	);
}

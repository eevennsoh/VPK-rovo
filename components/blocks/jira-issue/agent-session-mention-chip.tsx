import type { CSSProperties } from "react";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { Tag } from "@/components/ui/tag";
import { token } from "@/lib/tokens";

/**
 * Overlay elevation lives on the mention tag itself. A raised wrapper behind
 * this pill is what read as a sharp white rectangle under the chip.
 *
 * Editor tags paint `bg-bg-neutral`, which is alpha. The travelling chip has
 * to cover the drop well, so `elevated` swaps that fill for opaque `bg-surface`.
 */
const AGENT_SESSION_MENTION_CHIP_ELEVATION: CSSProperties = {
	backgroundColor: "var(--color-surface)",
	boxShadow: token("elevation.shadow.overlay"),
};

function getAgentInitial(name: string): string {
	return name.trim()[0]?.toUpperCase() ?? "A";
}

/**
 * The same agent at-mention tag the activity stream and session flyout use.
 * Dragged sessions must render this — not a custom white pill.
 */
export function AgentSessionMentionChip({
	avatarSrc,
	brandName,
	elevated = false,
	name,
	vpkLogo,
}: Readonly<{
	avatarSrc?: string;
	brandName?: ThirdPartyLogoName;
	elevated?: boolean;
	name: string;
	vpkLogo?: "rovo";
}>) {
	return (
		<Tag
			className={elevated ? "bg-surface" : undefined}
			color="gray"
			data-session-mention-chip=""
			elemBefore={
				<span aria-hidden>
					<AgentAvatarVisual
						avatarClassName="after:border-0"
						avatarSrc={avatarSrc}
						brandName={brandName}
						fallbackText={getAgentInitial(name)}
						label={name}
						sizePx={16}
						vpkLogo={vpkLogo}
					/>
				</span>
			}
			style={elevated ? AGENT_SESSION_MENTION_CHIP_ELEVATION : undefined}
			type="agent"
			variant="editor"
		>
			{name}
		</Tag>
	);
}

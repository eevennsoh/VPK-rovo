"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RovoColorIcon } from "@/components/ui/logo";
import { token } from "@/lib/tokens";
import NotificationIcon from "@atlaskit/icon/core/notification";
import QuestionCircleIcon from "@atlaskit/icon/core/question-circle";
import SettingsIcon from "@atlaskit/icon/core/settings";
import ThemeIcon from "@atlaskit/icon/core/theme";

interface RightNavigationActionsProps {
	showRovoAction: boolean;
	isChatOpen: boolean;
	onToggleChat: () => void;
	/** When provided, renders a theme-toggle button. Omitted in the Figma cluster. */
	onToggleTheme?: () => void;
}

// The shared cluster of right-side actions, rendered both inline (wide widths)
// and inside the "…" overflow popover (narrow widths). Returns a fragment so the
// caller owns the flex container in either context.
export function RightNavigationActions({
	showRovoAction,
	isChatOpen,
	onToggleChat,
	onToggleTheme,
}: Readonly<RightNavigationActionsProps>) {
	return (
		<>
			{/* Rovo chat button - suppressed on Rovo/Studio unless forceShowRovoAction overrides it */}
			{showRovoAction ? (
				<Button
					variant="outline"
					className="text-text-subtle"
					aria-pressed={isChatOpen}
					onClick={onToggleChat}
				>
					<RovoColorIcon size="xxsmall" data-icon="inline-start" />
					Ask Rovo
				</Button>
			) : null}

			{/* Notifications */}
			<Button aria-label="Notifications" size="icon" variant="ghost">
				<NotificationIcon label="" color={token("color.icon.subtle")} />
			</Button>

			{/* Help */}
			<Button aria-label="Help" size="icon" variant="ghost">
				<QuestionCircleIcon label="" color={token("color.icon.subtle")} />
			</Button>

			{/* Settings */}
			<Button aria-label="Settings" size="icon" variant="ghost">
				<SettingsIcon label="" color={token("color.icon.subtle")} />
			</Button>

			{/* Theme Toggle (opt-in; omitted in the Figma cluster) */}
			{onToggleTheme ? (
				<Button aria-label="Toggle theme" size="icon" variant="ghost" onClick={onToggleTheme}>
					<ThemeIcon label="" color={token("color.icon.subtle")} />
				</Button>
			) : null}

			{/* Profile */}
			<div className="flex size-8 items-center justify-center">
				<Avatar size="sm">
					<AvatarImage src="/avatar-user/venn/venn.png" alt="Venn avatar" />
					<AvatarFallback>VN</AvatarFallback>
				</Avatar>
			</div>
		</>
	);
}

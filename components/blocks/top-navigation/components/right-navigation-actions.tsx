"use client";

import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RovoColorIcon } from "@/components/ui/logo";
import { token } from "@/lib/tokens";
import NotificationIcon from "@atlaskit/icon/core/notification";
import QuestionCircleIcon from "@atlaskit/icon/core/question-circle";
import SettingsIcon from "@atlaskit/icon/core/settings";
import ThemeIcon from "@atlaskit/icon/core/theme";

export interface RightNavigationSettingsMenuItem {
	description?: string;
	disabled?: boolean;
	elemBefore?: ReactNode;
	id: string;
	label: string;
	onSelect: () => void;
	variant?: "default" | "destructive";
}

interface RightNavigationActionsProps {
	showRovoAction: boolean;
	isChatOpen: boolean;
	onToggleChat: () => void;
	/** When provided, renders a theme-toggle button. Omitted in the Figma cluster. */
	onToggleTheme?: () => void;
	settingsMenuItems?: ReadonlyArray<RightNavigationSettingsMenuItem>;
}

// The shared cluster of right-side actions, rendered both inline (wide widths)
// and inside the "…" overflow popover (narrow widths). Returns a fragment so the
// caller owns the flex container in either context.
export function RightNavigationActions({
	showRovoAction,
	isChatOpen,
	onToggleChat,
	onToggleTheme,
	settingsMenuItems,
}: Readonly<RightNavigationActionsProps>) {
	const hasSettingsMenu = Boolean(settingsMenuItems && settingsMenuItems.length > 0);

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
			{hasSettingsMenu ? (
				<DropdownMenu>
					<DropdownMenuTrigger
						render={(
							<Button
								aria-label="Settings"
								size="icon"
								type="button"
								variant="ghost"
							/>
						)}
					>
						<SettingsIcon label="" color={token("color.icon.subtle")} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-64">
						<DropdownMenuGroup>
							{settingsMenuItems?.map((item) => (
								<DropdownMenuItem
									description={item.description}
									disabled={item.disabled}
									elemBefore={item.elemBefore}
									key={item.id}
									onSelect={item.onSelect}
									variant={item.variant}
								>
									{item.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			) : (
				<Button aria-label="Settings" size="icon" variant="ghost">
					<SettingsIcon label="" color={token("color.icon.subtle")} />
				</Button>
			)}

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

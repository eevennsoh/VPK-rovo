"use client";

import type { ReactNode } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";
import DevicesIcon from "@atlaskit/icon/core/devices";
import RetryIcon from "@atlaskit/icon/core/retry";
import ThemeIcon from "@atlaskit/icon/core/theme";

import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/utils/theme-wrapper";
import Squircle from "@/components/website/demos/visual/shaders/squircle";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// 24×24 squircle button with a 12×12 icon.
const TOGGLE_SIZE = 24;
const GALLERY_CONTROL_BUTTON_CLASS_NAME =
	"inline-flex cursor-pointer border-0 bg-transparent p-0 text-icon-inverse outline-none transition-opacity duration-normal ease-out-practical hover:opacity-90 active:opacity-80 motion-reduce:transition-none rounded-[10px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const GALLERY_CONTROL_ICON_CLASS_NAME = "size-3 [&>span]:size-3! [&_svg]:size-3!";

type GalleryTheme = "light" | "dark" | "system";

export interface GalleryToggleProps {
	title: string;
	centerContent?: ReactNode;
	showBottomBorder: boolean;
	open: boolean;
	onToggle: () => void;
	className?: string;
	/**
	 * Resets the currently selected prototype to its initial state.
	 */
	onReset: () => void;
}

function getThemeLabel(theme: GalleryTheme): string {
	if (theme === "light") return "Light";
	if (theme === "dark") return "Dark";
	return "System";
}

function getNextTheme(theme: GalleryTheme): GalleryTheme {
	if (theme === "light") return "dark";
	if (theme === "dark") return "system";
	return "light";
}

function renderThemeIcon(theme: GalleryTheme) {
	return theme === "system" ? (
		<DevicesIcon label="" color="currentColor" size="small" />
	) : (
		<ThemeIcon label="" color="currentColor" size="small" />
	);
}

function GalleryControlSquircle({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<Squircle
			width={TOGGLE_SIZE}
			height={TOGGLE_SIZE}
			strokeWidth={0}
			fillColor={token("color.background.neutral.bold")}
		>
			{children}
		</Squircle>
	);
}

export function GalleryToggle({
	title,
	centerContent,
	showBottomBorder,
	open,
	onToggle,
	className,
	onReset,
}: Readonly<GalleryToggleProps>) {
	const { theme, setTheme } = useTheme();
	const themeLabel = getThemeLabel(theme);
	const galleryToggleLabel = open ? "Close gallery" : "Open gallery";

	return (
		<div
			className={cn(
				// Reserve an in-flow control row so prototype navigation starts below it.
				"grid h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 p-3",
				showBottomBorder ? "border-b border-border" : null,
				className,
			)}
		>
			<Heading size="xsmall" className="truncate justify-self-start">
				{title}
			</Heading>
			{centerContent ? (
				<div className="min-w-0 justify-self-center">{centerContent}</div>
			) : (
				<div aria-hidden />
			)}
			<TooltipProvider>
				<div className="flex shrink-0 items-center gap-1 justify-self-end">
					<Tooltip>
						<TooltipTrigger
							render={
								<button
									type="button"
									aria-label="Reset"
									onClick={onReset}
									className={GALLERY_CONTROL_BUTTON_CLASS_NAME}
								>
									<GalleryControlSquircle>
										<Icon
											className={GALLERY_CONTROL_ICON_CLASS_NAME}
											render={<RetryIcon label="" color="currentColor" size="small" />}
										/>
									</GalleryControlSquircle>
								</button>
							}
						/>
						<TooltipContent side="bottom">Reset</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger
							render={
								<button
									type="button"
									aria-label={`Cycle theme, current theme: ${themeLabel}`}
									onClick={() => setTheme(getNextTheme(theme))}
									className={GALLERY_CONTROL_BUTTON_CLASS_NAME}
								>
									<GalleryControlSquircle>
										<Icon className={GALLERY_CONTROL_ICON_CLASS_NAME} render={renderThemeIcon(theme)} />
									</GalleryControlSquircle>
								</button>
							}
						/>
						<TooltipContent side="bottom">{themeLabel}</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger
							render={
								<button
									type="button"
									aria-expanded={open}
									aria-label={galleryToggleLabel}
									onClick={onToggle}
									className={GALLERY_CONTROL_BUTTON_CLASS_NAME}
								>
									<GalleryControlSquircle>
										<Icon
											className={GALLERY_CONTROL_ICON_CLASS_NAME}
											render={
												open ? (
													<ChevronDownIcon label="" color="currentColor" size="small" />
												) : (
													<ChevronUpIcon label="" color="currentColor" size="small" />
												)
											}
										/>
									</GalleryControlSquircle>
								</button>
							}
						/>
						<TooltipContent side="bottom">{galleryToggleLabel}</TooltipContent>
					</Tooltip>
				</div>
			</TooltipProvider>
		</div>
	);
}

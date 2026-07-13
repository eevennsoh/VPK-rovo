"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";

import { Icon } from "@/components/ui/icon";
import Squircle from "@/components/website/demos/visual/shaders/squircle";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// 32×32 squircle icon button.
const TOGGLE_SIZE = 32;

export interface GalleryToggleProps {
	open: boolean;
	onToggle: () => void;
	className?: string;
}

export function GalleryToggle({
	open,
	onToggle,
	className,
}: Readonly<GalleryToggleProps>) {
	return (
		<button
			type="button"
			aria-expanded={open}
			// Icon-only control → needs an explicit accessible name (it also states the
			// action + current state).
			aria-label={open ? "Close gallery" : "Open gallery"}
			onClick={() => onToggle()}
			className={cn(
				// Anchored top-right, independent of the bottom-pinned strip. Inverse icon
				// color so the chevron reads on the dark/bold squircle; native-button
				// chrome is reset so the squircle is the only visible surface.
				"fixed top-4 right-4 z-40 inline-flex cursor-pointer border-0 bg-transparent p-0 text-icon-inverse outline-none",
				// Subtle, theme-agnostic hover/press feedback: opacity reads correctly
				// whether the squircle is dark-on-light or light-on-dark.
				"transition-opacity duration-normal ease-out-practical hover:opacity-90 active:opacity-80 motion-reduce:transition-none",
				// Focus ring hugs the squircle silhouette closely enough at this size.
				"rounded-[10px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				className,
			)}
		>
			{/* Dark "inverse" squircle matching the Rovo floating button: the
			    color.background.neutral.bold token is DARK in light mode and LIGHT in
			    dark mode, carrying the same subtle overlay drop shadow. The chevron
			    points UP to reveal the strip (closed) and DOWN to dismiss it (open). */}
			<Squircle
				width={TOGGLE_SIZE}
				height={TOGGLE_SIZE}
				strokeWidth={0}
				fillColor={token("color.background.neutral.bold")}
				style={{ boxShadow: token("elevation.shadow.overlay") }}
			>
				<Icon
					render={
						open ? (
							<ChevronDownIcon label="" color="currentColor" size="small" />
						) : (
							<ChevronUpIcon label="" color="currentColor" size="small" />
						)
					}
				/>
			</Squircle>
		</button>
	);
}

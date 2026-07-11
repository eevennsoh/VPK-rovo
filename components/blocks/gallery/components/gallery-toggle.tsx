"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

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
		<Button
			size="icon"
			shape="circle"
			variant="outline"
			aria-expanded={open}
			aria-label={open ? "Hide gallery" : "Show gallery"}
			onClick={() => onToggle()}
			// Slide the pill with the strip instead of teleporting between
			// bottom-4 / bottom-64 (duration-slow + ease-in-out tokens; guarded
			// for reduced motion per the repo mandate).
			className={cn(
				"fixed right-4 bottom-4 z-40 transition-[bottom] duration-slow ease-in-out motion-reduce:transition-none",
				className,
			)}
		>
			<Icon
				render={
					open ? (
						<ChevronUpIcon label="" color="currentColor" />
					) : (
						<ChevronDownIcon label="" color="currentColor" />
					)
				}
			/>
		</Button>
	);
}

import type { ComponentProps } from "react";

import { ROVO_COLOR_SWATCHES } from "@/lib/rovo-colors";
import { cn } from "@/lib/utils";

export type TeamworkGraphMarkProps = ComponentProps<"svg"> & {
	label?: string;
};

const [blue, orange, purple, lime] = ROVO_COLOR_SWATCHES;

export function TeamworkGraphMark({
	className,
	label,
	...props
}: Readonly<TeamworkGraphMarkProps>) {
	const isDecorative = label == null;

	return (
		<svg
			aria-hidden={isDecorative ? true : undefined}
			aria-label={isDecorative ? undefined : label}
			className={cn("size-4 text-icon", className)}
			fill="none"
			focusable="false"
			role={isDecorative ? undefined : "img"}
			viewBox="0 0 16 16"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path d="M11 11L5 5" stroke="currentColor" strokeWidth={1.5} />
			<circle cx="3.5" cy="3.5" r="1.75" stroke={blue.hex} strokeWidth={1.5} />
			<circle cx="3.5" cy="12.5" r="1.75" stroke={purple.hex} strokeWidth={1.5} />
			<circle cx="12.5" cy="12.5" r="1.75" stroke={orange.hex} strokeWidth={1.5} />
			<circle cx="12.5" cy="3.5" r="1.75" stroke={lime.hex} strokeWidth={1.5} />
		</svg>
	);
}

TeamworkGraphMark.displayName = "TeamworkGraphMark";

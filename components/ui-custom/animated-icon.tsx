"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { ANIMATED_ICONS, type AnimatedIconName } from "./animated-icon-registry";

export {
	ANIMATED_ICONS,
	animatedIconNames,
	type AnimatedIconName,
} from "./animated-icon-registry";

// How long a token-driven "replay" stays in the playing state before settling.
const REPLAY_MS = 1000;

export interface AnimatedIconProps
	extends Omit<React.ComponentProps<"span">, "color"> {
	/** Which animated icon to render. */
	name: AnimatedIconName;
	/** Icon size in pixels. */
	size?: number;
	/** Icon color. Defaults to `currentColor` so it inherits the text color. */
	color?: string;
	/** When false, the icon plays its multi-color Rovo gradient accents instead
	 * of a single solid color. Defaults to true (single color). */
	singleColor?: boolean;
	/** Replay the motion while the pointer is over the icon. Defaults to true. */
	replayOnHover?: boolean;
	/** Replay the motion while the icon is keyboard-focused. Defaults to true. */
	replayOnFocus?: boolean;
	/** Change this value to replay the motion imperatively (e.g. a "Replay all"
	 * button bumping a shared token across many icons). */
	playToken?: number;
	/** Accessible label. Omit (or leave empty) to render the icon decoratively. */
	label?: string;
}

export function AnimatedIcon({
	name,
	size = 16,
	color,
	singleColor = true,
	replayOnHover = true,
	replayOnFocus = true,
	playToken,
	label,
	className,
	onMouseEnter,
	onMouseLeave,
	onFocus,
	onBlur,
	...props
}: Readonly<AnimatedIconProps>) {
	const [playing, setPlaying] = useState(false);
	const prevToken = useRef(playToken);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (prevToken.current === playToken) return;
		prevToken.current = playToken;
		setPlaying(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setPlaying(false), REPLAY_MS);
	}, [playToken]);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	const Icon = ANIMATED_ICONS[name];
	const isDecorative = !label;

	return (
		<span
			data-slot="animated-icon"
			role={isDecorative ? undefined : "img"}
			aria-label={isDecorative ? undefined : label}
			aria-hidden={isDecorative ? true : undefined}
			className={cn("inline-flex items-center justify-center", className)}
			onMouseEnter={(event) => {
				onMouseEnter?.(event);
				if (replayOnHover) setPlaying(true);
			}}
			onMouseLeave={(event) => {
				onMouseLeave?.(event);
				if (replayOnHover) setPlaying(false);
			}}
			onFocus={(event) => {
				onFocus?.(event);
				if (replayOnFocus) setPlaying(true);
			}}
			onBlur={(event) => {
				onBlur?.(event);
				if (replayOnFocus) setPlaying(false);
			}}
			{...props}
		>
			<Icon
				size={size}
				color={color ?? "currentColor"}
				hovered={playing}
				singleColor={singleColor}
			/>
		</span>
	);
}

AnimatedIcon.displayName = "AnimatedIcon";

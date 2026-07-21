"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion, type Transition } from "motion/react";

import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { Tile } from "@/components/ui/tile";
import { cn } from "@/lib/utils";

export type TwgToolSourceIconSize = "sm" | "md";
export type TwgToolThirdPartyProvider = "google-drive" | "salesforce";
export type TwgToolSourceProvider =
	| "twg"
	| TwgToolThirdPartyProvider
	| AtlassianLogoName;

export interface TwgToolSource {
	id: string;
	label: string;
	provider: TwgToolSourceProvider;
	icon?: ReactNode;
	/**
	 * Third-party brand id — renders the upstream `@atlassian/logo-third-party`
	 * mark. Preferred over `provider` for arbitrary 3P brands.
	 */
	name?: ThirdPartyLogoName;
	/**
	 * Non-brand image source (e.g. an `/avatar-agent/…` SVG). Do NOT use this for
	 * 3P brand logos — use `name` instead so `public/3p` paths stay out of data.
	 */
	iconSrc?: string;
}

export type TwgToolSourceIconProps = Omit<ComponentProps<typeof Tile>, "children" | "label" | "size"> & {
	source: TwgToolSource;
	size?: TwgToolSourceIconSize;
};

export type TwgAppstackAnimationDirection = "left-to-right" | "right-to-left";

export type TWGAppstackProps = ComponentProps<"div"> & {
	sources: ReadonlyArray<TwgToolSource>;
	iconSize?: TwgToolSourceIconSize;
	maxVisible?: number;
	animated?: boolean;
	direction?: TwgAppstackAnimationDirection;
};

export type TwgToolSourceStackProps = TWGAppstackProps;

const APPSTACK_STAGGER_SECONDS = 0.18;
const APPSTACK_ENTER_OFFSET = 10;
const APPSTACK_ENTER_ROTATION_OFFSET = 18;
const APPSTACK_TILE_FILL_CLASS = "bg-surface";
const APPSTACK_ROTATIONS = [
	0,
	6,
	0,
	-8,
] as const;

function getAppstackRotation(index: number) {
	return APPSTACK_ROTATIONS[index % APPSTACK_ROTATIONS.length];
}

function getAppstackDelay(index: number, itemCount: number, direction: TwgAppstackAnimationDirection) {
	const order = direction === "left-to-right" ? index : itemCount - index - 1;
	return order * APPSTACK_STAGGER_SECONDS;
}

function getAppstackInitialRotation(rotation: number) {
	return rotation + (rotation < 0 ? APPSTACK_ENTER_ROTATION_OFFSET : -APPSTACK_ENTER_ROTATION_OFFSET);
}

function getAppstackTransition(delay: number): Transition {
	return {
		filter: { duration: 0.36, ease: [0, 0.4, 0, 1], delay },
		layout: { duration: 0.25, ease: [0.4, 0, 0, 1] },
		opacity: { duration: 0.32, ease: [0, 0.4, 0, 1], delay },
		rotate: { type: "spring", stiffness: 260, damping: 30, mass: 0.85, delay: delay + 0.08 },
		scale: { type: "spring", stiffness: 260, damping: 28, mass: 0.85, delay },
		x: { type: "spring", stiffness: 260, damping: 28, mass: 0.85, delay },
	};
}

function isThirdPartyProvider(
	provider: TwgToolSourceProvider
): provider is TwgToolThirdPartyProvider {
	return provider === "google-drive" || provider === "salesforce";
}

function getSourceTileSize(size: TwgToolSourceIconSize): "small" | "xxsmall" {
	return size === "md" ? "small" : "xxsmall";
}

function getSourceImageSize(size: TwgToolSourceIconSize) {
	return size === "md" ? 24 : 16;
}

function getAppstackItemClassName(size: TwgToolSourceIconSize) {
	return size === "md" ? "size-6" : "size-4";
}

export function TwgToolSourceIcon({
	className,
	source,
	size = "md",
	...props
}: TwgToolSourceIconProps) {
	const tileSize = getSourceTileSize(size);

	if (source.icon) {
		return (
			<Tile
				className={cn("shrink-0", APPSTACK_TILE_FILL_CLASS, className)}
				isInset={false}
				label={source.label}
				size={tileSize}
				variant="transparent"
				{...props}
			>
				{source.icon}
			</Tile>
		);
	}

	if (source.name) {
		// 3P brand → upstream package mark (its own white tile replaces the appstack
		// tile at the same size). No `public/3p` asset path.
		return (
			<LogoThirdParty
				className={cn("shrink-0", className)}
				label={source.label}
				name={source.name}
				size={tileSize}
			/>
		);
	}

	if (source.iconSrc) {
		// Non-brand image (e.g. an `/avatar-agent/…` SVG). 3P brands use `name`.
		return (
			<Tile
				className={cn("shrink-0", APPSTACK_TILE_FILL_CLASS, className)}
				isInset={false}
				label={source.label}
				size={tileSize}
				variant="transparent"
				{...props}
			>
				<Image
					alt=""
					aria-hidden
					height={getSourceImageSize(size)}
					src={source.iconSrc}
					width={getSourceImageSize(size)}
				/>
			</Tile>
		);
	}

	if (source.provider === "twg") {
		return (
			<Tile
				className={cn("shrink-0", APPSTACK_TILE_FILL_CLASS, className)}
				isInset={false}
				label={source.label}
				size={tileSize}
				variant="transparent"
				{...props}
			>
				<span className="inline-flex size-full items-center justify-center">
					<AtlassianLogo
						name="jira-service-management"
						hasBorder
						label={source.label}
						size={size === "md" ? "small" : "xxsmall"}
						themeAware={false}
					/>
				</span>
			</Tile>
		);
	}

	if (isThirdPartyProvider(source.provider)) {
		// Provider is itself a 3P brand id (`google-drive` / `salesforce`).
		return (
			<LogoThirdParty
				className={cn("shrink-0", className)}
				label={source.label}
				name={source.provider}
				size={tileSize}
			/>
		);
	}

	return (
		<Tile
			className={cn("shrink-0 text-icon-subtle", APPSTACK_TILE_FILL_CLASS, className)}
			isInset={false}
			label={source.label}
			size={tileSize}
			variant="transparent"
			{...props}
		>
			<span className="inline-flex size-full items-center justify-center">
				<AtlassianLogo
					name={source.provider}
					hasBorder
					label={source.label}
					size={size === "md" ? "small" : "xxsmall"}
					themeAware={false}
				/>
			</span>
		</Tile>
	);
}

export function TWGAppstack({
	animated = true,
	className,
	direction = "right-to-left",
	iconSize = "md",
	maxVisible = 6,
	sources,
	...props
}: TWGAppstackProps) {
	const shouldReduceMotion = useReducedMotion();
	const shouldAnimate = animated && !shouldReduceMotion;
	const hasRenderedSources = useRef(false);
	const shouldStaggerEntrance = !hasRenderedSources.current;

	useEffect(() => {
		if (sources.length > 0) hasRenderedSources.current = true;
	}, [sources.length]);

	if (sources.length === 0) {
		return null;
	}

	const visibleSources = sources.slice(0, maxVisible);
	const hiddenCount = Math.max(0, sources.length - visibleSources.length);
	const itemCount = visibleSources.length + (hiddenCount > 0 ? 1 : 0);

	const renderItem = (key: string, index: number, children: ReactNode, rotation = getAppstackRotation(index)) => {
		const itemClassName = cn(
			"relative flex shrink-0 items-center justify-center",
			getAppstackItemClassName(iconSize),
			index > 0 && "-ml-1"
		);

		if (!shouldAnimate) {
			return (
				<div key={key} className={itemClassName} style={{ transform: `rotate(${rotation}deg)` }}>
					{children}
				</div>
			);
		}

		const delay = shouldStaggerEntrance
			? getAppstackDelay(index, itemCount, direction)
			: 0;

		return (
			<motion.div
				key={key}
				animate={{ filter: "blur(0px)", opacity: 1, rotate: rotation, scale: 1, x: 0 }}
				className={itemClassName}
				layout={shouldReduceMotion ? false : "position"}
				initial={{
					filter: "blur(6px)",
					opacity: 0,
					rotate: getAppstackInitialRotation(rotation),
					scale: 0.96,
					x: APPSTACK_ENTER_OFFSET,
				}}
				style={{ willChange: "filter, transform, opacity" }}
				transition={getAppstackTransition(delay)}
			>
				{children}
			</motion.div>
		);
	};

	return (
		<div className={cn("flex shrink-0 items-center justify-end overflow-visible", className)} {...props}>
			{visibleSources.map((source, index) => (
				renderItem(
					source.id,
					index,
					<TwgToolSourceIcon
						source={source}
						size={iconSize}
						className="relative"
					/>
				)
			))}
			{hiddenCount > 0 ? (
				renderItem(
					"hidden-source-count",
					visibleSources.length,
					<Tile
						className="shrink-0 bg-surface text-text-subtlest"
						hasBorder
						isInset={false}
						label={`${hiddenCount} more sources`}
						size={getSourceTileSize(iconSize)}
						variant="transparent"
					>
						<span className="text-xs font-medium leading-none">+{hiddenCount}</span>
					</Tile>,
					0
				)
			) : null}
		</div>
	);
}

export function TwgToolSourceStack(props: TWGAppstackProps) {
	return <TWGAppstack {...props} />;
}

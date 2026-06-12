"use client";

// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates coupled component parts as a compound component or demo surface API.

// oxlint-disable react-doctor/prefer-tag-over-role -- This file uses ARIA roles for custom generated visuals or composite widgets where the suggested native tag would change semantics or behavior.

import * as React from "react";
import Image from "next/image";
import { type LogoProps as AtlaskitLogoProps } from "@atlaskit/logo";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/utils/theme-wrapper";
import { useIsMounted } from "@/components/hooks/use-is-mounted";
import {
	type AtlassianLogoName,
	LOGO_ICON_COMPONENTS,
	LOGO_LOCKUP_COMPONENTS,
	CUSTOM_LOGO_SIZES,
} from "@/components/ui/data/logo-data";
import {
	resolveAtlassianLogoBorder,
	resolveBrandLogoPresentation,
} from "@/components/ui/data/logo-usage";
import { ROVO_LOGO_PATHS, ROVO_LOGO_VIEWBOX } from "@/components/ui/data/rovo-logo";
import { Tile, type TileProps } from "@/components/ui/tile";

export { ROVO_LOGO_DATA_URI } from "@/components/ui/data/rovo-logo";
export type { AtlassianLogoName };
export type LogoVariant = "icon" | "lockup";
export const ATLASSIAN_LOGO_SOURCE = "atlassian";

export function isAtlassianLogoSource(src: string | null | undefined): boolean {
	return src === ATLASSIAN_LOGO_SOURCE;
}

export interface LogoProps extends AtlaskitLogoProps {
	color?: string;
	themeAware?: boolean;
	variant?: LogoVariant;
	shouldUseHexLogo?: boolean;
	/**
	 * Draws a 1px hairline directly on the logo mark's edge (inset ring, no
	 * added size) so adjacent same-color marks stay visually separated — e.g.
	 * blue Jira over blue Confluence in an overlapping stack. Defaults to off.
	 */
	hasBorder?: boolean;
	/**
	 * Opt in to the centralized usage metadata's border treatment
	 * (logo-usage.json): the Atlassian master logo gets a bordered tile while
	 * solid-background product logos stay bare. Use this for standalone brand
	 * tiles; leave it off when the logo is already wrapped in an avatar/cover.
	 * An explicit `hasBorder` always wins. Defaults to off.
	 */
	withUsageBorder?: boolean;
}

export interface AtlassianLogoProps extends LogoProps {
	name: AtlassianLogoName;
}

function getThemeAwareAppearance(
	appearance: AtlaskitLogoProps["appearance"],
	themeAware: boolean,
	actualTheme: "light" | "dark"
): AtlaskitLogoProps["appearance"] {
	if (appearance) {
		return appearance;
	}

	if (!themeAware) {
		return undefined;
	}

	return actualTheme === "dark" ? "inverse" : "brand";
}

function getLogoSizePx(size: AtlaskitLogoProps["size"]): number {
	if (typeof size === "string") {
		const numericSize = Number(size);
		if (!Number.isNaN(numericSize)) {
			return numericSize;
		}

		return CUSTOM_LOGO_SIZES[size] ?? CUSTOM_LOGO_SIZES.small;
	}

	return CUSTOM_LOGO_SIZES.small;
}

export function AtlassianLogo({
	name,
	themeAware = true,
	appearance,
	size = "small",
	variant = "icon",
	shouldUseNewLogoDesign = true,
	hasBorder,
	withUsageBorder = false,
	color,
	...props
}: Readonly<AtlassianLogoProps>) {
	const isMounted = useIsMounted();
	const { actualTheme } = useTheme();
	const components = variant === "lockup" ? LOGO_LOCKUP_COMPONENTS : LOGO_ICON_COMPONENTS;
	const Component = components[name];
	const resolvedAppearance = getThemeAwareAppearance(appearance, themeAware, actualTheme);
	void color;

	// Border treatment is documented in the centralized usage metadata
	// (logo-usage.json, via `resolveAtlassianLogoBorder`): solid-background
	// product marks render bare, the Atlassian master logo wants a bordered tile.
	// We only apply it when the caller opts in via `withUsageBorder` (or sets
	// `hasBorder` explicitly) — many call sites already wrap the logo in their own
	// avatar/hexagon/cover, where an unconditional square tile would be wrong.
	// Lockups (icon + wordmark) are never tiled.
	const resolvedHasBorder =
		hasBorder ?? (withUsageBorder && variant !== "lockup" ? resolveAtlassianLogoBorder(name) : false);

	const needsDarkFix = !appearance && actualTheme === "dark" && resolvedAppearance === "inverse";
	const placeholderSize = getLogoSizePx(size);
	// Hairline drawn as an outline with a negative offset: it sits 1px inside the
	// mark's edge and — unlike an inset ring/box-shadow, which renders *behind*
	// content — outlines paint on top of the filled logo svg, so it stays visible.
	const borderClassName = resolvedHasBorder && "rounded-tile [outline:1px_solid_var(--color-border)] [outline-offset:-1px]";

	if (!isMounted) {
		return (
			<span className={cn("inline-flex shrink-0 items-center", borderClassName, needsDarkFix && "ads-logo-inverse")}>
				<span
					aria-hidden
					className="inline-block shrink-0"
					style={{ width: placeholderSize, height: placeholderSize }}
				/>
			</span>
		);
	}

	return (
		<span className={cn("inline-flex shrink-0 items-center", borderClassName, needsDarkFix && "ads-logo-inverse")}>
			<Component
				{...props}
				size={size}
				appearance={resolvedAppearance}
				shouldUseNewLogoDesign={shouldUseNewLogoDesign}
			/>
		</span>
	);
}

/* -- Custom Logo ------------------------------------------------- */

export interface CustomLogoProps {
	/**
	 * Custom SVG or image element to render as the logo icon. Provide either
	 * `svg` (an inline element you control) or `src` (a 2P/3P brand asset path
	 * that gets auto-resolved against `logo-usage.json`).
	 */
	svg?: React.ReactElement<{ width?: number; height?: number; "aria-hidden"?: boolean }>;
	/**
	 * Brand asset path (e.g. `/2p/appfire.png` or `/3p/airtable/24.svg`). When
	 * set, border treatment and the borderless variant swap are applied
	 * automatically from the centralized usage metadata.
	 */
	src?: string;
	/** Optional wordmark text displayed beside the icon */
	wordmark?: string;
	/** Logo size */
	size?: LogoProps["size"];
	/** Accessible label */
	label?: string;
	/** Additional CSS classes */
	className?: string;
}

function isTileLogoSize(size: LogoProps["size"]): size is NonNullable<TileProps["size"]> {
	return typeof size === "string" && size in CUSTOM_LOGO_SIZES;
}

export function CustomLogo({
	svg,
	src,
	wordmark,
	size = "small",
	label,
	className,
}: Readonly<CustomLogoProps>) {
	const px = getLogoSizePx(size ?? "small");

	// `src` brand assets resolve their variant + border treatment from the
	// centralized usage metadata (logo-usage.json): bare 2P PNGs and white-tile
	// 3P marks get a bordered tile (swapping to the borderless glyph so borders
	// don't double up); solid-fill 3P marks render bare.
	const brand = src ? resolveBrandLogoPresentation(src) : null;
	const shouldRenderBorderedTile = Boolean(brand?.hasBorder && isTileLogoSize(size));
	const borderClassName =
		brand?.hasBorder && !shouldRenderBorderedTile &&
		"rounded-tile [outline:1px_solid_var(--color-border)] [outline-offset:-1px]";

	const icon = brand?.hasBorder && isTileLogoSize(size) ? (
		<Tile
			aria-hidden
			className="bg-surface"
			hasBorder
			label={label ?? ""}
			size={size}
			variant="transparent"
		>
			<Image src={brand.src} alt="" aria-hidden width={px} height={px} className="object-contain" />
		</Tile>
	) : brand ? (
		<Image
			src={brand.src}
			alt=""
			aria-hidden
			width={px}
			height={px}
			className="object-contain"
			style={{ width: px, height: px }}
		/>
	) : svg ? (
		React.cloneElement(svg, { width: px, height: px, "aria-hidden": true })
	) : null;

	return (
		<span
			role="img"
			aria-label={label}
			className={cn("inline-flex items-center gap-1", className)}
		>
			<span
				className={cn(
					"inline-flex shrink-0 items-center justify-center",
					borderClassName,
				)}
				style={{ width: px, height: px }}
			>
				{icon}
			</span>
			{wordmark ? (
				<span
					className="font-semibold leading-none text-text"
					style={{ fontSize: Math.max(12, px * 0.6) }}
				>
					{wordmark}
				</span>
			) : null}
		</span>
	);
}

/* -- Rovo color mark --------------------------------------------- */

export interface RovoColorIconProps extends Omit<React.ComponentProps<"svg">, "size"> {
	/** Logo size — same scale as the other logo components. */
	size?: LogoProps["size"];
	/**
	 * Accessible label. When provided the svg is exposed as an image with this
	 * name; when omitted it is hidden from assistive tech (decorative).
	 */
	label?: string;
}

/**
 * The special multi-color Rovo brand mark (yellow / blue / purple / green),
 * inlined from `data/rovo-logo.ts`. Unlike `RovoIcon`/`RovoLogo` (the ADS
 * single-tone marks from `@atlaskit/logo`), this renders the full-color brand
 * artwork that used to live at `public/1p/rovo.svg`.
 */
export function RovoColorIcon({
	size = "small",
	label,
	className,
	...props
}: Readonly<RovoColorIconProps>) {
	const px = getLogoSizePx(size);

	return (
		<svg
			width={px}
			height={px}
			viewBox={ROVO_LOGO_VIEWBOX}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role={label ? "img" : undefined}
			aria-label={label}
			aria-hidden={label ? undefined : true}
			className={cn("inline-block shrink-0", className)}
			{...props}
		>
			{ROVO_LOGO_PATHS.map((path) => (
				<path
					key={path.fill + path.d}
					d={path.d}
					fill={path.fill}
					fillRule={path.evenOdd ? "evenodd" : undefined}
					clipRule={path.evenOdd ? "evenodd" : undefined}
				/>
			))}
		</svg>
	);
}

export const RovoColorLogo = RovoColorIcon;

/* -- Named product exports --------------------------------------- */

function createLogo(name: AtlassianLogoName) {
	return function LogoComponent(props: Readonly<LogoProps>) {
		return <AtlassianLogo name={name} {...props} />;
	};
}

export const AdminIcon = createLogo("admin");
export const AlignIcon = createLogo("align");
export const AnalyticsIcon = createLogo("analytics");
export const AssetsIcon = createLogo("assets");
export const AtlassianBrandIcon = createLogo("atlassian");
export const AtlassianAdministrationIcon = createLogo("atlassian-administration");
export const AtlassianAnalyticsIcon = createLogo("atlassian-analytics");
export const BambooIcon = createLogo("bamboo");
export const BitbucketIcon = createLogo("bitbucket");
export const BitbucketDataCenterIcon = createLogo("bitbucket-data-center");
export const ChatIcon = createLogo("chat");
export const CompassIcon = createLogo("compass");
export const ConfluenceIcon = createLogo("confluence");
export const ConfluenceDataCenterIcon = createLogo("confluence-data-center");
export const CrowdIcon = createLogo("crowd");
export const CustomerServiceManagementIcon = createLogo("customer-service-management");
export const DxIcon = createLogo("dx");
export const FeedbackIcon = createLogo("feedback");
export const FocusIcon = createLogo("focus");
export const GoalsIcon = createLogo("goals");
export const GuardIcon = createLogo("guard");
export const HomeIcon = createLogo("home");
export const HubIcon = createLogo("hub");
export const JiraIcon = createLogo("jira");
export const JiraAlignIcon = createLogo("jira-align");
export const JiraDataCenterIcon = createLogo("jira-data-center");
export const JiraProductDiscoveryIcon = createLogo("jira-product-discovery");
export const JiraServiceManagementIcon = createLogo("jira-service-management");
export const JiraServiceManagementDataCenterIcon = createLogo("jira-service-management-data-center");
export const LoomIcon = createLogo("loom");
export const LoomAttributionIcon = createLogo("loom-attribution");
export const OpsgenieIcon = createLogo("opsgenie");
export const ProjectsIcon = createLogo("projects");
export const RovoIcon = createLogo("rovo");
export const RovoDevIcon = createLogo("rovo-dev");
export const RovoDevAgentIcon = createLogo("rovo-dev-agent");
export const SearchIcon = createLogo("search");
export const StatuspageIcon = createLogo("statuspage");
export const StudioIcon = createLogo("studio");
export const TalentIcon = createLogo("talent");
export const TeamsIcon = createLogo("teams");
export const TrelloIcon = createLogo("trello");

export const AdminLogo = AdminIcon;
export const AlignLogo = AlignIcon;
export const AnalyticsLogo = AnalyticsIcon;
export const AssetsLogo = AssetsIcon;
export const AtlassianBrandLogo = AtlassianBrandIcon;
export const AtlassianAdministrationLogo = AtlassianAdministrationIcon;
export const AtlassianAnalyticsLogo = AtlassianAnalyticsIcon;
export const BambooLogo = BambooIcon;
export const BitbucketLogo = BitbucketIcon;
export const BitbucketDataCenterLogo = BitbucketDataCenterIcon;
export const ChatLogo = ChatIcon;
export const CompassLogo = CompassIcon;
export const ConfluenceLogo = ConfluenceIcon;
export const ConfluenceDataCenterLogo = ConfluenceDataCenterIcon;
export const CrowdLogo = CrowdIcon;
export const CustomerServiceManagementLogo = CustomerServiceManagementIcon;
export const FeedbackLogo = FeedbackIcon;
export const FocusLogo = FocusIcon;
export const GoalsLogo = GoalsIcon;
export const GuardLogo = GuardIcon;
export const HomeLogo = HomeIcon;
export const HubLogo = HubIcon;
export const JiraLogo = JiraIcon;
export const JiraAlignLogo = JiraAlignIcon;
export const JiraDataCenterLogo = JiraDataCenterIcon;
export const JiraProductDiscoveryLogo = JiraProductDiscoveryIcon;
export const JiraServiceManagementLogo = JiraServiceManagementIcon;
export const JiraServiceManagementDataCenterLogo = JiraServiceManagementDataCenterIcon;
export const LoomLogo = LoomIcon;
export const LoomAttributionLogo = LoomAttributionIcon;
export const OpsgenieLogo = OpsgenieIcon;
export const ProjectsLogo = ProjectsIcon;
export const RovoLogo = RovoIcon;
export const RovoDevLogo = RovoDevIcon;
export const RovoDevAgentLogo = RovoDevAgentIcon;
export const SearchLogo = SearchIcon;
export const StatuspageLogo = StatuspageIcon;
export const StudioLogo = StudioIcon;
export const TalentLogo = TalentIcon;
export const TeamsLogo = TeamsIcon;
export const TrelloLogo = TrelloIcon;

"use client";

import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import StatusWarningIcon from "@atlaskit/icon/core/status-warning";

/**
 * Bold backdrop for the inverse appearances. `primaryInverted` and `inverse`
 * are designed to sit on a bold/colored surface, so their demos provide one —
 * otherwise their light/translucent fills are invisible on the page surface.
 */
function OnBold({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<span className="inline-flex rounded-xs bg-bg-neutral-bold p-1">
			{children}
		</span>
	);
}

/** Every badge appearance in one wrapping row (used by both hero theme rows). */
function BadgeRow() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge>8</Badge>
			<Badge variant="neutral">8</Badge>
			<Badge variant="primary">5</Badge>
			<OnBold>
				<Badge variant="primaryInverted">5</Badge>
			</OnBold>
			<OnBold>
				<Badge variant="inverse">8</Badge>
			</OnBold>
			<Badge variant="important">150</Badge>
			<Badge variant="added">+12</Badge>
			<Badge variant="removed">-8</Badge>
			<Badge variant="destructive">-50</Badge>
			<Badge variant="success">+100</Badge>
			<Badge variant="warning">5</Badge>
			<Badge variant="info">12</Badge>
			<Badge variant="discovery">3</Badge>
		</div>
	);
}

// --- Overview (default export used by UI_DEMO) ---

/**
 * Hero preview — light row on top, dark row below. The dark row uses ADS
 * subtree theming (data-subtree-theme + data-color-mode="dark") so every
 * semantic token flips to its dark value; no hardcoded colors or `dark:`.
 */
export default function BadgeDemo() {
	return (
		<div className="flex w-full flex-col gap-3">
			<div className="rounded-lg p-4">
				<BadgeRow />
			</div>
			<div
				className="rounded-lg bg-surface p-4"
				data-subtree-theme=""
				data-color-mode="dark"
				data-theme="dark:dark spacing:spacing typography:typography shape:shape"
			>
				<BadgeRow />
			</div>
		</div>
	);
}

// --- ADS appearance demos (mirror atlassian.design/components/badge/examples) ---

/** Default — ADS "default" appearance (neutral grey pill for numeric counts) */
export function BadgeDemoDefault() {
	return <Badge>8</Badge>;
}

/** Neutral — ADS "neutral" appearance (subtle grey) */
export function BadgeDemoNeutral() {
	return <Badge variant="neutral">8</Badge>;
}

/** Primary — ADS "primary" appearance (brand-bold blue, inverse text) */
export function BadgeDemoPrimary() {
	return <Badge variant="primary">5</Badge>;
}

/** Primary inverted — ADS "primaryInverted" appearance (white + brand text, on a bold surface) */
export function BadgeDemoPrimaryInverted() {
	return (
		<OnBold>
			<Badge variant="primaryInverted">5</Badge>
		</OnBold>
	);
}

/** Inverse — ADS "inverse" appearance (translucent dark fill + inverse text, on a bold surface) */
export function BadgeDemoInverse() {
	return (
		<OnBold>
			<Badge variant="inverse">8</Badge>
		</OnBold>
	);
}

/** Important — ADS "important" appearance (bold dark badge for high-urgency counts) */
export function BadgeDemoImportant() {
	return <Badge variant="important">150</Badge>;
}

/** Added — ADS "added" appearance (green count) */
export function BadgeDemoAdded() {
	return <Badge variant="added">+12</Badge>;
}

/** Removed — ADS "removed" appearance (red count) */
export function BadgeDemoRemoved() {
	return <Badge variant="removed">-8</Badge>;
}

/** Destructive — ADS "danger" appearance (red, subtler palette) */
export function BadgeDemoDestructive() {
	return <Badge variant="destructive">-50</Badge>;
}

/** Success — ADS "success" appearance (green, subtler palette) */
export function BadgeDemoSuccess() {
	return <Badge variant="success">+100</Badge>;
}

/** Warning — ADS "warning" appearance (yellow) */
export function BadgeDemoWarning() {
	return <Badge variant="warning">5</Badge>;
}

/** Info — ADS "information" appearance (blue) */
export function BadgeDemoInfo() {
	return <Badge variant="info">12</Badge>;
}

/** Discovery — ADS "discovery" appearance (purple) */
export function BadgeDemoDiscovery() {
	return <Badge variant="discovery">3</Badge>;
}

/** Max value — ADS max prop: values exceeding max show as "max+" */
export function BadgeDemoMaxValue() {
	return (
		<div className="flex items-center gap-2">
			<Badge max={99}>{150}</Badge>
			<Badge max={500}>{1000}</Badge>
			<Badge max={99}>{50}</Badge>
		</div>
	);
}

/** All variants — every badge appearance side by side */
export function BadgeDemoVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge>8</Badge>
			<Badge variant="neutral">8</Badge>
			<Badge variant="primary">5</Badge>
			<OnBold>
				<Badge variant="primaryInverted">5</Badge>
			</OnBold>
			<OnBold>
				<Badge variant="inverse">8</Badge>
			</OnBold>
			<Badge variant="important">150</Badge>
			<Badge variant="added">+12</Badge>
			<Badge variant="removed">-8</Badge>
			<Badge variant="destructive">-50</Badge>
			<Badge variant="success">+100</Badge>
			<Badge variant="warning">5</Badge>
			<Badge variant="info">12</Badge>
			<Badge variant="discovery">3</Badge>
		</div>
	);
}

/** With icon — badge with inline icon using VPK Icon wrapper */
export function BadgeDemoWithIcon() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge variant="success">
				<Icon render={<CheckCircleIcon label="" size="small" />} label="" className="text-icon-success" />
				+100
			</Badge>
			<Badge variant="info">
				<Icon render={<InformationCircleIcon label="" size="small" />} label="" className="text-icon-information" />
				12
			</Badge>
			<Badge variant="warning">
				<Icon render={<StatusWarningIcon label="" size="small" />} label="" className="text-icon-warning" />
				5
			</Badge>
		</div>
	);
}

/** With spinner — badge with inline spinner for loading states */
export function BadgeDemoWithSpinner() {
	return (
		<div className="flex items-center gap-4">
			<Badge>
				<Spinner data-icon="inline-start" />
				8
			</Badge>
			<Badge variant="info">
				<Spinner data-icon="inline-start" />
				12
			</Badge>
			<Badge variant="success">
				<Spinner data-icon="inline-start" />
				+100
			</Badge>
		</div>
	);
}

/**
 * Disabled — Badge is a display-only element (span), not interactive.
 * Apply disabled styles via className for visual-only disabled presentation.
 */
export function BadgeDemoDisabled() {
	return (
		<div className="flex items-center gap-4">
			<Badge className="pointer-events-none bg-bg-disabled text-text-disabled">8</Badge>
			<Badge variant="important" className="pointer-events-none bg-bg-disabled text-text-disabled">5</Badge>
			<Badge variant="neutral" className="pointer-events-none opacity-(--opacity-disabled)">8</Badge>
		</div>
	);
}

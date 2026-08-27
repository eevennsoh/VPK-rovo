"use client";

import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import StatusWarningIcon from "@atlaskit/icon/core/status-warning";

/** All 12 badge appearances in one wrapping row (used by both hero theme rows). */
function BadgeRow() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge>8</Badge>
			<Badge variant="danger">3</Badge>
			<Badge variant="success">+100</Badge>
			<Badge variant="warning">5</Badge>
			<Badge variant="information">12</Badge>
			<Badge variant="discovery">7</Badge>
			<Badge variant="inverse">12</Badge>
			<Badge variant="informationBold">12</Badge>
			<Badge variant="successBold">+100</Badge>
			<Badge variant="dangerBold">3</Badge>
			<Badge variant="warningBold">5</Badge>
			<Badge variant="discoveryBold">7</Badge>
		</div>
	);
}

/**
 * Renders `children` twice: once in light mode, once in a dark-mode subtree.
 * The dark row uses ADS subtree theming (data-subtree-theme + data-color-mode
 * ="dark") so every semantic token flips to its dark value — no hardcoded
 * colors or `dark:` utilities.
 */
function LightDarkRows({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex w-full flex-col gap-3">
			<div className="rounded-lg p-4">{children}</div>
			<div
				className="rounded-lg bg-surface p-4"
				data-subtree-theme=""
				data-color-mode="dark"
				data-theme="dark:dark spacing:spacing typography:typography shape:shape"
			>
				{children}
			</div>
		</div>
	);
}

// --- Overview (default export used by UI_DEMO) ---

/** Hero preview — every flat + bold appearance, shown in light and dark mode. */
export default function BadgeDemo() {
	return (
		<LightDarkRows>
			<BadgeRow />
		</LightDarkRows>
	);
}

// --- ADS appearance demos (mirror atlassian.design/components/badge/examples) ---

/** Neutral — gray (default appearance, replaces legacy "default") */
export function BadgeDemoNeutral() {
	return <Badge>8</Badge>;
}

/** Danger — red (replaces legacy "removed" and "important") */
export function BadgeDemoDanger() {
	return <Badge variant="danger">3</Badge>;
}

/** Success — green (replaces legacy "added") */
export function BadgeDemoSuccess() {
	return <Badge variant="success">+100</Badge>;
}

/** Warning — yellow */
export function BadgeDemoWarning() {
	return <Badge variant="warning">5</Badge>;
}

/** Information — blue (replaces legacy "primary") */
export function BadgeDemoInformation() {
	return <Badge variant="information">12</Badge>;
}

/** Discovery — purple */
export function BadgeDemoDiscovery() {
	return <Badge variant="discovery">7</Badge>;
}

/**
 * Inverse — inverted colors for high contrast on a darker surface (replaces
 * legacy "primaryInverted"). Shown in both light and dark mode on its required
 * bold backdrop.
 */
export function BadgeDemoInverse() {
	return (
		<LightDarkRows>
			<Badge variant="inverse">12</Badge>
		</LightDarkRows>
	);
}

/** Information bold — bold blue */
export function BadgeDemoInformationBold() {
	return <Badge variant="informationBold">12</Badge>;
}

/** Success bold — bold green */
export function BadgeDemoSuccessBold() {
	return <Badge variant="successBold">+100</Badge>;
}

/** Danger bold — bold red */
export function BadgeDemoDangerBold() {
	return <Badge variant="dangerBold">3</Badge>;
}

/** Warning bold — bold yellow */
export function BadgeDemoWarningBold() {
	return <Badge variant="warningBold">5</Badge>;
}

/** Discovery bold — bold purple */
export function BadgeDemoDiscoveryBold() {
	return <Badge variant="discoveryBold">7</Badge>;
}

/** Max value — values exceeding max display as "max+". Defaults to 99. */
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
			<Badge variant="danger">3</Badge>
			<Badge variant="success">+100</Badge>
			<Badge variant="warning">5</Badge>
			<Badge variant="information">12</Badge>
			<Badge variant="discovery">7</Badge>
			<Badge variant="inverse">12</Badge>
			<Badge variant="informationBold">12</Badge>
			<Badge variant="successBold">+100</Badge>
			<Badge variant="dangerBold">3</Badge>
			<Badge variant="warningBold">5</Badge>
			<Badge variant="discoveryBold">7</Badge>
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
			<Badge variant="information">
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
				<Spinner data-icon="inline-start" variant="inherit" />
				8
			</Badge>
			<Badge variant="information">
				<Spinner data-icon="inline-start" variant="inherit" />
				12
			</Badge>
			<Badge variant="success">
				<Spinner data-icon="inline-start" variant="inherit" />
				+100
			</Badge>
		</div>
	);
}

/**
 * Letters and special characters — optional leading symbols and trailing
 * letters add meaning to a count (mirrors atlassian.design badge usage):
 * leading "+"/"-" represent additions or subtractions, and trailing letters
 * abbreviate units (d for day, K for thousand, M for million). These strings
 * contain non-digit characters, so they bypass the numeric `max` capping.
 */
export function BadgeDemoLettersAndSymbols() {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="success">+5</Badge>
				<Badge variant="success">+99</Badge>
				<Badge variant="danger">-3</Badge>
				<Badge variant="danger">-12</Badge>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Badge>5d</Badge>
				<Badge variant="information">2K</Badge>
				<Badge variant="discovery">1.2M</Badge>
			</div>
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
			<Badge variant="danger" className="pointer-events-none bg-bg-disabled text-text-disabled">5</Badge>
			<Badge variant="information" className="pointer-events-none bg-bg-disabled text-text-disabled">12</Badge>
		</div>
	);
}

"use client";

import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import StatusWarningIcon from "@atlaskit/icon/core/status-warning";

// --- Overview (default export used by UI_DEMO) ---

export default function BadgeDemo() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge>8</Badge>
			<Badge variant="important">150</Badge>
			<Badge variant="secondary">8</Badge>
			<Badge variant="destructive">-50</Badge>
			<Badge variant="success">+100</Badge>
			<Badge variant="warning">5</Badge>
			<Badge variant="info">12</Badge>
			<Badge variant="discovery">3</Badge>
			<Badge variant="outline">8</Badge>
			<Badge variant="ghost">8</Badge>
			<Badge variant="link">8</Badge>
		</div>
	);
}

// --- ADS-mirroring demos (mirror atlassian.design/components/badge/examples) ---

/** Default — ADS "neutral" appearance (gray pill, numeric count) */
export function BadgeDemoDefault() {
	return <Badge>8</Badge>;
}

/** Important — ADS "important" appearance (bold red, high-urgency count) */
export function BadgeDemoImportant() {
	return <Badge variant="important">150</Badge>;
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

// --- Per-variant showcase demos ---

export function BadgeDemoSecondary() {
	return <Badge variant="secondary">8</Badge>;
}

export function BadgeDemoDestructive() {
	return <Badge variant="destructive">-50</Badge>;
}

export function BadgeDemoSuccess() {
	return <Badge variant="success">+100</Badge>;
}

export function BadgeDemoWarning() {
	return <Badge variant="warning">5</Badge>;
}

export function BadgeDemoInfo() {
	return <Badge variant="info">12</Badge>;
}

export function BadgeDemoDiscovery() {
	return <Badge variant="discovery">3</Badge>;
}

export function BadgeDemoOutline() {
	return <Badge variant="outline">8</Badge>;
}

export function BadgeDemoGhost() {
	return <Badge variant="ghost">8</Badge>;
}

export function BadgeDemoLink() {
	return <Badge variant="link">8</Badge>;
}

/** All variants — all badge variants side by side */
export function BadgeDemoVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge>8</Badge>
			<Badge variant="important">150</Badge>
			<Badge variant="secondary">8</Badge>
			<Badge variant="destructive">-50</Badge>
			<Badge variant="success">+100</Badge>
			<Badge variant="warning">5</Badge>
			<Badge variant="info">12</Badge>
			<Badge variant="discovery">3</Badge>
			<Badge variant="outline">8</Badge>
			<Badge variant="ghost">8</Badge>
			<Badge variant="link">8</Badge>
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
			<Badge variant="outline" className="pointer-events-none opacity-(--opacity-disabled)">8</Badge>
		</div>
	);
}

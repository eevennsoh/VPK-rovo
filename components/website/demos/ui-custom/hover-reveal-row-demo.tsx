"use client";

import { useState } from "react";
import EditIcon from "@atlaskit/icon/core/edit";

import { Switch } from "@/components/ui/switch";
import {
	hoverRevealRowClassName,
	HoverRevealActions,
	HoverRevealLabel,
} from "@/components/ui-custom/hover-reveal-row";
import { cn } from "@/lib/utils";

const SAMPLE_LABELS = [
	"New message in Selected Slack channel",
	"Work item transitioned to In Progress",
	"Scheduled — every weekday morning",
];

/**
 * One hover-reveal row: a relative `group` container, a non-interactive label
 * surface, and the absolutely-positioned trailing controls. The label shows in
 * full at rest and truncates to clear the controls on hover / keyboard focus;
 * activation stays on the switch and edit button.
 */
function DemoRow({
	label,
	withEdit = true,
}: Readonly<{ label: string; withEdit?: boolean }>) {
	const [enabled, setEnabled] = useState(true);

	return (
		<div className={hoverRevealRowClassName}>
			<div
				className={cn(
					"flex h-9 w-full min-w-0 items-center rounded-lg px-2 text-left text-sm transition-colors duration-normal ease-out group-hover/hover-reveal-row:bg-bg-neutral-subtle-hovered group-has-[:focus-visible]/hover-reveal-row:bg-bg-neutral-subtle-hovered",
					enabled ? "text-text" : "text-text-disabled group-hover/hover-reveal-row:text-text-disabled",
				)}
			>
				<HoverRevealLabel
					reserveOnReveal={withEdit ? 2 : 1}
					reserveAtRest={enabled ? 0 : 1}
				>
					{label}
				</HoverRevealLabel>
			</div>
			<HoverRevealActions
				toggleParked={!enabled}
				toggle={
					<Switch
						size="sm"
						checked={enabled}
						onCheckedChange={setEnabled}
						aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
					/>
				}
				action={
					withEdit ? (
						<button
							type="button"
							aria-label={`Edit ${label}`}
							className="flex size-6 items-center justify-center rounded-md text-text-subtlest transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected [&_svg]:size-4"
						>
							<EditIcon label="" size="small" />
						</button>
					) : undefined
				}
			/>
		</div>
	);
}

function DemoCard({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="w-72 rounded-xl border border-border bg-surface p-1">
			{children}
		</div>
	);
}

export default function HoverRevealRowDemo() {
	return (
		<DemoCard>
			{SAMPLE_LABELS.map((label) => (
				<DemoRow key={label} label={label} />
			))}
		</DemoCard>
	);
}

export function HoverRevealRowDemoToggleAndAction() {
	return (
		<DemoCard>
			{SAMPLE_LABELS.map((label) => (
				<DemoRow key={label} label={label} />
			))}
		</DemoCard>
	);
}

export function HoverRevealRowDemoToggleOnly() {
	return (
		<DemoCard>
			{SAMPLE_LABELS.map((label) => (
				<DemoRow key={label} label={label} withEdit={false} />
			))}
		</DemoCard>
	);
}

export function HoverRevealRowDemoParked() {
	// Rows that start "off": the switch stays parked and the label keeps its
	// muted color and reserved width even at rest.
	const labels = [
		"Disabled — push to protected branch",
		"Disabled — incident acknowledged",
	];

	function ParkedRow({ label }: Readonly<{ label: string }>) {
		const [enabled, setEnabled] = useState(false);
		return (
			<div className={hoverRevealRowClassName}>
				<div
					className={cn(
						"flex h-9 w-full min-w-0 items-center rounded-lg px-2 text-left text-sm transition-colors duration-normal ease-out group-hover/hover-reveal-row:bg-bg-neutral-subtle-hovered group-has-[:focus-visible]/hover-reveal-row:bg-bg-neutral-subtle-hovered",
						enabled ? "text-text" : "text-text-disabled group-hover/hover-reveal-row:text-text-disabled",
					)}
				>
					<HoverRevealLabel reserveOnReveal={2} reserveAtRest={enabled ? 0 : 1}>
						{label}
					</HoverRevealLabel>
				</div>
				<HoverRevealActions
					toggleParked={!enabled}
					toggle={
						<Switch
							size="sm"
							checked={enabled}
							onCheckedChange={setEnabled}
							aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
						/>
					}
					action={
						<button
							type="button"
							aria-label={`Edit ${label}`}
							className="flex size-6 items-center justify-center rounded-md text-text-subtlest transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected [&_svg]:size-4"
						>
							<EditIcon label="" size="small" />
						</button>
					}
				/>
			</div>
		);
	}

	return (
		<DemoCard>
			{labels.map((label) => (
				<ParkedRow key={label} label={label} />
			))}
		</DemoCard>
	);
}

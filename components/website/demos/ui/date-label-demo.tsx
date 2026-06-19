"use client";

import CalendarIcon from "@atlaskit/icon/core/calendar";
import ClockIcon from "@atlaskit/icon/core/clock";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import {
	DateLabel,
	DateLabelTrigger,
	type DateLabelProps,
} from "@/components/ui/date-label";

// Fixed reference date keeps demo output deterministic across renders.
const sampleDate = new Date(2026, 6, 29); // Jul 29, 2026

export default function DateLabelDemo() {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<DateLabel date={sampleDate} />
			<DateLabel date={sampleDate} variant="warning" />
			<DateLabel date={sampleDate} variant="danger" />
		</div>
	);
}

export function DateLabelDemoDefault() {
	return <DateLabel date={sampleDate} />;
}

export function DateLabelDemoAppearance() {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<DateLabel date={sampleDate} variant="neutral" />
			<DateLabel date={sampleDate} variant="warning" />
			<DateLabel date={sampleDate} variant="danger" />
		</div>
	);
}

export function DateLabelDemoIcon() {
	return (
		<DateLabel
			date={sampleDate}
			icon={
				<Icon
					render={<CalendarIcon label="" size="small" />}
					label=""
					className="text-current"
				/>
			}
		/>
	);
}

export function DateLabelDemoSpacious() {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<DateLabel date={sampleDate} size="default" />
			<DateLabel date={sampleDate} size="spacious" />
		</div>
	);
}

export function DateLabelDemoMaxWidth() {
	return (
		<DateLabel date={sampleDate} dateStyle="full" maxWidth={140} />
	);
}

export function DateLabelDemoDateStyles() {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<DateLabel date={sampleDate} dateStyle="short" />
			<DateLabel date={sampleDate} dateStyle="medium" />
			<DateLabel date={sampleDate} dateStyle="long" />
			<DateLabel date={sampleDate} dateStyle="full" />
		</div>
	);
}

function DateLabelDropdown({
	variant,
	icon,
}: Readonly<{ variant: DateLabelProps["variant"]; icon: React.ReactNode }>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<DateLabelTrigger date={sampleDate} variant={variant} icon={icon} />
				}
			/>
			<DropdownMenuContent align="start">
				<DropdownMenuItem onSelect={() => {}}>Today</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => {}}>Tomorrow</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => {}}>Next week</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => {}}>Custom…</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function DateLabelDemoDropdownTrigger() {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<DateLabelDropdown
				variant="neutral"
				icon={
					<Icon
						render={<CalendarIcon label="" size="small" />}
						label=""
						className="text-current"
					/>
				}
			/>
			<DateLabelDropdown
				variant="warning"
				icon={
					<Icon
						render={<ClockIcon label="" size="small" />}
						label=""
						className="text-current"
					/>
				}
			/>
			<DateLabelDropdown
				variant="danger"
				icon={
					<Icon
						render={<StatusErrorIcon label="" size="small" />}
						label=""
						className="text-current"
					/>
				}
			/>
		</div>
	);
}

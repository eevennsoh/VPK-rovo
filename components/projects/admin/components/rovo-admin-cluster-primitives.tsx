"use client";

import type { ComponentType, ReactNode } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import ClockIcon from "@atlaskit/icon/core/clock";
import CrossCircleIcon from "@atlaskit/icon/core/cross-circle";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import WarningIcon from "@atlaskit/icon/core/warning";
import { CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Lozenge } from "@/components/ui/lozenge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { token } from "@/lib/tokens";
import type {
	AdminRovoEmptyState,
	AdminRovoFixtureState,
	AdminRovoStatus,
	AdminRovoStatusTone,
} from "../data/rovo-admin-cluster-data";
import { ADMIN_ROVO_FIXTURE_STATE_OPTIONS } from "../data/rovo-admin-cluster-data";
import { AdminCard } from "./view-primitives";

const STATUS_ICON_BY_TONE: Record<AdminRovoStatusTone, ComponentType<NewCoreIconProps>> = {
	danger: CrossCircleIcon,
	discovery: StatusInformationIcon,
	information: StatusInformationIcon,
	neutral: InformationCircleIcon,
	success: CheckCircleIcon,
	warning: WarningIcon,
};

export function AdminRovoFixtureStateSelect({
	value,
	onValueChange,
}: Readonly<{
	value: AdminRovoFixtureState;
	onValueChange: (value: AdminRovoFixtureState) => void;
}>) {
	return (
		<label className="flex flex-col gap-1 text-xs font-semibold text-text">
			Fixture state
			<Select
				value={value}
				onValueChange={(nextValue) => {
					if (isAdminRovoFixtureState(nextValue)) {
						onValueChange(nextValue);
					}
				}}
			>
				<SelectTrigger aria-label="Select Rovo admin fixture state" className="min-w-[168px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent align="end">
					{ADMIN_ROVO_FIXTURE_STATE_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							<span className="flex min-w-0 flex-col">
								<span>{option.label}</span>
								<span className="text-xs text-text-subtlest">{option.description}</span>
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</label>
	);
}

export function AdminRovoPrototypeNotice({
	children,
	title = "Prototype fixture",
}: Readonly<{
	children: ReactNode;
	title?: string;
}>) {
	return (
		<div
			role="note"
			className="flex gap-3 rounded-lg border border-border-information-subtle bg-bg-information-subtler px-4 py-3 text-sm text-text"
		>
			<Icon
				render={<InformationCircleIcon label="" color={token("color.icon.information")} />}
				label=""
				className="mt-0.5 shrink-0"
			/>
			<div className="min-w-0">
				<div className="font-semibold text-text-information-bolder">{title}</div>
				<div className="mt-1 text-text-subtle">{children}</div>
			</div>
		</div>
	);
}

export function AdminRovoStatusLozenge({
	status,
}: Readonly<{
	status: AdminRovoStatus;
}>) {
	const StatusIcon = STATUS_ICON_BY_TONE[status.tone];

	return (
		<Lozenge
			variant={status.tone}
			elemBefore={<Icon render={<StatusIcon label="" />} label="" />}
		>
			{status.label}
		</Lozenge>
	);
}

export function AdminRovoEmptyStateCard({
	emptyState,
}: Readonly<{
	emptyState: AdminRovoEmptyState;
}>) {
	return (
		<AdminCard>
			<CardContent className="flex flex-col items-center gap-2 py-12 text-center">
				<Icon
					render={<InformationCircleIcon label="" color={token("color.icon.subtle")} />}
					label=""
					className="text-text-subtle"
				/>
				<div className="text-text" style={{ font: token("font.heading.small") }}>
					{emptyState.title}
				</div>
				<p className="max-w-[640px] text-sm text-text-subtlest">
					{emptyState.description}
				</p>
			</CardContent>
		</AdminCard>
	);
}

export function AdminRovoLoadingState({ label }: Readonly<{ label: string }>) {
	return (
		<div aria-busy="true" aria-label={label} className="flex flex-col gap-4">
			<div className="grid gap-4 md:grid-cols-3">
				{["summary-a", "summary-b", "summary-c"].map((id) => (
					<AdminCard key={id}>
						<CardContent className="flex flex-col gap-3">
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-4 w-36" />
							<Skeleton className="h-4 w-28" />
						</CardContent>
					</AdminCard>
				))}
			</div>
			<AdminCard>
				<CardContent className="flex flex-col gap-3">
					<div className="flex items-center gap-2 text-sm text-text-subtle">
						<Icon
							render={<ClockIcon label="" color={token("color.icon.subtle")} />}
							label=""
						/>
						<span>{label}</span>
					</div>
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-8 w-2/3" />
				</CardContent>
			</AdminCard>
		</div>
	);
}

function isAdminRovoFixtureState(value: unknown): value is AdminRovoFixtureState {
	return (
		typeof value === "string"
		&& ADMIN_ROVO_FIXTURE_STATE_OPTIONS.some((option) => option.value === value)
	);
}

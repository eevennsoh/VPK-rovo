"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	ADMIN_ROVO_INSIGHTS_FIXTURES,
	type AdminRovoFixtureState,
	type AdminRovoInsightsDecision,
	type AdminRovoInsightsSurface,
} from "../data/rovo-admin-cluster-data";
import {
	AdminRovoEmptyStateCard,
	AdminRovoFixtureStateSelect,
	AdminRovoLoadingState,
	AdminRovoPrototypeNotice,
	AdminRovoStatusLozenge,
} from "./rovo-admin-cluster-primitives";
import {
	AdminCard,
	AdminMetricCard,
	AdminPageShell,
	AdminSectionHeading,
	AdminViewHeader,
} from "./view-primitives";

export function RovoInsightsView() {
	const [fixtureState, setFixtureState] = useState<AdminRovoFixtureState>("configured");
	const fixture = ADMIN_ROVO_INSIGHTS_FIXTURES[fixtureState];

	return (
		<AdminPageShell>
			<AdminViewHeader
				title="Rovo insights"
				description="Review local prototype usage signals for Rovo settings and MCP rollout decisions."
				action={
					<AdminRovoFixtureStateSelect
						value={fixtureState}
						onValueChange={setFixtureState}
					/>
				}
			/>

			<AdminRovoPrototypeNotice>
				Usage values are deterministic local examples. This view does not collect telemetry,
				query organization APIs, or claim live adoption.
			</AdminRovoPrototypeNotice>

			{fixture.state === "loading" ? (
				<AdminRovoLoadingState label="Loading simulated Rovo usage insights" />
			) : (
				<>
					<AdminCard>
						<CardContent className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex min-w-0 flex-col gap-2">
								<AdminSectionHeading>Insight freshness</AdminSectionHeading>
								<p className="max-w-[760px] text-sm text-text-subtle">
									{fixture.stateSummary}
								</p>
								<p className="max-w-[760px] text-sm text-text-subtlest">
									{fixture.freshness.detail}
								</p>
							</div>
							<AdminRovoStatusLozenge status={fixture.freshness} />
						</CardContent>
					</AdminCard>

					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{fixture.metrics.map((metric) => (
							<AdminMetricCard
								key={metric.label}
								label={metric.label}
								value={metric.value}
								description={metric.description}
							/>
						))}
					</div>

					{fixture.surfaces.length > 0 ? (
						<div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
							<InsightsSurfaceTable surfaces={fixture.surfaces} />
							<InsightsDecisions decisions={fixture.decisions} />
						</div>
					) : (
						<AdminRovoEmptyStateCard emptyState={fixture.emptyState} />
					)}
				</>
			)}
		</AdminPageShell>
	);
}

function InsightsSurfaceTable({
	surfaces,
}: Readonly<{
	surfaces: readonly AdminRovoInsightsSurface[];
}>) {
	return (
		<AdminCard>
			<CardContent className="flex flex-col gap-3">
				<AdminSectionHeading>Usage by surface</AdminSectionHeading>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Surface</TableHead>
							<TableHead>Usage</TableHead>
							<TableHead>Trend</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Admin decision</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{surfaces.map((surface) => (
							<TableRow key={surface.id}>
								<TableCell className="font-medium text-text">{surface.surface}</TableCell>
								<TableCell className="text-text-subtle">{surface.usage}</TableCell>
								<TableCell>{surface.trend}</TableCell>
								<TableCell>
									<AdminRovoStatusLozenge status={surface.status} />
								</TableCell>
								<TableCell className="max-w-[360px] whitespace-normal text-text-subtle">
									{surface.decision}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</AdminCard>
	);
}

function InsightsDecisions({
	decisions,
}: Readonly<{
	decisions: readonly AdminRovoInsightsDecision[];
}>) {
	return (
		<AdminCard>
			<CardContent className="flex flex-col gap-3">
				<AdminSectionHeading>Administrator decisions</AdminSectionHeading>
				<ul className="flex flex-col gap-3">
					{decisions.map((decision) => (
						<li key={decision.id} className="rounded-md border border-border bg-bg-neutral-subtle p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="font-medium text-text">{decision.title}</span>
								<AdminRovoStatusLozenge status={decision.status} />
							</div>
							<p className="mt-2 text-sm text-text-subtle">{decision.description}</p>
						</li>
					))}
				</ul>
			</CardContent>
		</AdminCard>
	);
}

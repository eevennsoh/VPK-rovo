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
	ADMIN_ROVO_MCP_FIXTURES,
	type AdminRovoFixtureState,
	type AdminRovoMcpCheck,
	type AdminRovoMcpServer,
	type AdminRovoMcpTool,
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

export function RovoMcpConnectivityView() {
	const [fixtureState, setFixtureState] = useState<AdminRovoFixtureState>("configured");
	const fixture = ADMIN_ROVO_MCP_FIXTURES[fixtureState];

	return (
		<AdminPageShell>
			<AdminViewHeader
				title="Rovo MCP server"
				description="Review local prototype connectivity states for Rovo MCP sources and tools."
				action={
					<AdminRovoFixtureStateSelect
						value={fixtureState}
						onValueChange={setFixtureState}
					/>
				}
			/>

			<AdminRovoPrototypeNotice>
				This view uses deterministic local fixtures only. It does not test MCP endpoints,
				store credentials, or change organization configuration.
			</AdminRovoPrototypeNotice>

			{fixture.state === "loading" ? (
				<AdminRovoLoadingState label="Checking simulated MCP connectivity" />
			) : (
				<>
					<AdminCard>
						<CardContent className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex min-w-0 flex-col gap-2">
								<AdminSectionHeading>Connectivity status</AdminSectionHeading>
								<p className="max-w-[760px] text-sm text-text-subtle">
									{fixture.stateSummary}
								</p>
								<p className="max-w-[760px] text-sm text-text-subtlest">
									{fixture.connection.detail}
								</p>
							</div>
							<AdminRovoStatusLozenge status={fixture.connection} />
						</CardContent>
					</AdminCard>

					<div className="grid gap-4 md:grid-cols-3">
						{fixture.metrics.map((metric) => (
							<AdminMetricCard
								key={metric.label}
								label={metric.label}
								value={metric.value}
								description={metric.description}
							/>
						))}
					</div>

					{fixture.servers.length > 0 ? (
						<>
							<McpServersTable servers={fixture.servers} />
							<div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
								<McpToolsTable tools={fixture.tools} />
								<McpChecks checks={fixture.checks} />
							</div>
						</>
					) : (
						<AdminRovoEmptyStateCard emptyState={fixture.emptyState} />
					)}
				</>
			)}
		</AdminPageShell>
	);
}

function McpServersTable({ servers }: Readonly<{ servers: readonly AdminRovoMcpServer[] }>) {
	return (
		<AdminCard>
			<CardContent className="flex flex-col gap-3">
				<AdminSectionHeading>Configured MCP sources</AdminSectionHeading>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Source</TableHead>
							<TableHead>Endpoint</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Owner</TableHead>
							<TableHead>Admin decision</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{servers.map((server) => (
							<TableRow key={server.id}>
								<TableCell>
									<div className="flex min-w-[180px] flex-col">
										<span className="font-medium text-text">{server.name}</span>
										<span className="text-xs text-text-subtlest">{server.lastCheck}</span>
									</div>
								</TableCell>
								<TableCell className="font-mono text-xs text-text-subtle">{server.endpoint}</TableCell>
								<TableCell>
									<AdminRovoStatusLozenge status={server.status} />
								</TableCell>
								<TableCell>{server.owner}</TableCell>
								<TableCell className="max-w-[360px] whitespace-normal text-text-subtle">
									{server.decision}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</AdminCard>
	);
}

function McpToolsTable({ tools }: Readonly<{ tools: readonly AdminRovoMcpTool[] }>) {
	return (
		<AdminCard>
			<CardContent className="flex flex-col gap-3">
				<AdminSectionHeading>Tool availability</AdminSectionHeading>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Tool</TableHead>
							<TableHead>Surface</TableHead>
							<TableHead>Usage</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Decision</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{tools.map((tool) => (
							<TableRow key={tool.id}>
								<TableCell className="font-medium text-text">{tool.name}</TableCell>
								<TableCell>{tool.surface}</TableCell>
								<TableCell className="text-text-subtle">{tool.requests}</TableCell>
								<TableCell>
									<AdminRovoStatusLozenge status={tool.status} />
								</TableCell>
								<TableCell className="max-w-[320px] whitespace-normal text-text-subtle">
									{tool.decision}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</AdminCard>
	);
}

function McpChecks({ checks }: Readonly<{ checks: readonly AdminRovoMcpCheck[] }>) {
	return (
		<AdminCard>
			<CardContent className="flex flex-col gap-3">
				<AdminSectionHeading>Connectivity checks</AdminSectionHeading>
				<ul className="flex flex-col gap-3">
					{checks.map((check) => (
						<li key={check.id} className="rounded-md border border-border bg-bg-neutral-subtle p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="font-medium text-text">{check.label}</span>
								<AdminRovoStatusLozenge status={check.status} />
							</div>
							<p className="mt-2 text-sm text-text-subtle">{check.detail}</p>
						</li>
					))}
				</ul>
			</CardContent>
		</AdminCard>
	);
}

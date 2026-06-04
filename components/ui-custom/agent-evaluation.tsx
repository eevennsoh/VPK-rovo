"use client";

import { useState, type ReactNode } from "react";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import CloudArrowUpIcon from "@atlaskit/icon/core/cloud-arrow-up";
import FeedbackIcon from "@atlaskit/icon/core/feedback";
import SettingsIcon from "@atlaskit/icon/core/settings";
import SpreadsheetIcon from "@atlaskit/icon/core/spreadsheet";
import StopwatchIcon from "@atlaskit/icon/core/stopwatch";
import AiBotIcon from "@atlaskit/icon-lab/core/ai-bot";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Lozenge } from "@/components/ui/lozenge";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface AgentEvaluationAgentOption {
	value: string;
	name: string;
	meta?: string;
	status?: string;
}

export interface AgentEvaluationDatasetOption {
	value: string;
	name: string;
}

export interface AgentEvaluationTypeOption {
	value: string;
	name: string;
	description: string;
}

export interface AgentEvaluationCompletedRow {
	id: string;
	name: string;
	date: string;
	time: string;
	version: string;
	dataset: string;
	runTime: string;
	score: string;
	status: ReactNode;
	results?: ReactNode;
}

export interface AgentEvaluationProps {
	agents?: readonly AgentEvaluationAgentOption[];
	datasets?: readonly AgentEvaluationDatasetOption[];
	evaluationTypes?: readonly AgentEvaluationTypeOption[];
	completedEvaluations?: readonly AgentEvaluationCompletedRow[];
	className?: string;
}

const DEFAULT_AGENTS: readonly AgentEvaluationAgentOption[] = [
	{ value: "draft", name: "Weekly Work Summary Agent", status: "Draft" },
	{ value: "v1", name: "Weekly Work Summary Agent v1", meta: "Created May 14, 2026" },
];

const DEFAULT_EVALUATION_TYPES: readonly AgentEvaluationTypeOption[] = [
	{
		value: "response-accuracy",
		name: "Response Accuracy",
		description: "Test accuracy against responses in the dataset.",
	},
	{
		value: "resolution-rate",
		name: "Resolution Rate",
		description: "Test the rate at which the agent can resolve support requests.",
	},
	{
		value: "manual-testing",
		name: "Manual Testing",
		description: "Bulk generate responses without any scoring (manually evaluate).",
	},
];

const COMPLETED_EVALUATION_COLUMNS = [
	"Evaluation",
	"Date",
	"Time",
	"Version",
	"Dataset",
	"Run time",
	"Score",
	"Status",
	"Results",
	"Actions",
] as const;

/**
 * Evaluation screen for the agent compact header nav "Evaluation" tab. Lets
 * builders create datasets to simulate agent responses and configure/run
 * evaluations that score how consistently the agent performs.
 */
export function AgentEvaluation({
	agents = DEFAULT_AGENTS,
	datasets = [],
	evaluationTypes = DEFAULT_EVALUATION_TYPES,
	completedEvaluations = [],
	className,
}: Readonly<AgentEvaluationProps>) {
	const [activeTab, setActiveTab] = useState<string>("datasets");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [agentValue, setAgentValue] = useState<string | null>(null);
	const [datasetValue, setDatasetValue] = useState<string | null>(null);
	const [typeValue, setTypeValue] = useState<string | null>(null);

	const canRunEvaluation = Boolean(agentValue && datasetValue && typeValue);

	return (
		<div className={cn("flex h-full w-full flex-col overflow-y-auto bg-surface text-text", className)}>
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-5">
				<header className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h1 className="text-xl font-medium leading-7 text-text">Evaluation</h1>
						<p className="text-sm text-text-subtle">
							Create datasets to simulate agent responses and evaluate performance.
						</p>
					</div>
					<Button type="button" variant="outline" className="gap-1.5 shrink-0">
						<Icon render={<FeedbackIcon label="" size="small" spacing="none" />} label="" className="text-icon-subtle" />
						Share feedback
					</Button>
				</header>

				<Tabs value={activeTab} onValueChange={(value) => value && setActiveTab(value)}>
					<TabsList variant="line" className="w-full justify-start">
						<TabsTrigger value="datasets">Datasets</TabsTrigger>
						<TabsTrigger value="evaluations">Evaluations</TabsTrigger>
					</TabsList>

					<TabsContent value="datasets" className="pt-5 data-[hidden]:hidden">
						<AgentEvaluationDatasetsPanel
							datasets={datasets}
							onCreateDataset={() => setIsCreateOpen(true)}
						/>
					</TabsContent>

					<TabsContent value="evaluations" className="pt-5 data-[hidden]:hidden">
						<AgentEvaluationEvaluationsPanel
							agents={agents}
							datasets={datasets}
							evaluationTypes={evaluationTypes}
							completedEvaluations={completedEvaluations}
							agentValue={agentValue}
							datasetValue={datasetValue}
							typeValue={typeValue}
							onAgentChange={setAgentValue}
							onDatasetChange={setDatasetValue}
							onTypeChange={setTypeValue}
							canRunEvaluation={canRunEvaluation}
						/>
					</TabsContent>
				</Tabs>
			</div>

			<CreateDatasetDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
		</div>
	);
}

function AgentEvaluationDatasetsPanel({
	datasets,
	onCreateDataset,
}: Readonly<{
	datasets: readonly AgentEvaluationDatasetOption[];
	onCreateDataset: () => void;
}>) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button type="button" onClick={onCreateDataset}>
					Create dataset
				</Button>
			</div>

			<section className="rounded-xl border border-border bg-surface-sunken p-5">
				<div className="mb-4 flex items-center gap-2">
					<Icon render={<SpreadsheetIcon label="" size="small" spacing="none" />} label="" className="text-icon" />
					<h2 className="text-sm font-semibold text-text">Datasets</h2>
				</div>

				{datasets.length === 0 ? (
					<div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-10">
						<div className="flex max-w-md flex-col items-center gap-2 text-center">
							<div className="flex items-center gap-2">
								<Icon render={<SpreadsheetIcon label="" size="small" spacing="none" />} label="" className="text-icon" />
								<h3 className="text-base font-semibold text-text">Ready to test your agent?</h3>
							</div>
							<p className="text-sm/relaxed text-text-subtle">
								Datasets are example prompts and responses in a CSV format. Evaluations judge how
								consistently your agent responds against a selected dataset.
							</p>
						</div>
					</div>
				) : (
					<ul className="flex flex-col gap-1">
						{datasets.map((dataset) => (
							<li
								key={dataset.value}
								className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
							>
								<Icon render={<SpreadsheetIcon label="" size="small" spacing="none" />} label="" className="text-icon-subtle" />
								{dataset.name}
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

function AgentEvaluationEvaluationsPanel({
	agents,
	datasets,
	evaluationTypes,
	completedEvaluations,
	agentValue,
	datasetValue,
	typeValue,
	onAgentChange,
	onDatasetChange,
	onTypeChange,
	canRunEvaluation,
}: Readonly<{
	agents: readonly AgentEvaluationAgentOption[];
	datasets: readonly AgentEvaluationDatasetOption[];
	evaluationTypes: readonly AgentEvaluationTypeOption[];
	completedEvaluations: readonly AgentEvaluationCompletedRow[];
	agentValue: string | null;
	datasetValue: string | null;
	typeValue: string | null;
	onAgentChange: (value: string | null) => void;
	onDatasetChange: (value: string | null) => void;
	onTypeChange: (value: string | null) => void;
	canRunEvaluation: boolean;
}>) {
	return (
		<div className="flex flex-col gap-8">
			<section className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface-sunken p-4 lg:grid-cols-2">
				<div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
					<Icon
						render={<StopwatchIcon label="" size="medium" spacing="none" />}
						label=""
						className="text-icon-discovery size-10 [&_svg]:size-10"
					/>
					<p className="max-w-56 text-sm font-semibold text-text">
						Run your first evaluation to see how your agent performs
					</p>
				</div>

				<Card className="gap-4 self-start">
					<CardHeader>
						<CardTitle className="text-sm font-semibold">Next evaluation:</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<Select value={agentValue} onValueChange={(value) => onAgentChange(value as string | null)}>
							<SelectTrigger className="w-full">
								<Icon render={<AiBotIcon label="" size="small" spacing="none" />} label="" className="text-icon-warning" />
								<SelectValue placeholder="Select agent to evaluate" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{agents.map((agent) => (
										<SelectItem key={agent.value} value={agent.value}>
											<span className="flex flex-1 items-center justify-between gap-3">
												<span className="flex flex-col">
													<span className="text-text">{agent.name}</span>
													{agent.meta ? (
														<span className="text-xs text-text-subtle">{agent.meta}</span>
													) : null}
												</span>
												{agent.status ? <Lozenge>{agent.status}</Lozenge> : null}
											</span>
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						<Select value={datasetValue} onValueChange={(value) => onDatasetChange(value as string | null)}>
							<SelectTrigger className="w-full" disabled={datasets.length === 0}>
								<Icon render={<SpreadsheetIcon label="" size="small" spacing="none" />} label="" className="text-icon-subtle" />
								<SelectValue placeholder="Select dataset to use" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{datasets.map((dataset) => (
										<SelectItem key={dataset.value} value={dataset.value}>
											{dataset.name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						<Select value={typeValue} onValueChange={(value) => onTypeChange(value as string | null)}>
							<SelectTrigger className="h-auto! w-full">
								<Icon render={<SettingsIcon label="" size="small" spacing="none" />} label="" className="text-icon-subtle" />
								<SelectValue placeholder="Select evaluation type" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{evaluationTypes.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											<span className="flex flex-col gap-0.5">
												<span className="text-text">{type.name}</span>
												<span className="text-xs text-text-subtle">{type.description}</span>
											</span>
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						<div className="flex justify-end pt-1">
							<Button type="button" disabled={!canRunEvaluation}>
								Run evaluation
							</Button>
						</div>
					</CardContent>
				</Card>
			</section>

			<section className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<Icon render={<CheckCircleIcon label="" size="small" spacing="none" />} label="" className="text-icon" />
					<h2 className="text-sm font-semibold text-text">Completed evaluations</h2>
				</div>

				<div className="rounded-xl border border-border">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								{COMPLETED_EVALUATION_COLUMNS.map((column) => (
									<TableHead key={column} className="px-3">
										{column}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{completedEvaluations.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell
										colSpan={COMPLETED_EVALUATION_COLUMNS.length}
										className="py-6 text-center text-sm text-text-subtle"
									>
										Run your first evaluation to see results here.
									</TableCell>
								</TableRow>
							) : (
								completedEvaluations.map((row) => (
									<TableRow key={row.id}>
										<TableCell className="px-3 font-medium text-text">{row.name}</TableCell>
										<TableCell className="px-3 text-text-subtle">{row.date}</TableCell>
										<TableCell className="px-3 text-text-subtle">{row.time}</TableCell>
										<TableCell className="px-3 text-text-subtle">{row.version}</TableCell>
										<TableCell className="px-3 text-text-subtle">{row.dataset}</TableCell>
										<TableCell className="px-3 text-text-subtle">{row.runTime}</TableCell>
										<TableCell className="px-3 text-text">{row.score}</TableCell>
										<TableCell className="px-3">{row.status}</TableCell>
										<TableCell className="px-3">{row.results}</TableCell>
										<TableCell className="px-3" />
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</section>
		</div>
	);
}

function CreateDatasetDialog({
	open,
	onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Icon render={<SpreadsheetIcon label="" size="small" spacing="none" />} label="" className="text-icon" />
						Create dataset
					</DialogTitle>
				</DialogHeader>

				<div className="flex items-start gap-2 rounded-lg border border-border bg-surface-sunken p-3 text-sm text-text-subtle">
					<span className="flex flex-col gap-1">
						<span>Datasets must have one column for prompts and may have another for expected responses.</span>
						<span>
							<span className="font-semibold text-text">Format:</span> Datasets must be in a CSV format and
							can&apos;t exceed 50 prompts. The first row will be used as a header.
						</span>
					</span>
				</div>

				<Field>
					<FieldLabel htmlFor="create-dataset-name">
						Name <span className="text-text-danger">*</span>
					</FieldLabel>
					<Input id="create-dataset-name" placeholder="" />
					<FieldDescription>Give your dataset a unique name</FieldDescription>
				</Field>

				<button
					type="button"
					className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-sm font-medium text-text-subtle transition-colors hover:bg-bg-neutral-subtle-hovered"
				>
					<Icon render={<CloudArrowUpIcon label="" size="small" spacing="none" />} label="" className="text-icon-subtle" />
					Upload prompts as a CSV file
				</button>

				<DialogDescription className="sr-only">
					Create a dataset to simulate agent responses and evaluate performance.
				</DialogDescription>

				<DialogFooter className="sm:justify-between">
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button type="button" onClick={() => onOpenChange(false)}>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

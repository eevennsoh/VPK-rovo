"use client";

import {
	AgentEvaluation,
	type AgentEvaluationCompletedRow,
	type AgentEvaluationDatasetOption,
} from "@/components/ui-custom/agent-evaluation";
import { Lozenge } from "@/components/ui/lozenge";

export default function AgentEvaluationDemo() {
	return (
		<div className="h-[720px] w-full overflow-hidden rounded-lg border border-border">
			<AgentEvaluation />
		</div>
	);
}

const DATASETS: readonly AgentEvaluationDatasetOption[] = [
	{ value: "support-tickets", name: "Support tickets — Q2" },
	{ value: "weekly-summaries", name: "Weekly summaries sample" },
];

const COMPLETED: readonly AgentEvaluationCompletedRow[] = [
	{
		id: "eval-1",
		name: "Response Accuracy",
		date: "May 28, 2026",
		time: "10:24",
		version: "v1",
		dataset: "Support tickets — Q2",
		runTime: "2m 14s",
		score: "92%",
		status: <Lozenge variant="success">Passed</Lozenge>,
		results: "View",
	},
];

export function AgentEvaluationDemoFilled() {
	return (
		<div className="h-[720px] w-full overflow-hidden rounded-lg border border-border">
			<AgentEvaluation datasets={DATASETS} completedEvaluations={COMPLETED} />
		</div>
	);
}

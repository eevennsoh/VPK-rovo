"use client";

import type { ReactElement } from "react";
import { ProgressTracker, type ProgressTrackerStep } from "@/components/ui/progress-tracker";
import { Tag } from "@/components/ui/tag";

const STEPS = [
	{ id: "1", label: "Create project", state: "done" as const },
	{ id: "2", label: "Configure settings", state: "current" as const },
	{ id: "3", label: "Invite team", state: "todo" as const },
	{ id: "4", label: "Launch", state: "todo" as const },
];

export default function ProgressTrackerDemo() {
	return <ProgressTracker steps={STEPS} />;
}

export function ProgressTrackerDemoDefault() {
	return <ProgressTracker steps={STEPS} />;
}

export function ProgressTrackerDemoAllDone() {
	const steps = [
		{ id: "1", label: "Step 1", state: "done" as const },
		{ id: "2", label: "Step 2", state: "done" as const },
		{ id: "3", label: "Step 3", state: "done" as const },
	];
	return <ProgressTracker steps={steps} />;
}

export function ProgressTrackerDemoAllTodo() {
	const steps = [
		{ id: "1", label: "Select plan", state: "todo" as const },
		{ id: "2", label: "Payment", state: "todo" as const },
		{ id: "3", label: "Confirmation", state: "todo" as const },
	];
	return <ProgressTracker steps={steps} />;
}

function ThreadLinkByline({
	timestamp,
	ticketCodes,
}: Readonly<{
	timestamp: string;
	ticketCodes?: ReadonlyArray<string>;
}>): ReactElement {
	return (
		<span className="grid gap-1">
			<span>{timestamp}</span>
			{ticketCodes && ticketCodes.length > 0 ? (
				<span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
					{ticketCodes.map((ticketCode) => (
						<a
							key={ticketCode}
							className="group inline-flex rounded-sm no-underline focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none"
							href="#"
						>
							<Tag
								color="blue"
								className="cursor-pointer group-hover:bg-bg-neutral-subtle-hovered group-active:bg-bg-neutral-subtle-pressed"
							>
								{ticketCode}
							</Tag>
						</a>
					))}
				</span>
			) : null}
		</span>
	);
}

/**
 * Activity timeline — mirrors the RFP Drafter agent activity feed: run and
 * activity entries shown newest-first with timestamp bylines, blue Rovo
 * thread-link tags, and mixed running / completed / failed states.
 */
export function ProgressTrackerDemoActivityTimeline(): ReactElement {
	const steps: ProgressTrackerStep[] = [
		{
			id: "run-globex",
			label: "Drafting first-pass response for Globex RFP",
			byline: <ThreadLinkByline timestamp="Now" />,
			state: "current",
		},
		{
			id: "run-acme",
			label: "Draft failed for ACME security questionnaire — missing inputs",
			byline: <ThreadLinkByline timestamp="Jun 2, 2026, 9:01 AM" />,
			state: "warning",
		},
		{
			id: "run-batch",
			label: "Drafted 4 RFP responses and moved ready tickets to Review",
			byline: (
				<ThreadLinkByline timestamp="Jun 2, 2026, 9:04 AM" ticketCodes={["RFP-241", "RFP-238"]} />
			),
			state: "done",
		},
		{
			id: "activity-trigger",
			label: "Trigger enabled for the Drafting column",
			byline: "May 30, 2026, 9:00 AM",
			state: "done",
		},
	];

	return (
		<ProgressTracker
			aria-label="RFP Drafter activity timeline"
			bylineClassName="text-xs leading-4"
			className="[&_[data-slot=progress-tracker-content]]:gap-0"
			labelClassName="text-sm leading-5"
			steps={steps}
		/>
	);
}

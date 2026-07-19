"use client";

import { useEffect, useState } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Lozenge,
	LozengeDropdownTrigger,
	type LozengeProps,
} from "@/components/ui/lozenge";

import type { JiraForYouStatus } from "./jira-for-you-types";

const STATUS_VARIANTS: Record<
	JiraForYouStatus,
	NonNullable<LozengeProps["variant"]>
> = {
	"Human review": "warning",
	"In progress": "information",
	"In review": "information",
	"To do": "neutral",
	Done: "success",
};

const STATUS_ORDER: readonly JiraForYouStatus[] = [
	"To do",
	"In progress",
	"In review",
	"Human review",
	"Done",
];

export function JiraForYouStatusLozenge({
	value,
}: Readonly<{
	value: JiraForYouStatus;
}>) {
	return <Lozenge variant={STATUS_VARIANTS[value]}>{value}</Lozenge>;
}

/**
 * Interactive counterpart to {@link JiraForYouStatusLozenge}: a subtle,
 * neutral-toned dropdown trigger for changing the item's Jira workflow status,
 * revealed with the other row actions on hover. Mirrors the agent-session status
 * dropdown (`StatusPill`) — a quiet trigger with colored lozenge options and a
 * checkmark on the current status — but keeps the trigger neutral so it reads as
 * one more row action rather than a loud status pill.
 */
export function JiraForYouStatusLozengeDropdown({
	value,
}: Readonly<{
	value: JiraForYouStatus;
}>) {
	const [selected, setSelected] = useState<JiraForYouStatus>(value);

	useEffect(() => {
		setSelected(value);
	}, [value]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<LozengeDropdownTrigger
						aria-label={`Change status. Current status: ${selected}`}
						maxWidth="160px"
						onClick={(event) => event.stopPropagation()}
						size="compact"
						variant="neutral"
					/>
				}
			>
				{selected}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56"
				positionerClassName="z-[502]"
				sideOffset={6}
			>
				{STATUS_ORDER.map((option) => (
					<DropdownMenuItem
						key={option}
						onSelect={() => setSelected(option)}
						selected={option === selected}
					>
						<Lozenge variant={STATUS_VARIANTS[option]}>{option}</Lozenge>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

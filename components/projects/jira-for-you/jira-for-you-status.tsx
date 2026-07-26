"use client";

import { useState } from "react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";

import type { JiraForYouStatus } from "./jira-for-you-types";

const STATUS_VARIANTS: Record<
	JiraForYouStatus,
	NonNullable<LozengeProps["variant"]>
> = {
	Review: "warning",
	"In progress": "information",
	"In review": "information",
	"To do": "neutral",
	Done: "success",
};

const STATUS_ORDER: readonly JiraForYouStatus[] = [
	"To do",
	"In progress",
	"In review",
	"Review",
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
 * Interactive counterpart to {@link JiraForYouStatusLozenge}: a standard VPK
 * outline dropdown button for changing the item's Jira workflow status, revealed
 * with the other row actions on hover. It reuses the compact `Button` (matching
 * the sibling "View" button's 24px height + outline style) so the action cluster
 * lines up, while the menu mirrors the agent-session status dropdown —
 * colored lozenge options with a checkmark on the current status.
 */
export function JiraForYouStatusLozengeDropdown({
	value,
}: Readonly<{
	value: JiraForYouStatus;
}>) {
	return <JiraForYouStatusLozengeDropdownContent initialValue={value} key={value} />;
}

function JiraForYouStatusLozengeDropdownContent({
	initialValue,
}: Readonly<{
	initialValue: JiraForYouStatus;
}>) {
	const [selected, setSelected] = useState<JiraForYouStatus>(initialValue);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`Change status. Current status: ${selected}`}
						className="max-w-40 gap-1"
						onClick={(event) => event.stopPropagation()}
						size="compact"
						variant="outline"
					/>
				}
			>
				<span className="truncate">{selected}</span>
				<ChevronDownIcon label="" size="small" />
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

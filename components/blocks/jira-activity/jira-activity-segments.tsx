import * as React from "react";

import ArrowRightIcon from "@atlaskit/icon/core/arrow-right";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";

import { Icon } from "@/components/ui/icon";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import { Tag, type TagColor } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

import type { JiraActivitySegment } from "./jira-activity-types";

const CHIP_BASE = "rounded-xs px-1 font-mono text-[0.8125rem] leading-5 align-middle";
const LABEL_LOZENGE_VARIANT: Partial<Record<
	TagColor,
	NonNullable<LozengeProps["variant"]>
>> = {
	red: "danger",
	green: "success",
	blue: "information",
	yellow: "warning",
	purple: "discovery",
	teal: "accent-teal",
	orange: "accent-orange",
	lime: "accent-lime",
	gray: "neutral",
};

function SegmentContent({ segment }: Readonly<{ segment: JiraActivitySegment }>) {
	switch (segment.type) {
		case "text":
			return segment.text;
		case "code":
			return (
				<code className={cn(CHIP_BASE, "bg-bg-neutral text-text")}>{segment.text}</code>
			);
		case "link":
			return (
				<a
					className={cn(
						CHIP_BASE,
						"bg-bg-accent-blue-subtler text-text-accent-blue no-underline hover:underline",
						"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
					)}
					href={segment.href ?? "#"}
				>
					{segment.text}
				</a>
			);
		case "lozenge":
			return (
				<Lozenge className="align-middle" variant={segment.variant ?? "neutral"}>
					{segment.text}
				</Lozenge>
			);
		case "label":
			return (
				<Lozenge
					className="align-middle"
					variant={LABEL_LOZENGE_VARIANT[segment.color] ?? "neutral"}
				>
					{segment.text}
				</Lozenge>
			);
		case "tag":
			return (
				<Tag className="align-middle" color={segment.color ?? "gray"}>
					{segment.text}
				</Tag>
			);
		case "transition-arrow":
			return (
				<Icon
					aria-hidden
					className="mx-1 align-middle text-icon-subtle"
					render={<ArrowRightIcon color="currentColor" label="" size="small" />}
				/>
			);
		case "priority":
			return (
				<span className="inline-flex items-center gap-1 align-middle">
					<Icon
						aria-hidden
						className="text-icon-warning"
						render={<PriorityMediumIcon color="currentColor" label="" size="small" />}
					/>
					<span>{segment.text}</span>
				</span>
			);
	}
}

/**
 * Renders a run of rich inline segments (shared by event lines and comment
 * bodies). Segments carry their own whitespace, so no separators are inserted —
 * this lets punctuation hug a chip (`…in ThreadedComments.tsx:`) while words get
 * spaced (`added Bug and UI polish`).
 */
export function JiraActivitySegments({
	segments,
	className,
}: Readonly<{ segments: readonly JiraActivitySegment[]; className?: string }>) {
	return (
		<span className={className}>
			{segments.map((segment, index) => (
				<React.Fragment
					key={`${segment.type}:${"text" in segment ? segment.text : index}:${index}`}
				>
					<SegmentContent segment={segment} />
				</React.Fragment>
			))}
		</span>
	);
}

import * as React from "react";

import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

import type { JiraActivitySegment } from "./jira-activity-types";

// Decorative dot fills for colored inline labels (e.g. •Bug, •UI polish).
// Decorative accent classes are allowed here per `.agents/rules/token-priority.md`.
const LABEL_DOT_CLASS: Record<string, string> = {
	red: "bg-red-500",
	green: "bg-green-500",
	blue: "bg-blue-500",
	yellow: "bg-yellow-500",
	purple: "bg-purple-500",
	teal: "bg-teal-500",
	orange: "bg-orange-500",
	lime: "bg-lime-500",
	gray: "bg-neutral-500",
};

const CHIP_BASE = "rounded-xs px-1 font-mono text-[0.8125rem] leading-5 align-middle";

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
		case "label":
			return (
				<span className="inline-flex items-center gap-1 align-middle">
					<span
						aria-hidden="true"
						className={cn(
							"size-1.5 shrink-0 rounded-full",
							LABEL_DOT_CLASS[segment.color] ?? LABEL_DOT_CLASS.gray,
						)}
					/>
					{segment.text}
				</span>
			);
		case "tag":
			return (
				<Tag className="align-middle" color={segment.color ?? "gray"}>
					{segment.text}
				</Tag>
			);
	}
}

/**
 * Renders a run of rich inline segments (shared by event lines and comment
 * bodies). Segments carry their own whitespace, so no separators are inserted —
 * this lets punctuation hug a chip (`…in ThreadedComments.tsx:`) while words get
 * spaced (`added •Bug and •UI polish`).
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

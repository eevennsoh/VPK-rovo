"use client";

import type { ComponentProps, CSSProperties } from "react";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import TaskIcon from "@atlaskit/icon/core/task";

import { useIsMounted } from "@/components/hooks/use-is-mounted";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	AvatarUnassigned,
	type AvatarProps,
	type AvatarUnassignedKind,
} from "@/components/ui/avatar";
import { Tag, TagGroup, type TagColor } from "@/components/ui/tag";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export type JiraIssuePriority = "major" | "medium" | "minor";

export interface JiraIssueTag {
	text: string;
	color: TagColor;
}

export interface JiraIssueProps extends Omit<ComponentProps<"button">, "children"> {
	/** Issue summary shown as the primary card text. */
	summary: string;
	/** Jira issue key, e.g. RFP-101. */
	issueKey: string;
	tags?: readonly JiraIssueTag[];
	priority?: JiraIssuePriority;
	issueTypeLabel?: string;
	assigneeAvatarSrc?: string;
	assigneeAvatarLabel?: string;
	assigneeAvatarShape?: NonNullable<AvatarProps["shape"]>;
	assigneeUnassignedKind?: AvatarUnassignedKind;
	assigneePulse?: boolean;
	selected?: boolean;
	dragging?: boolean;
}

const PRIORITY_ICONS = {
	major: PriorityMajorIcon,
	medium: PriorityMediumIcon,
	minor: PriorityMinorIcon,
} as const;

const PRIORITY_COLORS = {
	major: token("color.icon.danger"),
	medium: token("color.icon.information"),
	minor: token("color.icon.success"),
} as const;

function getIssueInitial(issueKey: string): string {
	return issueKey[0]?.toUpperCase() ?? "U";
}

export function JiraIssue({
	"aria-pressed": ariaPressed,
	assigneeAvatarLabel,
	assigneeAvatarShape = "circle",
	assigneeAvatarSrc,
	assigneePulse = false,
	assigneeUnassignedKind,
	className,
	dragging = false,
	draggable = true,
	issueKey,
	issueTypeLabel = "Task",
	priority = "major",
	selected = false,
	style,
	summary,
	tags,
	type = "button",
	...props
}: Readonly<JiraIssueProps>) {
	const isMounted = useIsMounted();
	const PriorityIcon = PRIORITY_ICONS[priority];
	const priorityColor = PRIORITY_COLORS[priority];
	const rootStyle: CSSProperties = {
		borderRadius: token("radius.small"),
		boxShadow: token("elevation.shadow.raised"),
		cursor: dragging ? "grabbing" : draggable ? "grab" : "default",
		opacity: dragging ? 0.5 : 1,
		padding: token("space.150"),
		textAlign: "left",
		width: "100%",
		...style,
	};

	return (
		<button
			type={type}
			draggable={draggable}
			aria-pressed={ariaPressed ?? selected}
			className={cn(
				"relative border outline-none focus-visible:border-ring",
				selected
					? "border-border-selected bg-bg-selected"
					: "border-transparent bg-surface hover:bg-bg-neutral-subtle-hovered",
				"transition-[opacity,transform,background-color,border-color] duration-normal ease-out",
				"data-starting-style:opacity-0 data-starting-style:-translate-y-1",
				className,
			)}
			data-dragging={dragging || undefined}
			data-selected={selected || undefined}
			style={rootStyle}
			{...props}
		>
			<div className="flex flex-col gap-2">
				<span className="text-sm">{summary}</span>

				{tags && tags.length > 0 ? (
					<TagGroup className="gap-1">
						{tags.map((tag, index) => (
							<Tag key={`${tag.text}-${index}`} color={tag.color}>
								{tag.text}
							</Tag>
						))}
					</TagGroup>
				) : null}

				<div className="pt-0.5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<TaskIcon label={issueTypeLabel} color={token("color.icon.brand")} />
							<span className="text-xs font-semibold text-text-subtlest">{issueKey}</span>
						</div>

						<div className="flex items-center gap-1.5">
							<PriorityIcon label={`${priority} priority`} color={priorityColor} />
							{isMounted ? (
								assigneeUnassignedKind ? (
									<AvatarUnassigned
										className={cn(
											assigneePulse && "motion-safe:animate-pulse ring-2 ring-border-focused ring-offset-2 ring-offset-surface",
										)}
										kind={assigneeUnassignedKind}
										size="sm"
									/>
								) : (
									<Avatar
										className={cn(
											assigneePulse && "motion-safe:animate-pulse ring-2 ring-border-focused ring-offset-2 ring-offset-surface",
										)}
										label={assigneeAvatarLabel ?? issueKey}
										shape={assigneeAvatarShape}
										size="sm"
									>
										{assigneeAvatarSrc ? <AvatarImage src={assigneeAvatarSrc} alt="" /> : null}
										<AvatarFallback>{getIssueInitial(issueKey)}</AvatarFallback>
									</Avatar>
								)
							) : null}
						</div>
					</div>
				</div>
			</div>
		</button>
	);
}

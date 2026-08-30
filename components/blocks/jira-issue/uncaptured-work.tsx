"use client";

import type { JiraIssueUncapturedWorkProps } from "@/components/blocks/jira-issue";
import { UncapturedWorkChin } from "@/components/blocks/jira-issue/uncaptured-work-chin";
import { SmartLink, type SmartLinkItem } from "@/components/blocks/smart-link";
import { renderVisual } from "@/components/blocks/smart-link/components/smart-link-visuals";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((part) => part.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

const SOURCE_LINK_CLASS_NAME = "h-auto! max-w-full self-center gap-1 rounded-sm border-0! bg-transparent px-0! py-0 text-xs leading-4 text-text-subtle hover:bg-transparent hover:text-text-subtle hover:underline";

/**
 * Type-icon tint for SmartLink's front-slot visual. Pull requests reuse Jira
 * issue chrome (lime open, purple merged, danger failed); branch and commit
 * stay subtle. Scoped to the trigger's first child so chip status tones
 * (success/discovery) are not changed globally.
 */
function uncapturedSourceIconClassName(sourceLink: SmartLinkItem): string {
	if (sourceLink.variant !== "pull-request") {
		return "[&>span:first-child>*]:text-icon-subtle";
	}
	if (sourceLink.status?.variant === "danger") {
		return "[&>span:first-child>*]:text-icon-danger";
	}
	if (sourceLink.status?.variant === "discovery") {
		return "[&>span:first-child>*]:text-icon-accent-purple";
	}
	return "[&>span:first-child>*]:text-icon-accent-lime";
}

function UncapturedWorkSource({
	sourceLink,
}: Readonly<{
	sourceLink: JiraIssueUncapturedWorkProps["sourceLink"];
}>) {
	return (
		<div className="flex h-5 min-w-0 items-center gap-1.5 text-xs leading-4 text-text-subtle">
			<span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center">
				{sourceLink.provider.logo ? renderVisual(sourceLink.provider.logo, "footer") : null}
			</span>
			<span className="shrink-0">{sourceLink.provider.name}</span>
			<span aria-hidden="true">·</span>
			<SmartLink
				className={cn(SOURCE_LINK_CLASS_NAME, uncapturedSourceIconClassName(sourceLink))}
				item={sourceLink}
			/>
		</div>
	);
}

export function JiraIssueUncapturedWork({
	captured = false,
	className,
	onCreateWorkItem,
	onLinkWorkItem,
	onSubtasks,
	participants,
	sourceLink,
	style,
	suggestedWorkItemKey,
	suggestedWorkItemKeys,
	summary,
	variant,
	...props
}: Readonly<JiraIssueUncapturedWorkProps>) {
	const hasWorkItemActions = onCreateWorkItem !== undefined || onLinkWorkItem !== undefined;
	// Subtasks counts too: a consumer that wires only that handler still needs
	// the chin, or its control would be unreachable.
	const showChin = captured || hasWorkItemActions || onSubtasks !== undefined;

	return (
		<article
			{...props}
			className={cn(
				"group/uncaptured-work flex w-full flex-col overflow-hidden rounded-lg border border-dashed border-border-disabled bg-surface text-left",
				className,
			)}
			data-captured={captured || undefined}
			data-variant={variant}
			style={style}
		>
			<div className="flex flex-col gap-2 bg-surface-sunken p-3">
				<p className="line-clamp-2 text-sm leading-5">{summary}</p>
				<div className="flex items-center justify-between gap-2">
					<UncapturedWorkSource sourceLink={sourceLink} />
					<AvatarGroup className="shrink-0" label={`Involved: ${participants.map((participant) => participant.name).join(", ")}`}>
						{participants.map((participant) => (
							<Avatar
								key={participant.id}
								label={participant.name}
								shape={participant.avatarShape}
								size="xs"
							>
								<AvatarImage alt="" src={participant.avatarSrc} />
								<AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
							</Avatar>
						))}
					</AvatarGroup>
				</div>
			</div>
			{showChin ? (
				<UncapturedWorkChin
					captured={captured}
					createUnavailable={onCreateWorkItem === undefined}
					linkUnavailable={onLinkWorkItem === undefined}
					onCreateWorkItem={onCreateWorkItem}
					onLinkWorkItem={onLinkWorkItem}
					onSubtasks={onSubtasks}
					suggestedWorkItemKey={suggestedWorkItemKey}
					suggestedWorkItemKeys={suggestedWorkItemKeys}
					summary={summary}
				/>
			) : null}
			<p aria-live="polite" className="sr-only" role="status">
				{captured ? `${summary} captured.` : ""}
			</p>
		</article>
	);
}

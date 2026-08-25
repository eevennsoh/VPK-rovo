"use client";

import CheckMarkIcon from "@atlaskit/icon/core/check-mark";

import type { JiraIssueUncapturedWorkProps } from "@/components/blocks/jira-issue";
import { SmartLink } from "@/components/blocks/smart-link";
import { renderVisual } from "@/components/blocks/smart-link/components/smart-link-visuals";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((part) => part.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export function JiraIssueUncapturedWork({
	captured = false,
	className,
	onCreateWorkItem,
	participants,
	sourceLink,
	style,
	summary,
	variant,
	...props
}: Readonly<JiraIssueUncapturedWorkProps>) {
	const actionUnavailable = onCreateWorkItem === undefined;
	const actionLabel = captured
		? `${summary} captured`
		: actionUnavailable
			? `Create work item for ${summary} unavailable`
			: `Create work item for ${summary}`;

	return (
		<article
			{...props}
			className={cn(
				"flex w-full flex-col gap-2 rounded-lg border border-dashed border-border-disabled bg-surface p-3 text-left",
				className,
			)}
			data-captured={captured || undefined}
			data-variant={variant}
			style={style}
		>
			<p className="line-clamp-2 min-h-10 text-sm leading-5">{summary}</p>
			<div className="flex min-h-5 min-w-0 items-center gap-1.5 text-xs leading-4 text-text-subtle">
				<div className="flex shrink-0 items-center gap-1">
					{sourceLink.provider.logo ? renderVisual(sourceLink.provider.logo, "footer") : null}
					<span>{sourceLink.provider.name}</span>
				</div>
				<span aria-hidden="true">·</span>
				<SmartLink
					className="h-auto! max-w-full gap-0 rounded-sm border-0! bg-transparent px-0! py-0 text-xs leading-4 text-text-subtle hover:bg-transparent hover:text-text-subtle hover:underline [&>span:first-child]:hidden"
					item={sourceLink}
				/>
			</div>
			<div className="pt-0.5">
				<div className="flex items-center justify-between">
					<Button
						aria-disabled={captured || actionUnavailable}
						aria-label={actionLabel}
						className={cn(
							"justify-start",
							captured
								? "border-transparent bg-transparent text-text-success [&_svg]:text-icon-success hover:bg-transparent active:bg-transparent"
								: null,
							actionUnavailable ? "cursor-not-allowed opacity-(--opacity-disabled)" : null,
						)}
						onClick={() => {
							if (captured || actionUnavailable) return;
							onCreateWorkItem();
						}}
						size="compact"
						variant="outline"
					>
						{captured ? <Icon aria-hidden render={<CheckMarkIcon label="" />} /> : null}
						{captured ? "Captured" : "Create work item"}
					</Button>
					<AvatarGroup className="ml-auto" label={`Involved: ${participants.map((participant) => participant.name).join(", ")}`}>
						{participants.map((participant) => (
							<Avatar
								key={participant.id}
								label={participant.name}
								shape={participant.avatarShape}
								size="sm"
							>
								<AvatarImage alt="" src={participant.avatarSrc} />
								<AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
							</Avatar>
						))}
					</AvatarGroup>
				</div>
			</div>
			<p aria-live="polite" className="sr-only" role="status">
				{captured ? `${summary} captured.` : ""}
			</p>
		</article>
	);
}

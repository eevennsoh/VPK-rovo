"use client";

import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import type { JiraIssueUncapturedWorkProps } from "@/components/blocks/jira-issue";
import { SmartLink } from "@/components/blocks/smart-link";
import { renderVisual } from "@/components/blocks/smart-link/components/smart-link-visuals";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface JiraIssueUncapturedWorkResumeProps extends JiraIssueUncapturedWorkProps {
	/** Resumes a local agent session represented by this uncaptured work. */
	onResumeAgentSession?: () => void;
}

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
	onLinkWorkItem,
	onResumeAgentSession,
	participants,
	sourceLink,
	style,
	summary,
	variant,
	...props
}: Readonly<JiraIssueUncapturedWorkResumeProps>) {
	const createUnavailable = onCreateWorkItem === undefined;
	const linkUnavailable = onLinkWorkItem === undefined;
	const createLabel = captured
		? `${summary} captured`
		: createUnavailable
			? `Create work item for ${summary} unavailable`
			: `Create work item for ${summary}`;

	return (
		<article
			{...props}
			className={cn(
				"group/uncaptured-work flex w-full flex-col gap-2 rounded-lg border border-dashed border-border-disabled bg-surface p-3 text-left",
				className,
			)}
			data-captured={captured || undefined}
			data-variant={variant}
			style={style}
		>
			<p className="line-clamp-2 text-sm leading-5">{summary}</p>
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
			<div className="flex items-center justify-between">
				{onResumeAgentSession === undefined ? (
					captured ? (
						<Button
							aria-disabled
							aria-label={createLabel}
							className="justify-start border-transparent bg-transparent text-text-success [&_svg]:text-icon-success hover:bg-transparent active:bg-transparent"
							size="compact"
							variant="outline"
						>
							<Icon aria-hidden render={<CheckMarkIcon label="" />} />
							Captured
						</Button>
					) : (
						<ButtonGroup aria-label={`Work item actions for ${summary}`} variant="split">
							<Button
								aria-disabled={createUnavailable}
								aria-label={createLabel}
								className={cn("justify-start", createUnavailable ? "cursor-not-allowed opacity-(--opacity-disabled)" : null)}
								onClick={() => {
									onCreateWorkItem?.();
								}}
								size="compact"
								variant="outline"
							>
								Create work item
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											aria-label={`More work item actions for ${summary}`}
											size="icon-compact"
											type="button"
											variant="outline"
										/>
									}
								>
									<Icon aria-hidden render={<ChevronDownIcon label="" size="small" />} />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="start" side="bottom">
									<DropdownMenuItem
										disabled={linkUnavailable}
										onSelect={() => {
											onLinkWorkItem?.();
										}}
									>
										Link work item
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</ButtonGroup>
					)
				) : (
					<Button
						aria-label={`Resume agent session for ${summary}`}
						className="pointer-events-none opacity-0 transition-opacity duration-xxshort ease-out-practical motion-reduce:transition-none group-hover/uncaptured-work:pointer-events-auto group-hover/uncaptured-work:opacity-100 group-focus-within/uncaptured-work:pointer-events-auto group-focus-within/uncaptured-work:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:ring-3"
						onClick={onResumeAgentSession}
						size="compact"
						variant="outline"
					>
						Resume
					</Button>
				)}
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
			<p aria-live="polite" className="sr-only" role="status">
				{captured ? `${summary} captured.` : ""}
			</p>
		</article>
	);
}

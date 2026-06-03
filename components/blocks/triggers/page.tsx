"use client";

import AddIcon from "@atlaskit/icon/core/add";
import AutomationIcon from "@atlaskit/icon/core/automation";
import DeleteIcon from "@atlaskit/icon/core/delete";
import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const DEFAULT_TRIGGER_PROMPT = [
	"When a ticket enters Drafting, inspect the RFP packet, customer context, and required response sections.",
	"Draft the first-pass response package, flag blockers or missing inputs, attach the draft to the ticket, and move ready tickets to Review.",
].join(" ");

function TriggerAddRow({
	className,
	label = "Add Trigger",
}: Readonly<{
	className?: string;
	label?: string;
}>): React.ReactElement {
	return (
		<div
			className={cn(
				"grid h-8 w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-3 rounded-lg px-2 text-left text-sm text-text-subtle transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered",
				className,
			)}
		>
			<span className="flex size-6 shrink-0 items-center justify-center justify-self-center text-icon-subtle">
				<AddIcon label="" size="small" />
			</span>
			<span className="text-sm font-medium">{label}</span>
		</div>
	);
}

function TriggerDropdown({
	avatarSrc,
	showProjectAvatar = false,
	value,
}: Readonly<{
	avatarSrc?: string;
	showProjectAvatar?: boolean;
	value: string;
}>): React.ReactElement {
	const labelContent =
		showProjectAvatar && avatarSrc ? (
			<span className="flex min-w-0 items-center gap-1">
				<Image
					src={avatarSrc}
					alt=""
					width={12}
					height={12}
					className="size-3 shrink-0 rounded-[2px]"
				/>
				<span className="min-w-0 truncate">{value}</span>
			</span>
		) : (
			value
		);

	return (
		<Select defaultValue={value}>
			<SelectTrigger
				aria-label={value}
				className="!h-6 gap-0 rounded-md !py-0 !pr-0 !pl-2 text-sm font-medium text-text-subtle [&_[data-slot=icon]]:size-6"
				size="sm"
			>
				<SelectValue>{labelContent}</SelectValue>
			</SelectTrigger>
			<SelectContent align="start" alignItemWithTrigger={false} className="min-w-0">
				<SelectItem value={value}>{labelContent}</SelectItem>
			</SelectContent>
		</Select>
	);
}

export interface TriggersProps {
	/** When false, only the "Add Trigger" affordance is shown (empty state). */
	hasTrigger?: boolean;
	/** Status/column the trigger watches, e.g. "Drafting". */
	statusLabel?: string;
	/** Board the trigger is scoped to, e.g. "Enterprise RFP Response". */
	boardLabel?: string;
	/** Project avatar shown beside the board name. Omit to hide the avatar. */
	boardAvatarSrc?: string;
	/** Natural-language prompt run when the trigger fires. */
	prompt?: string;
	/** Label for the add-trigger affordance. */
	addTriggerLabel?: string;
	/** Invoked when the trigger's delete button is pressed. */
	onClearTrigger?: () => void;
	className?: string;
}

/**
 * Triggers — an event-trigger editor card. Renders an automation trigger row
 * ("Status changed to <status> in <board>") with its prompt and a delete
 * control, followed by an affordance to add another trigger. When `hasTrigger`
 * is false, only the add affordance is shown.
 */
export default function Triggers({
	hasTrigger = true,
	statusLabel = "Drafting",
	boardLabel = "Enterprise RFP Response",
	boardAvatarSrc = "/avatar-project/rocket.svg",
	prompt = DEFAULT_TRIGGER_PROMPT,
	addTriggerLabel = "Add Trigger",
	onClearTrigger,
	className,
}: Readonly<TriggersProps>): React.ReactElement {
	const addTriggerControl = <TriggerAddRow label={addTriggerLabel} />;

	return (
		<div className={cn("grid gap-5", className)}>
			<section className="grid gap-2">
				<div className="rounded-xl border border-border bg-surface p-2">
					{hasTrigger ? (
						<>
							<div className="group/trigger-row grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 rounded-lg px-2 py-2 transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered">
								<div className="flex flex-col items-center" aria-hidden={true}>
									<IconTile
										aria-hidden={true}
										icon={<AutomationIcon label="" size="small" />}
										label="Automation"
										size="small"
										variant="blue"
									/>
									<div className="my-2 h-7 w-px bg-border" />
									<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-bg-neutral text-icon-subtle">
										<GenerativeIndicatorIcon label="" size="small" />
									</span>
								</div>
								<div className="grid min-w-0 gap-4">
									<div className="flex min-h-6 items-start gap-2">
										<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm text-text">
											<span>Status changed to</span>
											<TriggerDropdown value={statusLabel} />
											<span className="font-medium">in</span>
											<TriggerDropdown
												showProjectAvatar
												avatarSrc={boardAvatarSrc}
												value={boardLabel}
											/>
										</div>
										<Button
											aria-label="Delete trigger"
											className="self-start opacity-0 transition-opacity duration-normal group-hover/trigger-row:opacity-100 focus-visible:opacity-100"
											onClick={onClearTrigger}
											size="icon"
											variant="ghost"
										>
											<DeleteIcon label="" size="small" />
										</Button>
									</div>
									<p className="min-w-0 flex-1 text-sm leading-5 text-text">{prompt}</p>
								</div>
							</div>
							<Separator className="my-2" />
							{addTriggerControl}
						</>
					) : (
						addTriggerControl
					)}
				</div>
			</section>
		</div>
	);
}

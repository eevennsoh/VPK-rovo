"use client";

import { type CSSProperties, type ReactNode } from "react";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Icon } from "@/components/ui/icon";
import Heading from "@/components/ui/heading";

import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";
import AddIcon from "@atlaskit/icon/core/add";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import CrossIcon from "@atlaskit/icon/core/cross";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import EpicIcon from "@atlaskit/icon/core/epic";
import LockUnlockedIcon from "@atlaskit/icon/core/lock-unlocked";
import ShareIcon from "@atlaskit/icon/core/share";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import TaskIcon from "@atlaskit/icon/core/task";

export function ModalHeader({
	showClose = true,
	actions,
	actionsClassName,
	closeButtonDisabled = false,
	closeButtonVariant = "outline",
	paddingTop,
	paddingBottom,
}: Readonly<{
	showClose?: boolean;
	actions?: ReactNode;
	actionsClassName?: string;
	closeButtonDisabled?: boolean;
	closeButtonVariant?: ButtonProps["variant"];
	paddingTop?: CSSProperties["paddingTop"];
	paddingBottom?: CSSProperties["paddingBottom"];
}>) {
	const { meta } = useWorkItemModal();
	const { workItem } = meta;

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "minmax(0, 1fr) max-content",
				columnGap: token("space.200"),
				alignItems: "center",
				minWidth: 0,
				paddingBlock: token("space.300"),
				paddingTop: paddingTop ?? token("space.300"),
				paddingBottom: paddingBottom ?? token("space.300"),
				paddingInline: token("space.300"),
				backgroundColor: token("elevation.surface.overlay"),
			}}
		>
			<Breadcrumb className="min-w-0 overflow-visible" size="small">
				<BreadcrumbList className="-m-1 min-w-0 flex-nowrap overflow-hidden p-1">
					<BreadcrumbItem className="min-w-0 max-w-[240px] shrink">
						<BreadcrumbLink
							className="[&_[data-slot=breadcrumb-label-text]]:truncate"
							href="#"
							before={
								<Icon
									aria-hidden
									className="text-icon-accent-purple"
									render={<EpicIcon color="currentColor" label="" />}
								/>
							}
						>
							{workItem.parent?.title ?? "Enterprise RFP Response"}
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator className="shrink-0" />
					<BreadcrumbItem className="min-w-0 flex-1">
						<BreadcrumbPage
							className="text-text-subtlest inline-flex min-w-0 items-center [&_[data-slot=breadcrumb-label-text]]:truncate"
							before={
								<Icon
									aria-hidden
									className="text-icon-brand"
									render={<TaskIcon label="" size="small" />}
								/>
							}
						>
							{workItem.title}
						</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className={cn("flex shrink-0 items-center gap-2", actionsClassName)}>
				{actions ?? (
					<>
						<Button aria-label="No restrictions" size="icon" variant="outline">
							<LockUnlockedIcon label="" />
						</Button>
						<Button className="gap-2" variant="outline">
							<EyeOpenIcon label="" />
							1
						</Button>
						<Button aria-label="Share" size="icon" variant="outline">
							<ShareIcon label="" />
						</Button>
						<Button aria-label="Actions" size="icon" variant="outline">
							<ShowMoreHorizontalIcon label="" />
						</Button>
					</>
				)}
				{showClose ? (
					<Button
						aria-disabled={closeButtonDisabled || undefined}
						aria-label="Close"
						size="icon"
						variant={closeButtonVariant}
						onClick={closeButtonDisabled ? undefined : meta.onClose}
					>
						<CrossIcon label="" />
					</Button>
				) : null}
			</div>
		</div>
	);
}

export function ModalTitle() {
	const { meta } = useWorkItemModal();

	return (
		<div className="grid gap-2">
			<Heading size="large" style={{ paddingBlock: token("space.025") }}>
				{meta.workItem.title}
			</Heading>
			<div className="flex flex-wrap gap-2">
				<Button aria-label="Add" size="icon" variant="outline">
					<AddIcon label="" />
				</Button>
				<Button aria-label="AI summary" size="icon" variant="outline">
					<AiGenerativeTextSummaryIcon label="" />
				</Button>
			</div>
		</div>
	);
}

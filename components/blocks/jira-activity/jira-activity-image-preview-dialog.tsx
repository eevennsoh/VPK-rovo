"use client";

import Image from "next/image";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import type { JiraActivityImageAttachment } from "./jira-activity-types";

interface JiraActivityImagePreviewDialogProps {
	attachment: JiraActivityImageAttachment | null;
	onOpenChange: (open: boolean) => void;
}

export function JiraActivityImagePreviewDialog({
	attachment,
	onOpenChange,
}: Readonly<JiraActivityImagePreviewDialogProps>) {
	return (
		<Dialog open={attachment !== null} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-6xl [grid-template-rows:auto_minmax(0,1fr)]"
				size="xl"
			>
				<DialogHeader className="px-4 py-4 sm:px-6">
					<DialogTitle className="pr-10">
						{attachment?.filename ?? "Image preview"}
					</DialogTitle>
					<DialogDescription>Image preview</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 p-4 pt-0 sm:p-6 sm:pt-0">
					<div className="relative h-[72vh] min-h-80 overflow-hidden rounded-lg border border-border bg-surface-sunken">
						{attachment ? (
							<Image
								alt={attachment.alt}
								className="object-contain"
								fill
								priority
								sizes="(min-width: 640px) min(1152px, calc(100vw - 64px)), calc(100vw - 64px)"
								src={attachment.src}
							/>
						) : null}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

"use client";

import { type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { ModalHeader } from "@/components/projects/jira/components/work-item-modal/modal-header";
import { ExperimentalBreadcrumbActions } from "@/components/blocks/agent-sessions/experimental/components/experimental-breadcrumb-actions";
import { ContextTitleBar } from "@/components/blocks/agent-sessions/experimental/components/context-title-bar";

interface ExperimentalWorkItemDialogProps {
	open: boolean;
	onClose: () => void;
	presentation: "modal" | "inline";
	workItemCode: string;
	workItemTitle: string;
	children: ReactNode;
}

/**
 * Accessible dialog shell for the experimental Agent Sessions work item.
 *
 * Composes low-level Base UI Dialog primitives (Root/Portal/Backdrop/Popup/
 * Title/Description) so it can mirror the standard work-item modal geometry
 * (full-bleed, centered, 1200px cap) while keeping Base UI's built-in
 * role=dialog, aria-modal, focus containment, focus restoration, and
 * Escape-to-close. The visible header reuses the standard `ModalHeader` (via the
 * surrounding `WorkItemModalProvider`) so the breadcrumb + actions match the
 * default work item view exactly; the accessible name is supplied by the sr-only
 * Dialog.Title/Description.
 */
export function ExperimentalWorkItemDialog({
	open,
	onClose,
	presentation,
	workItemCode,
	workItemTitle,
	children,
}: Readonly<ExperimentalWorkItemDialogProps>) {
	const description = `Details, agent sessions, and activity for work item ${workItemCode}.`;
	const content = (
		<>
			<ModalHeader
				actions={<ExperimentalBreadcrumbActions />}
				actionsClassName="gap-1"
				closeButtonVariant="ghost"
				showClose={presentation !== "inline"}
			/>
			<ContextTitleBar />

			<div style={{ minHeight: 0, minWidth: 0, display: "grid", overflow: "hidden" }}>
				{children}
			</div>
		</>
	);
	const surfaceStyle = {
		backgroundColor: token("elevation.surface.overlay"),
		borderRadius: token("radius.xlarge"),
		boxShadow: token("elevation.shadow.overlay"),
		display: "grid",
		gridTemplateRows: "auto auto minmax(0, 1fr)",
		overflow: "hidden",
	} as const;

	if (presentation === "inline") {
		// Fill the full stage height (like the Kanban board) so the card is flush
		// top AND bottom — its lower edge flows under the gallery dock. Only the
		// horizontal 24px inset remains, mirroring the board's px-8.
		return (
			<section
				aria-label={workItemTitle}
				className="h-full w-[calc(100%-24px)] max-w-[1200px] outline-none"
				style={surfaceStyle}
			>
				{content}
				<p className="sr-only">{description}</p>
			</section>
		);
	}

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose();
				}
			}}
			modal
		>
			<Dialog.Portal keepMounted>
				<Dialog.Backdrop className="bg-blanket fixed inset-0 z-[500] transition-[opacity] duration-slow ease-out motion-reduce:transition-none data-ending-style:duration-medium data-ending-style:ease-in data-starting-style:opacity-0 data-ending-style:opacity-0" />
				<Dialog.Popup
					className={cn(
						"fixed top-1/2 left-1/2 z-[501] origin-center -translate-x-1/2 -translate-y-1/2 outline-none",
						"h-[calc(100dvh-24px)] max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[1200px]",
						"sm:h-[calc(100vh-120px)] sm:max-h-[calc(100vh-120px)] sm:w-[calc(100vw-120px)]",
						"transition-[opacity,scale] duration-slow ease-in-out motion-reduce:transition-none",
						"data-ending-style:duration-medium data-ending-style:ease-in",
						"data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
					)}
					style={surfaceStyle}
				>
					{content}

					<Dialog.Title className="sr-only">{workItemTitle}</Dialog.Title>
					<Dialog.Description className="sr-only">{description}</Dialog.Description>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

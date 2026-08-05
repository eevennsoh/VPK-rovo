"use client";

import { type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { ModalHeader } from "@/components/projects/jira/components/work-item-modal/modal-header";
import { ExperimentalBreadcrumbActions } from "@/components/blocks/jira-work-item/experimental-v2/components/experimental-breadcrumb-actions";

interface ExperimentalWorkItemDialogProps {
	inlineSurface: "card" | "fill";
	open: boolean;
	onClose: () => void;
	presentation: "modal" | "inline";
	workItemCode: string;
	workItemTitle: string;
	children: ReactNode;
	blanketContent?: ReactNode;
	sidebar: ReactNode;
	sidebarOpen: boolean;
}

/**
 * Accessible dialog shell for the experimental Jira Work Item work item.
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
	inlineSurface,
	open,
	onClose,
	presentation,
	workItemCode,
	workItemTitle,
	children,
	blanketContent,
	sidebar,
	sidebarOpen,
}: Readonly<ExperimentalWorkItemDialogProps>) {
	const description = `Details, agent sessions, and activity for work item ${workItemCode}.`;
	const fillsInlineContainer = presentation === "inline" && inlineSurface === "fill";
	const content = (
		<div className="@container/workitemdialog relative grid h-full min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden">
			<div
				className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]"
				data-jira-work-item-main-column
			>
				<div
					className={cn(
						"transition-[margin-right] duration-medium ease-in-out motion-reduce:transition-none",
						sidebarOpen
							? "@[860px]/workitemdialog:mr-[clamp(320px,34vw,408px)]"
							: null,
					)}
					data-jira-work-item-header-column
				>
					<ModalHeader
						actions={<ExperimentalBreadcrumbActions />}
						actionsClassName="gap-1"
						closeButtonDisabled={presentation === "inline"}
						closeButtonVariant="ghost"
						paddingBottom={0}
						paddingTop={token("space.150")}
					/>
				</div>
				<div style={{ minHeight: 0, minWidth: 0, display: "grid", overflow: "hidden" }}>
					{children}
				</div>
			</div>
			<div
				aria-hidden={!sidebarOpen}
				className={cn(
					"absolute inset-y-0 right-0 z-30 w-full translate-x-full overflow-hidden transition-transform duration-medium ease-in-out will-change-transform motion-reduce:transition-none @[860px]/workitemdialog:w-[clamp(320px,34vw,408px)]",
					sidebarOpen ? "translate-x-0" : "pointer-events-none",
				)}
				data-jira-work-item-chat-column
				inert={sidebarOpen ? undefined : true}
			>
				{sidebar}
			</div>
		</div>
	);
	const surfaceStyle = {
		backgroundColor: token("elevation.surface.overlay"),
		borderRadius: fillsInlineContainer ? 0 : token("radius.xlarge"),
		boxShadow: fillsInlineContainer ? "none" : token("elevation.shadow.overlay"),
		display: "grid",
		gridTemplateColumns: "minmax(0, 1fr)",
		gridTemplateRows: "minmax(0, 1fr)",
		overflow: "hidden",
	} as const;

	if (presentation === "inline") {
		// Inline hosts can keep the existing content-height card or opt into a
		// flush surface that fills the host's available width and height.
		return (
			<>
				<section
					aria-label={workItemTitle}
					className={cn(
						"max-h-full w-full max-w-[1200px] shrink-0 outline-none",
						fillsInlineContainer ? "h-full min-h-0 max-w-none flex-1 shrink" : null,
					)}
					style={surfaceStyle}
				>
					{content}
					<p className="sr-only">{description}</p>
				</section>
				{open ? blanketContent : null}
			</>
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
						"max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[1200px]",
						"sm:max-h-[calc(100vh-120px)] sm:w-[calc(100vw-120px)]",
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
				{open ? blanketContent : null}
			</Dialog.Portal>
		</Dialog.Root>
	);
}

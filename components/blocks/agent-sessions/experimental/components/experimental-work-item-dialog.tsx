"use client";

import { type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import CrossIcon from "@atlaskit/icon/core/cross";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ExperimentalWorkItemDialogProps {
	open: boolean;
	onClose: () => void;
	workItemCode: string;
	workItemTitle: string;
	parentCode?: string;
	children: ReactNode;
}

/**
 * Accessible dialog shell for the experimental Agent Sessions work item.
 *
 * Composes low-level Base UI Dialog primitives (Root/Portal/Backdrop/Popup/
 * Title/Description/Close) rather than the shadcn `DialogContent`, so it can
 * mirror the standard work-item modal geometry (full-bleed, centered, 1200px
 * cap) while keeping Base UI's built-in role=dialog, aria-modal, focus
 * containment, focus restoration, and Escape-to-close.
 */
export function ExperimentalWorkItemDialog({
	open,
	onClose,
	workItemCode,
	workItemTitle,
	parentCode,
	children,
}: Readonly<ExperimentalWorkItemDialogProps>) {
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
					style={{
						backgroundColor: token("elevation.surface.overlay"),
						borderRadius: token("radius.xlarge"),
						boxShadow: token("elevation.shadow.overlay"),
						display: "grid",
						gridTemplateRows: "auto minmax(0, 1fr)",
						overflow: "hidden",
					}}
				>
					<header
						className="flex shrink-0 items-center justify-between gap-2"
						style={{
							paddingBlock: token("space.200"),
							paddingInline: token("space.300"),
						}}
					>
						<nav
							aria-label="Breadcrumb"
							className="flex min-w-0 items-center gap-1 text-sm"
						>
							{parentCode ? (
								<>
									<span className="truncate text-text-subtle">{parentCode}</span>
									<span aria-hidden className="shrink-0 text-text-subtlest">
										/
									</span>
								</>
							) : null}
							<span className="truncate font-medium text-text-subtle">{workItemCode}</span>
						</nav>

						<Dialog.Close
							render={<Button aria-label="Close" size="icon" variant="ghost" />}
						>
							<CrossIcon label="" />
						</Dialog.Close>
					</header>

					<div style={{ minHeight: 0, minWidth: 0, display: "grid", overflow: "hidden" }}>
						{children}
					</div>

					<Dialog.Title className="sr-only">{workItemTitle}</Dialog.Title>
					<Dialog.Description className="sr-only">
						{`Details, agent sessions, and activity for work item ${workItemCode}.`}
					</Dialog.Description>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

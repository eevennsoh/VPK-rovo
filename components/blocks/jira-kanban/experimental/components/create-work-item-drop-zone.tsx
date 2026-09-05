"use client";

import { motion, useMotionValueEvent } from "motion/react";
import AddIcon from "@atlaskit/icon/core/add";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useMagneticProximity } from "@/components/ui-custom/hooks/use-magnetic-proximity";
import type { MagneticPointerRelation } from "@/components/ui-custom/hooks/magnetic-proximity-model";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { useExclusiveCreateWellProximity } from "./create-work-item-exclusive-proximity-context";
import { CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX } from "../lib/create-work-item-exclusive-proximity";
import type { BoardAgentSessionDrag } from "../use-board-agent-session-drag";

/** Dashed well chrome shared by the create button and the session-drag dropzone. */
const CREATE_WORK_ITEM_WELL_CHROME_CLASS = "rounded-lg border border-dashed";

export function BoardColumnCreateAction({
	dropZoneLabel,
	sessionDragTransaction,
	title,
}: Readonly<{
	dropZoneLabel?: string;
	sessionDragTransaction: BoardAgentSessionDrag["transaction"];
	title: string;
}>) {
	const armed = Boolean(
		sessionDragTransaction?.target?.kind === "create"
		&& sessionDragTransaction.target.columnTitle === title,
	);

	return (
		<div className="w-full" style={{ paddingBlock: token("space.050") }}>
			{sessionDragTransaction && dropZoneLabel ? (
				<CreateWorkItemDropZone
					armed={armed}
					label={dropZoneLabel}
					title={title}
				/>
			) : (
				<Button
					aria-label={`Create in ${title}`}
					className={cn(
						"w-full",
						CREATE_WORK_ITEM_WELL_CHROME_CLASS,
						"[&_[data-slot=icon]]:text-icon-subtlest [&_svg]:text-icon-subtlest",
						"hover:border-solid hover:[&_[data-slot=icon]]:text-icon-subtle hover:[&_svg]:text-icon-subtle",
						"focus-visible:border-solid focus-visible:[&_[data-slot=icon]]:text-icon-subtle focus-visible:[&_svg]:text-icon-subtle",
						"pointer-events-none opacity-0 transition-opacity duration-normal ease-out-practical",
						"group-hover/board-column:pointer-events-auto group-hover/board-column:opacity-100",
						"group-has-[:focus-visible]/board-column:pointer-events-auto group-has-[:focus-visible]/board-column:opacity-100",
						"motion-reduce:transition-none",
					)}
					size="compact"
					variant="outline"
				>
					<Icon render={<AddIcon label="" size="small" />} />
				</Button>
			)}
		</div>
	);
}

function CreateWorkItemDropZone({
	armed,
	label,
	title,
}: Readonly<{
	armed: boolean;
	label: string;
	title: string;
}>) {
	const targetRef = useRef<HTMLDivElement>(null);
	const magnet = useMagneticProximity(targetRef, {
		hoverArea: CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX,
	});
	const [rawProximity, setRawProximity] = useState<MagneticPointerRelation>("outside");
	useMotionValueEvent(magnet.proximity, "change", setRawProximity);
	const isExclusiveWinner = useExclusiveCreateWellProximity(title, targetRef);
	const proximity = isExclusiveWinner ? rawProximity : "outside";
	const expanded = proximity !== "outside";

	return (
		<motion.div
			className="w-full will-change-transform"
			style={{
				x: isExclusiveWinner ? magnet.x : 0,
				y: isExclusiveWinner ? magnet.y : 0,
			}}
		>
			<div
				aria-label={`${label} in ${title}${armed ? ", selected drop target" : ""}`}
				className={cn(
					"flex w-full select-none items-center justify-center px-3 text-center",
					CREATE_WORK_ITEM_WELL_CHROME_CLASS,
					"transition-[height,background-color] duration-normal ease-out-practical motion-reduce:transition-none",
					expanded ? "h-16 text-sm leading-5" : "h-6 text-xs leading-4",
					armed ? "border-border-selected bg-bg-selected text-text-selected" : "border-border bg-surface text-text-subtlest",
				)}
				data-armed={armed || undefined}
				data-board-agent-session-column-title={title}
				data-board-agent-session-create-work-item-drop-zone={title}
				data-board-agent-session-drop-zone="create"
				data-exclusive-winner={isExclusiveWinner || undefined}
				data-proximity={proximity}
				ref={targetRef}
				role="img"
			>
				<motion.span
					className="inline-block will-change-transform"
					style={{
						x: isExclusiveWinner ? magnet.labelX : 0,
						y: isExclusiveWinner ? magnet.labelY : 0,
					}}
				>
					{label}
				</motion.span>
			</div>
		</motion.div>
	);
}

"use client";

import { motion, useMotionValueEvent, useReducedMotion } from "motion/react";
import AddIcon from "@atlaskit/icon/core/add";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useMagneticProximity } from "@/components/ui-custom/hooks/use-magnetic-proximity";
import type { MagneticPointerRelation } from "@/components/ui-custom/hooks/magnetic-proximity-model";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { BoardAgentSessionDrag } from "../use-board-agent-session-drag";

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
	const magnet = useMagneticProximity(targetRef);
	const shouldReduceMotion = useReducedMotion();
	const [proximity, setProximity] = useState<MagneticPointerRelation>("outside");
	useMotionValueEvent(magnet.proximity, "change", setProximity);
	const expanded = proximity !== "outside" && !shouldReduceMotion;

	return (
		<motion.div
			className="w-full will-change-transform"
			style={{ x: magnet.x, y: magnet.y }}
		>
			<div
				aria-label={`${label} in ${title}${armed ? ", selected drop target" : ""}`}
				className={cn(
					"flex w-full select-none items-center justify-center rounded-lg border border-dashed px-3 text-center",
					"transition-[height,background-color,border-color,color] duration-medium ease-in-out motion-reduce:transition-none",
					expanded ? "h-12 text-sm leading-5" : "h-6 text-xs leading-4",
					armed ? "border-border-selected bg-bg-selected text-text-selected" : "border-border text-text-subtlest",
				)}
				data-armed={armed || undefined}
				data-board-agent-session-column-title={title}
				data-board-agent-session-create-work-item-drop-zone={title}
				data-board-agent-session-drop-zone="create"
				data-proximity={proximity}
				ref={targetRef}
				role="img"
			>
				<motion.span
					className="inline-block will-change-transform"
					style={{ x: magnet.labelX, y: magnet.labelY }}
				>
					{label}
				</motion.span>
			</div>
		</motion.div>
	);
}

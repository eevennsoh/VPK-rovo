"use client";

import { motion } from "motion/react";
import AddIcon from "@atlaskit/icon/core/add";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useMagneticProximity } from "@/components/ui-custom/hooks/use-magnetic-proximity";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export function BoardColumnCreateAction({
	dropZoneLabel,
	sessionDragging,
	title,
}: Readonly<{
	dropZoneLabel?: string;
	sessionDragging: boolean;
	title: string;
}>) {
	return (
		<div className="w-full" style={{ paddingBlock: token("space.050") }}>
			{sessionDragging && dropZoneLabel ? (
				<CreateWorkItemDropZone label={dropZoneLabel} title={title} />
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
	label,
	title,
}: Readonly<{
	label: string;
	title: string;
}>) {
	const targetRef = useRef<HTMLDivElement>(null);
	const magnet = useMagneticProximity(targetRef);

	return (
		<motion.div
			className="w-full will-change-transform"
			style={{ x: magnet.x, y: magnet.y }}
		>
			<div
				aria-label={`${label} in ${title}`}
				className="flex h-12 w-full select-none items-center justify-center rounded-lg border border-dashed border-border px-3 text-center text-sm leading-5 text-text-subtlest"
				data-board-agent-session-column-title={title}
				data-board-agent-session-create-work-item-drop-zone={title}
				data-board-agent-session-drop-zone="create"
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

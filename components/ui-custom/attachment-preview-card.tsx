"use client";

// oxlint-disable react-doctor/no-derived-state -- The highlighted prop retriggers a bounded generation animation whose completion state is local to the card.

import {
	useCallback,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";

import { RovoGeneration } from "@/components/ui-custom/rovo-generation";
import { token } from "@/lib/tokens";

const ATTACHMENT_CARD_RADIUS = 6;
const ATTACHMENT_GENERATION_DURATION_SECONDS = 2;
const ATTACHMENT_GENERATION_SIZE = 172;
const GENERATION_SURFACE_STYLE: CSSProperties = {
	minWidth: 0,
	width: "100%",
	height: "auto",
	boxShadow: token("elevation.shadow.raised"),
};

interface AttachmentPreviewCardProps {
	highlightedKey?: number;
	isHighlighted?: boolean;
	onOpen?: () => void;
	preview?: ReactNode;
	previewBackgroundColor?: string;
	title: string;
	trailingVisual?: ReactNode;
}

function AttachmentPreviewCardContent({
	highlightedKey,
	isHighlighted = false,
	onOpen,
	preview,
	previewBackgroundColor,
	title,
	trailingVisual,
}: Readonly<AttachmentPreviewCardProps>) {
	const [isGenerationActive, setIsGenerationActive] = useState(isHighlighted);
	const handleGenerationComplete = useCallback(() => {
		setIsGenerationActive(false);
	}, []);
	const showGenerationEffect = isGenerationActive;
	const containerStyle: CSSProperties = {
		minWidth: 0,
		borderRadius: token("radius.medium"),
		overflow: "hidden",
		boxShadow: token("elevation.shadow.raised"),
		backgroundColor: token("elevation.surface"),
		cursor: onOpen ? "pointer" : undefined,
	};
	const highlightedContainerStyle: CSSProperties = {
		minWidth: 0,
		borderRadius: token("radius.medium"),
		cursor: onOpen ? "pointer" : undefined,
	};
	const cardContent = (
		<>
			<div
				className="relative h-[104px]"
				style={{ backgroundColor: previewBackgroundColor }}
			>
				{preview}
			</div>
			<div className="flex min-w-0 items-center gap-2 p-1.5">
				<span className="min-w-0 flex-1 truncate text-xs font-normal" title={title}>
					{title}
				</span>
				{trailingVisual}
			</div>
		</>
	);
	const visibleContent = showGenerationEffect ? (
		<RovoGeneration.Root
			key={highlightedKey ?? "highlighted-attachment"}
			animated
			border
			className="w-full"
			duration={ATTACHMENT_GENERATION_DURATION_SECONDS}
			generating={isGenerationActive}
			glow
			onGenerationComplete={handleGenerationComplete}
			radius={ATTACHMENT_CARD_RADIUS}
			size={ATTACHMENT_GENERATION_SIZE}
			style={GENERATION_SURFACE_STYLE}
		>
			<div className="w-full p-[var(--rovo-generation-border-width)]">
				<div className="overflow-hidden rounded-[calc(var(--rovo-generation-radius)-var(--rovo-generation-border-width))] bg-surface">
					{cardContent}
				</div>
			</div>
		</RovoGeneration.Root>
	) : cardContent;
	const rootStyle = showGenerationEffect ? highlightedContainerStyle : containerStyle;

	if (onOpen) {
		return (
			<button
				aria-label={`Open ${title}`}
				className="w-full p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				data-highlighted-attachment={isGenerationActive ? "true" : undefined}
				onClick={onOpen}
				style={rootStyle}
				type="button"
			>
				{visibleContent}
			</button>
		);
	}

	return (
		<div
			data-highlighted-attachment={isGenerationActive ? "true" : undefined}
			style={rootStyle}
		>
			{visibleContent}
		</div>
	);
}

export function AttachmentPreviewCard(props: Readonly<AttachmentPreviewCardProps>) {
	const resetKey = `${props.isHighlighted === true}:${props.highlightedKey ?? "default"}`;
	return <AttachmentPreviewCardContent key={resetKey} {...props} />;
}

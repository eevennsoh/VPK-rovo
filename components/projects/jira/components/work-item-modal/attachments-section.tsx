"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import { token } from "@/lib/tokens";
import { AttachmentPreviewCard } from "@/components/ui-custom/attachment-preview-card";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { AtlassianLogo } from "@/components/ui/logo";
import { useWorkItemModal, type WorkItemAttachment } from "@/app/contexts/context-work-item-modal";
import {
	FileChartColumnIcon,
	FileIcon,
	ImageIcon,
	MoreHorizontalIcon,
	Music2Icon,
	PlusIcon,
	VideoIcon,
} from "@/components/ui/vpk-icons";

const ATTACHMENT_ICON_CLASS_NAME = "size-3 text-icon-subtlest [&_svg]:size-3";
const ATTACHMENT_SOURCE_LABELS = {
	confluence: "Confluence",
	loom: "Loom",
} as const;

const ATTACHMENT_FILES: WorkItemAttachment[] = [
	{
		name: "enterprise-rfp-requirements",
		ext: "pdf",
		date: "12 May 2026, 09:12 AM",
		thumbnailKind: "file",
		thumbnailTone: "success",
	},
	{
		name: "rfp-requirement-compliance-matrix",
		ext: "xlsx",
		date: "12 May 2026, 09:18 AM",
		thumbnailKind: "document",
		thumbnailTone: "warning",
	},
	{
		name: "pricing-tco-and-license-model",
		ext: "xlsx",
		date: "2 Jun 2026, 04:10 PM",
		thumbnailKind: "document",
		thumbnailTone: "discovery",
	},
];

interface AttachmentCardProps {
	file: WorkItemAttachment;
	isHighlighted?: boolean;
	highlightedAttachmentKey?: number;
	onOpen?: (file: WorkItemAttachment) => void;
}

function getAttachmentColor(file: WorkItemAttachment): string {
	if (file.thumbnailColor) return file.thumbnailColor;
	switch (file.thumbnailTone) {
		case "success":
			return token("color.background.success");
		case "warning":
			return token("color.background.warning");
		case "discovery":
			return token("color.background.discovery");
		case "information":
			return token("color.background.information");
		default:
			return token("elevation.surface.sunken");
	}
}

function getAttachmentTitle(file: WorkItemAttachment): string {
	return file.displayName ?? `${file.name}.${file.ext}`;
}

function renderAttachmentIcon(file: WorkItemAttachment) {
	if (file.sourceProduct) {
		return (
			<AtlassianLogo
				name={file.sourceProduct}
				label={file.sourceLabel ?? ATTACHMENT_SOURCE_LABELS[file.sourceProduct]}
				size={"12" as "xxsmall"}
			/>
		);
	}

	if (file.ext === "xlsx" || file.ext === "csv") {
		return <FileChartColumnIcon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
	}

	switch (file.thumbnailKind) {
		case "audio":
			return <Music2Icon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
		case "image":
			return <ImageIcon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
		case "video":
			return <VideoIcon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
		default:
			return <FileIcon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
	}
}

function renderAttachmentPreview(file: WorkItemAttachment, title: string) {
	if (file.previewHtml) {
		return (
			<div className="h-full w-full overflow-hidden bg-surface-sunken">
				<iframe
					aria-hidden={true}
					className="pointer-events-none border-0 bg-surface"
					sandbox=""
					srcDoc={file.previewHtml}
					style={{
						width: 720,
						height: 520,
						transform: "scale(0.25)",
						transformOrigin: "top left",
					}}
					tabIndex={-1}
					title={`${title} thumbnail preview`}
				/>
			</div>
		);
	}

	if (file.thumbnailKind === "audio") {
		return (
			<div className="flex h-full w-full items-center justify-center bg-surface-sunken">
				<IconTile
					aria-hidden={true}
					icon={<Music2Icon />}
					label="Audio attachment"
					variant="redBold"
					size="medium"
				/>
			</div>
		);
	}

	if (file.previewSrc) {
		return (
			<Image
				alt={file.previewAlt ?? title}
				className="object-cover"
				src={file.previewSrc}
				fill={true}
				sizes="(min-width: 768px) 25vw, 50vw"
			/>
		);
	}

	return null;
}

function AttachmentCard({
	file,
	isHighlighted = false,
	highlightedAttachmentKey,
	onOpen,
}: Readonly<AttachmentCardProps>) {
	const title = getAttachmentTitle(file);
	const canOpenPreview = Boolean(file.previewKind && onOpen);
	return (
		<AttachmentPreviewCard
			highlightedKey={highlightedAttachmentKey}
			isHighlighted={isHighlighted}
			onOpen={canOpenPreview ? () => onOpen?.(file) : undefined}
			preview={renderAttachmentPreview(file, title)}
			previewBackgroundColor={file.previewSrc || file.previewHtml ? "transparent" : getAttachmentColor(file)}
			title={title}
			trailingVisual={renderAttachmentIcon(file)}
		/>
	);
}

export function AttachmentsSection() {
	const { meta } = useWorkItemModal();
	const workItem = meta.workItem;
	const attachmentFiles = workItem.attachments?.length ? workItem.attachments : ATTACHMENT_FILES;
	const sectionRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!meta.highlightedAttachmentId) {
			return;
		}

		sectionRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
	}, [meta.highlightedAttachmentId, meta.highlightedAttachmentKey]);

	return (
		<section
			ref={sectionRef}
			style={{
				display: "grid",
				rowGap: token("space.100"),
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: token("space.100") }}>
					<Heading size="small" as="h3">
						Attachments
					</Heading>
					<Badge>{attachmentFiles.length}</Badge>
				</div>
				<div style={{ display: "flex", gap: token("space.100") }}>
					<Button aria-label="Manage" size="icon" variant="ghost">
						<MoreHorizontalIcon size="small" />
					</Button>
					<Button aria-label="Add attachment" size="icon" variant="ghost">
						<PlusIcon size="small" />
					</Button>
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(172px, 1fr))",
					gap: token("space.100"),
					padding: token("space.025"),
				}}
			>
				{attachmentFiles.map((file, i) => (
					<AttachmentCard
						key={file.id ?? `${file.name}-${i}`}
						file={file}
						isHighlighted={file.id === meta.highlightedAttachmentId}
						highlightedAttachmentKey={meta.highlightedAttachmentKey}
						onOpen={meta.onAttachmentOpen}
					/>
				))}
			</div>
		</section>
	);
}

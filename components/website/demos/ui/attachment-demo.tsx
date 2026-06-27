"use client";

import AttachmentIcon from "@atlaskit/icon/core/attachment";
import CrossIcon from "@atlaskit/icon/core/cross";
import FileIcon from "@atlaskit/icon/core/file";

import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentGroup,
	AttachmentMedia,
	AttachmentTitle,
} from "@/components/ui/attachment";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";

function FileAttachment({
	state = "done",
	title = "research-notes.pdf",
	description = "2.4 MB",
}: Readonly<{
	state?: "idle" | "uploading" | "processing" | "error" | "done";
	title?: string;
	description?: string;
}>) {
	return (
		<Attachment state={state}>
			<AttachmentMedia>
				{state === "uploading" || state === "processing" ? (
					<Spinner />
				) : (
					<Icon render={<FileIcon label="" size="small" />} label="" />
				)}
			</AttachmentMedia>
			<AttachmentContent>
				<AttachmentTitle>{title}</AttachmentTitle>
				<AttachmentDescription>{description}</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
				<AttachmentAction aria-label="Remove">
					<Icon render={<CrossIcon label="" size="small" />} label="" />
				</AttachmentAction>
			</AttachmentActions>
		</Attachment>
	);
}

export default function AttachmentDemo() {
	return <AttachmentDemoDefault />;
}

export function AttachmentDemoDefault() {
	return <FileAttachment />;
}

export function AttachmentDemoStates() {
	return (
		<AttachmentGroup>
			<FileAttachment state="idle" title="queued.csv" description="Waiting" />
			<FileAttachment state="uploading" title="uploading.mov" description="42%" />
			<FileAttachment state="processing" title="summary.md" description="Processing" />
			<FileAttachment state="done" title="complete.pdf" description="2.4 MB" />
			<FileAttachment state="error" title="failed.zip" description="Upload failed" />
		</AttachmentGroup>
	);
}

export function AttachmentDemoOrientation() {
	return (
		<div className="flex flex-wrap items-start gap-3">
			<FileAttachment />
			<Attachment orientation="vertical">
				<AttachmentMedia>
					<Icon render={<AttachmentIcon label="" size="small" />} label="" />
				</AttachmentMedia>
				<AttachmentContent>
					<AttachmentTitle>brief.txt</AttachmentTitle>
					<AttachmentDescription>16 KB</AttachmentDescription>
				</AttachmentContent>
			</Attachment>
		</div>
	);
}

"use client";

import { useCallback, useState } from "react";
import CopyIcon from "@atlaskit/icon/core/copy";
import ShareIcon from "@atlaskit/icon/core/share";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { readJsonResponse } from "@/components/blocks/html-selector/lib/artifact-actions";
import type { HtmlSelectorNotification } from "../lib/types";

type PublishStatus = "idle" | "publishing" | "published" | "error";

interface PublishResponse {
	ok: true;
	url: string;
}

interface ArtifactPublishDialogProps {
	disabled: boolean;
	onNotify: (notification: HtmlSelectorNotification) => void;
	pagePath: string;
}

export function ArtifactPublishDialog({
	disabled,
	onNotify,
	pagePath,
}: Readonly<ArtifactPublishDialogProps>) {
	const [open, setOpen] = useState(false);
	const [status, setStatus] = useState<PublishStatus>("idle");
	const [message, setMessage] = useState("");
	const [url, setUrl] = useState("");

	const handleOpenChange = useCallback((nextOpen: boolean) => {
		setOpen(nextOpen);
		if (nextOpen) {
			setStatus("idle");
			setMessage("");
			setUrl("");
		}
	}, []);

	const handlePublish = useCallback(async () => {
		setStatus("publishing");
		setMessage("");
		setUrl("");
		try {
			const payload = await readJsonResponse<PublishResponse>(
				await fetch("/api/vpk-html/publish-gist", {
					body: JSON.stringify({ page: pagePath }),
					headers: { "Content-Type": "application/json" },
					method: "POST",
				}),
				"Failed to publish Gist.",
			);
			setStatus("published");
			setUrl(payload.url);
			setMessage("Published");
			onNotify({ type: "success", message: "Published secret Gist." });
		} catch (publishError) {
			const errorMessage = publishError instanceof Error ? publishError.message : String(publishError);
			setStatus("error");
			setMessage(errorMessage);
			onNotify({ type: "error", message: errorMessage });
		}
	}, [onNotify, pagePath]);

	const handleCopy = useCallback(() => {
		if (!url) {
			return;
		}
		void navigator.clipboard.writeText(url)
			.then(() => onNotify({ type: "success", message: "Copied Gist URL." }))
			.catch((copyError) => onNotify({
				type: "error",
				message: copyError instanceof Error ? copyError.message : String(copyError),
			}));
	}, [onNotify, url]);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger
				render={
					<Button
						type="button"
						variant="ghost"
						size="compact"
						disabled={disabled}
						title={disabled ? "Gist publishing is available for saved vpk-html artifacts." : "Publish to GitHub Gist"}
					/>
				}
			>
				<ShareIcon label="" />
				<span>Publish</span>
			</DialogTrigger>
			<DialogContent size="sm" className="gap-4">
				<DialogHeader>
					<DialogTitle>Publish to GitHub Gist</DialogTitle>
					<DialogDescription>
						This uploads the HTML to a secret Gist on your GitHub account.
					</DialogDescription>
				</DialogHeader>
				{url ? (
					<div className="grid gap-2">
						<Input value={url} readOnly />
						<Button type="button" variant="outline" onClick={handleCopy}>
							<CopyIcon label="" />
							Copy URL
						</Button>
					</div>
				) : null}
				{message ? (
					<p className="text-sm text-text-subtle" aria-live="polite">
						{message}
					</p>
				) : null}
				<DialogFooter>
					<Button
						type="button"
						onClick={() => {
							void handlePublish();
						}}
						isLoading={status === "publishing"}
						disabled={status === "publishing" || status === "published"}
					>
						Publish secret Gist
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

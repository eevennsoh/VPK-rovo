"use client";

import { useCallback, useState } from "react";
import VideoIcon from "@atlaskit/icon/core/video";
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
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	getJsonErrorMessage,
	getVpkHtmlArtifactDiskPath,
} from "@/components/blocks/html-selector/lib/artifact-actions";
import {
	composeVpkHtmlVideoPrompt,
	type VpkHtmlVideoNarration,
	type VpkHtmlVideoSound,
} from "@/components/blocks/html-selector/lib/prompt-composer";
import type { AgentId, HtmlSelectorNotification } from "../lib/types";

type NarrationSource = "notes" | "script" | "none";
type SoundSource = "none" | "description" | "path";
type DispatchStatus = "idle" | "dispatching" | "sent" | "error";

interface ArtifactVideoDialogProps {
	agent: AgentId;
	disabled: boolean;
	loadNotes: () => Promise<string>;
	notes: string;
	onNotify: (notification: HtmlSelectorNotification) => void;
	pagePath: string;
	repoRoot?: string;
}

interface DispatchResponse {
	sessionName?: string;
	windowName?: string;
}

async function readDispatchResponse(response: Response): Promise<DispatchResponse> {
	const text = await response.text();
	const payload = text ? JSON.parse(text) as DispatchResponse & { error?: unknown; details?: unknown } : {};
	if (!response.ok) {
		throw new Error(getJsonErrorMessage(payload, "Failed to dispatch video conversion."));
	}

	return payload;
}

export function ArtifactVideoDialog({
	agent,
	disabled,
	loadNotes,
	notes,
	onNotify,
	pagePath,
	repoRoot,
}: Readonly<ArtifactVideoDialogProps>) {
	const [open, setOpen] = useState(false);
	const triggerTitle = disabled ? "Video conversion is available for saved vpk-html artifacts." : "Convert to video";
	const [narrationSource, setNarrationSource] = useState<NarrationSource>("notes");
	const [script, setScript] = useState("");
	const [soundSource, setSoundSource] = useState<SoundSource>("none");
	const [soundDescription, setSoundDescription] = useState("");
	const [soundPath, setSoundPath] = useState("");
	const [status, setStatus] = useState<DispatchStatus>("idle");
	const [message, setMessage] = useState("");

	const handleOpenChange = useCallback((nextOpen: boolean) => {
		setOpen(nextOpen);
		if (nextOpen) {
			setStatus("idle");
			setMessage("");
			void loadNotes();
		}
	}, [loadNotes]);

	const handleDispatch = useCallback(async () => {
		setStatus("dispatching");
		setMessage("");

		const notesForPrompt = narrationSource === "notes" ? await loadNotes() : notes;
		const narration: VpkHtmlVideoNarration = narrationSource === "notes"
			? { source: "notes", content: notesForPrompt }
			: narrationSource === "script"
				? { source: "script", content: script }
				: { source: "none" };
		const sound: VpkHtmlVideoSound = soundSource === "description"
			? { source: "description", content: soundDescription }
			: soundSource === "path"
				? { source: "path", content: soundPath }
				: { source: "none" };
		const prompt = composeVpkHtmlVideoPrompt({
			artifactAbsolutePath: getVpkHtmlArtifactDiskPath(pagePath, repoRoot),
			narration,
			pagePath,
			sound,
		});

		try {
			const payload = await readDispatchResponse(await fetch("/api/html-selector/dispatch", {
				body: JSON.stringify({ agent, prompt }),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			}));
			const successMessage = payload.windowName && payload.sessionName
				? `Opened ${payload.windowName} in ${payload.sessionName}.`
				: "Opened agent window.";
			setStatus("sent");
			setMessage(successMessage);
			onNotify({ type: "success", message: successMessage });
		} catch (dispatchError) {
			const errorMessage = dispatchError instanceof Error ? dispatchError.message : String(dispatchError);
			setStatus("error");
			setMessage(errorMessage);
			onNotify({ type: "error", message: errorMessage });
		}
	}, [
		agent,
		loadNotes,
		narrationSource,
		notes,
		onNotify,
		pagePath,
		repoRoot,
		script,
		soundDescription,
		soundPath,
		soundSource,
	]);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<Tooltip>
				<TooltipTrigger render={<span className="inline-flex" />}>
					<DialogTrigger
						render={
							<Button
								type="button"
								variant="ghost"
								size="icon-compact"
								disabled={disabled}
								title={triggerTitle}
								aria-label="Convert to video"
							/>
						}
					>
						<VideoIcon label="" />
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent side="bottom">{triggerTitle}</TooltipContent>
			</Tooltip>
			<DialogContent size="md" className="gap-4">
				<DialogHeader>
					<DialogTitle>Convert to video</DialogTitle>
					<DialogDescription>
						Send this artifact to {agent} with video production instructions.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<Tabs value={narrationSource} onValueChange={(value) => value ? setNarrationSource(value as NarrationSource) : undefined}>
						<TabsList>
							<TabsTrigger value="notes">Use notes</TabsTrigger>
							<TabsTrigger value="script">Write script</TabsTrigger>
							<TabsTrigger value="none">None</TabsTrigger>
						</TabsList>
						<TabsContent value="notes" className="pt-3">
							<Textarea value={notes} readOnly className="min-h-28 resize-y" placeholder="No speaker notes saved for this artifact." />
						</TabsContent>
						<TabsContent value="script" className="pt-3">
							<Textarea
								value={script}
								onChange={(event) => setScript(event.currentTarget.value)}
								className="min-h-32 resize-y"
								placeholder="Write narration for the generated video."
							/>
						</TabsContent>
						<TabsContent value="none" className="pt-3 text-sm text-text-subtle">
							No narration will be included.
						</TabsContent>
					</Tabs>
					<div className="grid gap-2">
						<Label htmlFor="vpk-html-video-sound">Background sound</Label>
						<NativeSelect
							id="vpk-html-video-sound"
							value={soundSource}
							onChange={(event) => setSoundSource(event.currentTarget.value as SoundSource)}
							className="w-full"
						>
							<NativeSelectOption value="none">None</NativeSelectOption>
							<NativeSelectOption value="description">Describe to generate</NativeSelectOption>
							<NativeSelectOption value="path">Path to file</NativeSelectOption>
						</NativeSelect>
						{soundSource === "description" ? (
							<Textarea
								value={soundDescription}
								onChange={(event) => setSoundDescription(event.currentTarget.value)}
								className="min-h-20 resize-y"
								placeholder="Describe the backing sound."
							/>
						) : null}
						{soundSource === "path" ? (
							<Input
								value={soundPath}
								onChange={(event) => setSoundPath(event.currentTarget.value)}
								placeholder="output/audio/bed.wav"
							/>
						) : null}
					</div>
				</div>
				<DialogFooter className="items-center justify-between sm:justify-between">
					<span className="text-xs text-text-subtle" aria-live="polite">
						{message || (status === "dispatching" ? "Opening agent window..." : "Ready")}
					</span>
					<Button
						type="button"
						onClick={() => {
							void handleDispatch();
						}}
						isLoading={status === "dispatching"}
						disabled={status === "dispatching"}
					>
						Dispatch
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

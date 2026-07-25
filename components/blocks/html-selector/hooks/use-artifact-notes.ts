"use client";

import { useCallback, useState } from "react";
import {
	getVpkHtmlNotesApiPath,
	readJsonResponse,
} from "@/components/blocks/html-selector/lib/artifact-actions";
import type { HtmlSelectorNotification } from "../lib/types";

type NotesStatus = "idle" | "loading" | "saving" | "saved" | "error";

interface NotesResponse {
	notes: string;
}

export function useArtifactNotes(
	pagePath: string,
	onNotify: (notification: HtmlSelectorNotification) => void,
) {
	const [notes, setNotes] = useState("");
	const [savedNotes, setSavedNotes] = useState("");
	const [status, setStatus] = useState<NotesStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const isArtifactPage = pagePath !== "srcdoc";
	const isDirty = notes !== savedNotes;

	const loadNotes = useCallback(async () => {
		if (!isArtifactPage) {
			return "";
		}

		setStatus("loading");
		setError(null);
		try {
			const payload = await readJsonResponse<NotesResponse>(
				await fetch(getVpkHtmlNotesApiPath(pagePath), { cache: "no-store" }),
				"Failed to load speaker notes.",
			);
			setNotes(payload.notes);
			setSavedNotes(payload.notes);
			setStatus("idle");
			return payload.notes;
		} catch (loadError) {
			const message = loadError instanceof Error ? loadError.message : String(loadError);
			setError(message);
			setStatus("error");
			onNotify({ type: "error", message });
			return "";
		}
	}, [isArtifactPage, onNotify, pagePath]);

	const saveNotes = useCallback(async () => {
		if (!isArtifactPage) {
			return;
		}

		setStatus("saving");
		setError(null);
		try {
			await readJsonResponse<{ ok: true }>(
				await fetch(getVpkHtmlNotesApiPath(pagePath), {
					body: JSON.stringify({ notes }),
					headers: { "Content-Type": "application/json" },
					method: "PUT",
				}),
				"Failed to save speaker notes.",
			);
			setSavedNotes(notes);
			setStatus("saved");
			onNotify({ type: "success", message: "Saved speaker notes." });
		} catch (saveError) {
			const message = saveError instanceof Error ? saveError.message : String(saveError);
			setError(message);
			setStatus("error");
			onNotify({ type: "error", message });
		}
	}, [isArtifactPage, notes, onNotify, pagePath]);

	return {
		error,
		isDirty,
		loadNotes,
		notes,
		saveNotes,
		setNotes,
		status,
	};
}

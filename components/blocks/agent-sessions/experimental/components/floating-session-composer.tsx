"use client";

// oxlint-disable react-doctor/no-derived-state -- This effect bridges the controller's
// composer-prefill into the local draft (e.g. a Context next step pre-populating the
// reply), which cannot be represented as a render-only value.

import { useEffect, useState } from "react";

import ChatComposer from "@/components/blocks/chat-composer/page";

import { useAgentSessions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import type { AgentSession } from "@/components/blocks/agent-sessions/data/session-state";

/**
 * Local reply composer for the floating session. Owns its own draft, seeds it
 * from the controller's `composerPrefill` once, and submits through
 * `replySession` — the SAME reply path the Activity panel uses, so a reply here
 * resumes a waiting agent identically.
 */
export function FloatingSessionComposer({ session }: Readonly<{ session: AgentSession }>) {
	const { state, actions } = useAgentSessions();
	const [prompt, setPrompt] = useState("");

	// Consume a pending prefill exactly once: copy it into the local draft, then
	// clear it in the controller so it does not re-apply.
	useEffect(() => {
		if (state.composerPrefill === null) return;
		setPrompt(state.composerPrefill);
		actions.clearComposerPrefill();
	}, [state.composerPrefill, actions]);

	const handleSubmit = () => {
		const text = prompt.trim();
		if (!text) return;
		actions.replySession(session.id, text);
		setPrompt("");
	};

	return (
		<div className="shrink-0 px-3 pt-1 pb-3">
			<ChatComposer
				prompt={prompt}
				onPromptChange={setPrompt}
				onSubmit={handleSubmit}
				placeholder="Reply to continue"
				features={{ addMenu: false, customizeMenu: false, microphone: false, disclaimer: false }}
			/>
		</div>
	);
}

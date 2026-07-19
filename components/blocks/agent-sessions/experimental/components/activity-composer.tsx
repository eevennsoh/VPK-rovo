"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";

import { AGENT_SESSIONS_ROSTER } from "@/components/blocks/agent-sessions/data/session-agents";
import { useAgentSessions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { ActivityComposerContextPills } from "@/components/blocks/agent-sessions/experimental/components/activity-composer-context-pills";
import { AgentSessionsComposerMotion } from "@/components/blocks/agent-sessions/experimental/components/agent-sessions-composer-motion";
import { DEFAULT_SKILLS } from "@/app/data/directory";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { PromptInputTextarea } from "@/components/ui-custom/prompt-input";
import { cn } from "@/lib/utils";

import { ActivitySuggestionMenu, type ActivitySuggestionItem } from "./activity-suggestion-menu";

const MAX_SUGGESTIONS = 6;
// Matches a trailing "@word" / "/word" token at the end of the draft (word chars only,
// so accepting a suggestion — which appends a trailing space — dismisses the menu).
const TRAILING_TOKEN = /(?:^|\s)([@/])([\w-]*)$/;

interface TrailingTrigger {
	char: "@" | "/";
	query: string;
}

function detectTrigger(draft: string): TrailingTrigger | null {
	const match = TRAILING_TOKEN.exec(draft);
	if (!match) return null;
	return { char: match[1] as "@" | "/", query: match[2].toLowerCase() };
}

function buildItems(trigger: TrailingTrigger | null): ActivitySuggestionItem[] {
	if (!trigger) return [];
	if (trigger.char === "@") {
		return AGENT_SESSIONS_ROSTER.filter((agent) => agent.name.toLowerCase().includes(trigger.query))
			.slice(0, MAX_SUGGESTIONS)
			.map((agent) => ({
				id: agent.id,
				value: agent.name,
				label: agent.name,
				description: agent.byline,
				avatarSrc: agent.avatarSrc,
				kind: "agent",
			}));
	}
	return DEFAULT_SKILLS.filter(
		(skill) => skill.name.toLowerCase().includes(trigger.query) || skill.id.toLowerCase().includes(trigger.query),
	)
		.slice(0, MAX_SUGGESTIONS)
		.map((skill) => ({ id: skill.id, value: skill.id, label: skill.name, description: skill.description, kind: "skill" }));
}

/**
 * Unified comment/command composer. Reuses the shared {@link FloatingComposer} in its
 * "experimental dark button" form — a leading "+" add button, plus the live-voice and
 * dark send CTA from {@link RovoComposerActionButton}, and deliberately no sources
 * customize menu or model/reasoning selector. It layers lightweight local `@agent` /
 * `/skill` suggestions by detecting a trailing token in the owned draft state and
 * anchoring a suggestion Popover to the composer container. On submit, an `@mention` of a
 * working (running/waiting) session's agent resumes that session via `replySession`;
 * otherwise the text is posted as a comment.
 */
export function ActivityComposer() {
	const { state, actions } = useAgentSessions();
	const [draft, setDraft] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const [suppressed, setSuppressed] = useState(false);
	const [realtimeVoiceActive, setRealtimeVoiceActive] = useState(false);
	const editorRef = useRef<HTMLTextAreaElement>(null);

	const trigger = useMemo(() => detectTrigger(draft), [draft]);
	const items = useMemo(() => buildItems(trigger), [trigger]);
	const menuOpen = items.length > 0 && !suppressed;
	const boundedIndex = items.length > 0 ? Math.min(activeIndex, items.length - 1) : 0;

	const handlePromptChange = (next: string) => {
		setDraft(next);
		setSuppressed(false);
		setActiveIndex(0);
	};

	const acceptSuggestion = (item: ActivitySuggestionItem) => {
		setDraft((prev) => {
			const match = TRAILING_TOKEN.exec(prev);
			if (match) {
				const tokenLength = 1 + match[2].length; // trigger char + query
				const before = prev.slice(0, prev.length - tokenLength);
				return `${before}${match[1]}${item.value} `;
			}
			return prev;
		});
		setSuppressed(false);
		setActiveIndex(0);
	};

	const insertContext = (prefix: "@" | "/", value: string) => {
		setDraft((currentDraft) => {
			const separator = currentDraft.length > 0 && !currentDraft.endsWith(" ") ? " " : "";
			return `${currentDraft}${separator}${prefix}${value} `;
		});
		setSuppressed(false);
		setActiveIndex(0);
		requestAnimationFrame(() => editorRef.current?.focus());
	};

	const handleSubmit = () => {
		const text = draft.trim();
		if (!text) return;
		const mentioned = state.sessions.find(
			(session) =>
				(session.status === "running" || session.status === "waiting") && draft.includes(`@${session.agentName}`),
		);
		if (mentioned) {
			actions.replySession(mentioned.id, text);
		} else {
			actions.addComment(text);
		}
		setDraft("");
		setSuppressed(false);
		setActiveIndex(0);
		setRealtimeVoiceActive(false);
	};

	// Capture keydowns before the composer's internal editor so navigation/selection
	// keys drive the suggestion menu instead of moving the caret or submitting.
	const handleKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!menuOpen) return;
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				event.stopPropagation();
				setActiveIndex((index) => (index + 1) % items.length);
				break;
			case "ArrowUp":
				event.preventDefault();
				event.stopPropagation();
				setActiveIndex((index) => (index - 1 + items.length) % items.length);
				break;
			case "Enter":
			case "Tab":
				event.preventDefault();
				event.stopPropagation();
				acceptSuggestion(items[boundedIndex]);
				break;
			case "Escape":
				event.preventDefault();
				event.stopPropagation();
				setSuppressed(true);
				break;
			default:
				break;
		}
	};

	return (
		<div onKeyDownCapture={handleKeyDownCapture}>
			<ActivityComposerContextPills
				onSelectAgent={(agentName) => insertContext("@", agentName)}
				onSelectSkill={(skillId) => insertContext("/", skillId)}
				onStatusChange={(status) => actions.updateMetadata({ status })}
				status={state.metadata.status}
			/>
			<div className="relative" data-agent-sessions-composer-state="sticky">
				<AgentSessionsComposerMotion placement="sticky">
					<FloatingComposer
						actions={
							<RovoComposerActionButton
								canSubmit={Boolean(draft.trim())}
								composerStatus="ready"
								experimentalDarkCta
								onStop={() => setRealtimeVoiceActive(false)}
								onToggleRealtimeVoice={() => setRealtimeVoiceActive((active) => !active)}
								realtimeVoiceActive={realtimeVoiceActive}
							/>
						}
						allowOverflow
						onSubmit={handleSubmit}
					>
						<PromptInputTextarea
							aria-label="Add a comment"
							autoResize
							className={cn(floatingComposerTextareaClassName, "text-sm leading-5")}
							enableDirectoryAutocomplete={false}
							onChange={(event) => handlePromptChange(event.currentTarget.value)}
							placeholder="Comment, @mention an agent, or / for skills"
							ref={editorRef}
							rows={1}
							value={draft}
						/>
					</FloatingComposer>
				</AgentSessionsComposerMotion>
				<ActivitySuggestionMenu
					activeIndex={boundedIndex}
					anchor={<span aria-hidden tabIndex={-1} className="pointer-events-none absolute left-2 top-0 h-0 w-0" />}
					items={items}
					onActiveIndexChange={setActiveIndex}
					onOpenChange={(open) => {
						if (!open) {
							setSuppressed(true);
						}
					}}
					onSelect={acceptSuggestion}
					open={menuOpen}
				/>
			</div>
		</div>
	);
}

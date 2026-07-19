"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";

import { AGENT_SESSIONS_ROSTER } from "@/components/blocks/agent-sessions/data/session-agents";
import { useAgentSessions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { ActivityComposerContextPills } from "@/components/blocks/agent-sessions/experimental/components/activity-composer-context-pills";
import { AgentSessionsComposerMotion } from "@/components/blocks/agent-sessions/experimental/components/agent-sessions-composer-motion";
import { AGENT_SESSIONS_CURRENT_USER } from "@/components/blocks/agent-sessions/experimental/lib/jira-activity-adapter";
import { JiraActivityComposer } from "@/components/blocks/jira-activity";
import { DEFAULT_SKILLS } from "@/app/data/directory";

import { ActivitySuggestionMenu, type ActivitySuggestionItem } from "./activity-suggestion-menu";

const MAX_SUGGESTIONS = 6;
// Matches a trailing "@word" / "/word" token at the end of the draft (word chars only,
// so accepting a suggestion — which appends a trailing space — dismisses the menu).
const TRAILING_TOKEN = /(?:^|\s)([@/])([\w-]*)$/;

function buildItems(draft: string): ActivitySuggestionItem[] {
	const match = TRAILING_TOKEN.exec(draft);
	if (!match) return [];
	const [, trigger, query] = match;
	const normalizedQuery = query.toLowerCase();

	if (trigger === "@") {
		return AGENT_SESSIONS_ROSTER.filter((agent) => agent.name.toLowerCase().includes(normalizedQuery))
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
		(skill) => skill.name.toLowerCase().includes(normalizedQuery) || skill.id.toLowerCase().includes(normalizedQuery),
	)
		.slice(0, MAX_SUGGESTIONS)
		.map((skill) => ({ id: skill.id, value: skill.id, label: skill.name, description: skill.description, kind: "skill" }));
}

/**
 * Unified comment/command composer. Reuses the Jira Activity prompt surface while
 * layering lightweight local `@agent` / `/skill` suggestions over its controlled
 * draft. On submit, an `@mention` of a working session's agent resumes that session
 * via `replySession`; otherwise the text is posted as a comment.
 */
export function ActivityComposer() {
	const { state, actions } = useAgentSessions();
	const [draft, setDraft] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const [suppressed, setSuppressed] = useState(false);
	const editorRef = useRef<HTMLTextAreaElement>(null);

	const items = useMemo(() => buildItems(draft), [draft]);
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

	const handleSubmit = (body: string) => {
		const text = body.trim();
		if (!text) return;
		const mentioned = state.sessions.find(
			(session) =>
				(session.status === "running" || session.status === "waiting") && text.includes(`@${session.agentName}`),
		);
		if (mentioned) {
			actions.replySession(mentioned.id, text);
		} else {
			actions.addComment(text);
		}
		setDraft("");
		setSuppressed(false);
		setActiveIndex(0);
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
					<JiraActivityComposer
						author={AGENT_SESSIONS_CURRENT_USER}
						onSubmit={handleSubmit}
						onValueChange={handlePromptChange}
						placeholder="Comment, @mention an agent, or / for skills"
						textareaRef={editorRef}
						value={draft}
						variant="comment"
					/>
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

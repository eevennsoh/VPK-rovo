"use client";

import { useCallback } from "react";
import type { ReactNode } from "react";
import ChatPanel, {
	type ChatPanelGreetingProps,
	type ChatSubmitInterceptOutcome,
} from "@/components/projects/sidebar-chat/page";
import { getRovoAgentProfile, ROVO_AGENT_ID } from "@/app/data/directory/agents";
import { SkillInvocationCard } from "./components/skill-invocation-card";
import {
	buildSkillInterceptOutcome,
	SKILL_INVOCATION_WIDGET_TYPE,
	type SkillInvocationPayload,
} from "./lib/skill-intercept";
import { SKILL_GREETING_SUGGESTIONS } from "./lib/skill-suggestions";

const SKILLS_GREETING: ChatPanelGreetingProps = {
	heading: "What skill should I run?",
	suggestions: SKILL_GREETING_SUGGESTIONS,
};

/**
 * The default Rovo agent profile. Pinning the greeting to it keeps the Skills
 * triggers visible even when a custom agent is selected in the shared Rovo chat
 * state — otherwise `ChatGreeting`'s custom-agent branch would ignore
 * `greeting.suggestions` and show that agent's starters instead.
 */
const ROVO_GREETING_AGENT = getRovoAgentProfile(ROVO_AGENT_ID);

interface SkillsPanelProps {
	/** Mirrors `ChatPanel.onClose`; defaults to a no-op for the standalone demo. */
	onClose?: () => void;
}

/**
 * Skills project surface. A thin, fork-free reuse of the Sidebar Chat `ChatPanel`
 * (so the interface stays pixel-identical and can never drift) wired to
 * demonstrate how skills are **invoked** and **triggered**:
 *
 * - Greeting starters and matching typed prompts are intercepted
 *   (`buildSkillInterceptOutcome`) and answered locally — the model is never hit.
 * - Each invocation renders an inline "Skill invoked" card via `renderWidget`,
 *   positioned above the reply via `getWidgetPosition`.
 */
export default function SkillsPanel({ onClose }: Readonly<SkillsPanelProps>) {
	const renderWidget = useCallback(
		(widget: { type: string; data: unknown }): ReactNode => {
			if (widget.type === SKILL_INVOCATION_WIDGET_TYPE) {
				return <SkillInvocationCard {...(widget.data as SkillInvocationPayload)} />;
			}
			return undefined;
		},
		[],
	);

	const getWidgetPosition = useCallback(
		(widgetType: string): "before-content" | "after-content" | undefined =>
			widgetType === SKILL_INVOCATION_WIDGET_TYPE ? "before-content" : undefined,
		[],
	);

	const onInterceptSubmit = useCallback(
		(text: string): ChatSubmitInterceptOutcome => buildSkillInterceptOutcome(text),
		[],
	);

	return (
		<ChatPanel
			onClose={onClose ?? (() => {})}
			enableSmartWidgets
			greeting={SKILLS_GREETING}
			greetingSelectedAgent={ROVO_GREETING_AGENT}
			suppressCustomAgentTabs
			onInterceptSubmit={onInterceptSubmit}
			renderWidget={renderWidget}
			getWidgetPosition={getWidgetPosition}
		/>
	);
}

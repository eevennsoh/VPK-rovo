"use client";

import type { ReactNode } from "react";
import {
	type RovoRenderableUIMessage,
} from "@/lib/rovo-ui-messages";
import { ThreadMessage } from "@/components/projects/shared/thread-message";
import { GenerativeWidgetCard } from "@/components/projects/shared/components/generative-widget-card";
import type { GenerativeCardAnimationProps } from "@/components/projects/shared/components/generative-widget-card";
import type { GenerativeWidgetPrimaryActionPayload } from "@/components/projects/shared/lib/generative-widget";
import { PlanWidgetInlineCard } from "@/components/projects/shared/components/plan-widget-inline-card";
import {
	parsePlanWidgetPayload,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import { AgentEditSummaryCard } from "@/components/projects/shared/components/agent-edit-summary-card";
import {
	AGENT_EDIT_SUMMARY_WIDGET_TYPE,
	parseAgentEditSummaryPayload,
} from "@/components/projects/shared/lib/agent-edit-summary";

interface PlanBuildState {
	isBuildDisabled?: boolean;
	buildDisabledReason?: string;
}

interface MessageBubbleProps {
	message: RovoRenderableUIMessage;
	onSuggestionClick?: (question: string) => void;
	enableSmartWidgets?: boolean;
	showFollowUpSuggestions?: boolean;
	showThinkingStatusSection?: boolean;
	isThinkingLifecycleStreaming?: boolean;
	/** Forwarded to ThreadMessage.Root: flip answered question traces to "Questions answered". */
	treatQuestionToolCallsAsAnswered?: boolean;
	generativeCardAnimation?: GenerativeCardAnimationProps;
	editingMessageId?: string | null;
	onEditMessage?: (messageId: string, nextText: string) => Promise<void> | void;
	onSetEditingMessageId?: (messageId: string | null) => void;
	onWidgetPrimaryAction?: (
		payload: GenerativeWidgetPrimaryActionPayload
	) => Promise<void> | void;
	/**
	 * Opens the automation trigger/flow dialog from an agent-edit-summary card's
	 * "Open" button. When omitted the card renders without the button.
	 */
	onOpenAgentEditSummary?: () => void;
	renderWidget?: (
		widget: { type: string; data: unknown },
		message: RovoRenderableUIMessage
	) => ReactNode;
	getWidgetPosition?: (widgetType: string) => "before-content" | "after-content" | undefined;
	onBuildPlan?: (planWidget: ParsedPlanWidgetPayload) => Promise<void> | void;
	resolvePlanBuildState?: (
		planWidget: ParsedPlanWidgetPayload,
		message: RovoRenderableUIMessage
	) => PlanBuildState;
}

export default function MessageBubble({
	message,
	onSuggestionClick,
	enableSmartWidgets = false,
	showFollowUpSuggestions = true,
	showThinkingStatusSection = true,
	isThinkingLifecycleStreaming = false,
	treatQuestionToolCallsAsAnswered = false,
	generativeCardAnimation,
	editingMessageId,
	onEditMessage,
	onSetEditingMessageId,
	onWidgetPrimaryAction,
	onOpenAgentEditSummary,
	renderWidget: renderCustomWidget,
	getWidgetPosition,
	onBuildPlan,
	resolvePlanBuildState,
}: Readonly<MessageBubbleProps>): ReactNode {
	const hasPlanWidget = message.parts.some(
		(part) =>
			part.type === "data-widget-data" &&
			part.data?.type === "plan",
	);
	// Deterministic agent-config edits emit a collapsed change card; render it
	// regardless of enableSmartWidgets, the same way plan widgets always render.
	const hasAgentEditSummaryWidget = message.parts.some(
		(part) =>
			part.type === "data-widget-data" &&
			part.data?.type === AGENT_EDIT_SUMMARY_WIDGET_TYPE,
	);
	const renderWidget =
		enableSmartWidgets || hasPlanWidget || hasAgentEditSummaryWidget || renderCustomWidget
			? (widget: { type: string; data: unknown }, widgetMessage: RovoRenderableUIMessage) => {
					if (widget.type === "plan") {
						const planWidget = parsePlanWidgetPayload(widget.data);
						if (!planWidget) {
							return null;
						}

						const buildState = resolvePlanBuildState?.(planWidget, widgetMessage) ?? {};
						const hasDeferredToolCall = Boolean(
							planWidget.deferredToolCallId ?? planWidget.toolCallId,
						);
						return (
							<PlanWidgetInlineCard
								title={planWidget.title}
								description={planWidget.description}
								shortDescription={planWidget.shortDescription}
								markdown={planWidget.markdown}
								tasks={planWidget.tasks}
								onBuild={
									onBuildPlan && hasDeferredToolCall
										? () => onBuildPlan(planWidget)
										: undefined
								}
								isBuildDisabled={buildState.isBuildDisabled}
								buildDisabledReason={buildState.buildDisabledReason}
								shouldAutoCollapse={buildState.isBuildDisabled === true}
							/>
						);
					}

					if (widget.type === AGENT_EDIT_SUMMARY_WIDGET_TYPE) {
						const summaryPayload = parseAgentEditSummaryPayload(widget.data);
						return summaryPayload ? (
							<AgentEditSummaryCard
								payload={summaryPayload}
								onOpen={onOpenAgentEditSummary}
							/>
						) : null;
					}

					const customWidget = renderCustomWidget?.(widget, widgetMessage);
					if (customWidget !== null && customWidget !== undefined) {
						return customWidget;
					}

					if (!enableSmartWidgets) {
						return null;
					}

					return (
						<GenerativeWidgetCard
							widgetType={widget.type}
							widgetData={widget.data}
							cardAnimation={generativeCardAnimation}
							onPrimaryAction={onWidgetPrimaryAction}
						/>
					);
				}
			: undefined;

	return (
		<ThreadMessage.Root
			message={message}
			surface="sidebar"
			isThinkingLifecycleStreaming={isThinkingLifecycleStreaming}
			treatQuestionToolCallsAsAnswered={treatQuestionToolCallsAsAnswered}
			editingMessageId={editingMessageId}
			onEditMessage={onEditMessage}
			onSetEditingMessageId={onSetEditingMessageId}
			showUserMessagePromptActions
			renderWidget={renderWidget}
			getWidgetPosition={getWidgetPosition}
		>
			<ThreadMessage.Widget position="before-content" />
			{/* Agent text first; chain-of-thought / tool calls follow beneath it. */}
			<ThreadMessage.Content />
			<ThreadMessage.Reasoning />
			{showThinkingStatusSection ? <ThreadMessage.ThinkingStatus /> : null}
			<ThreadMessage.Feedback />
			<ThreadMessage.Tools />
			<ThreadMessage.ToolFirstWarning />
			<ThreadMessage.Sources />
			{showFollowUpSuggestions ? (
				<ThreadMessage.Suggestions onSuggestionClick={onSuggestionClick} />
			) : null}
			<ThreadMessage.Widget position="after-content" />
		</ThreadMessage.Root>
	);
}

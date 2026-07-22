"use client";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { MessageResponse } from "@/components/ui-custom/message-markdown";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ui-custom/reasoning";
import { cn } from "@/lib/utils";

import { CHAT_SCRIPT } from "../../data/chat-script";
import type { ChatScript } from "../../data/types";
import { ChatComposer } from "./chat-composer";

interface ChatPanelProps {
	script?: ChatScript;
	className?: string;
}

export function ChatPanel({ script = CHAT_SCRIPT, className }: Readonly<ChatPanelProps>) {
	return (
		<aside
			className={cn(
				"flex h-full w-[400px] shrink-0 flex-col rounded-lg border border-border bg-surface-raised",
				className,
			)}
		>
			<header className="flex h-14 shrink-0 items-center gap-2 px-3">
				<AgentAvatarVisual
					fallbackText="JC"
					label={script.agentName}
					sizePx={20}
					vpkLogo="rovo"
				/>
				<h2 className="text-sm font-semibold text-text">{script.agentName}</h2>
				<Button
					aria-label="Chat actions"
					className="ml-auto"
					size="icon-compact"
					type="button"
					variant="ghost"
				>
					<Icon aria-hidden render={<ShowMoreHorizontalIcon label="" size="small" />} />
				</Button>
			</header>
			<ScrollArea className="min-h-0 flex-1">
				<div className="flex min-h-full flex-col justify-end gap-5 px-4 py-4">
					<p className="text-sm leading-5 text-text">{script.intro}</p>
					<Reasoning defaultOpen={false}>
						<ReasoningTrigger className="h-[52px] rounded-lg border border-border px-3">
							<span className="text-text">{script.thinkingLabel}</span>
							<Badge className="min-w-4" max={false} variant="neutral">
								{script.thinkingCount}
							</Badge>
							<Icon
								aria-hidden
								className="ml-auto text-icon-subtlest"
								render={<ChevronDownIcon label="" size="small" />}
							/>
						</ReasoningTrigger>
						<ReasoningContent
							className="mt-2 rounded-lg border border-border p-3"
							timelineMode="never"
						>
							<ul className="list-disc space-y-1 pl-4 text-sm text-text-subtle">
								{script.thinkingSteps.map((step) => (
									<li key={step}>{step}</li>
								))}
							</ul>
						</ReasoningContent>
					</Reasoning>
					<MessageResponse className="h-auto text-sm leading-5" mode="static">
						{script.summaryMarkdown}
					</MessageResponse>
					<Button className="w-fit" type="button" variant="outline">
						{script.ctaLabel}
					</Button>
				</div>
			</ScrollArea>
			<ChatComposer placeholder={script.composerPlaceholder} />
			<div className="flex h-8 shrink-0 items-center justify-center gap-1 text-xs text-text-subtlest">
				<Icon aria-hidden render={<AiAgentIcon label="" size="small" />} />
				<span>{script.footerNote}</span>
			</div>
		</aside>
	);
}

"use client";

import { useState } from "react";

import { EDITOR_PALETTE_MENTION_SOURCES } from "@/components/blocks/editor-palette/data/mention-sources";
import {
	RovoSparkle,
	type RovoSparkleActionRequest,
} from "@/components/ui-custom/rovo-sparkle";
import { getMentionChildItems } from "@/components/ui-custom/rich-text-editor";

const DEMO_AGENTS = getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "subagent");
const DEMO_SKILLS = getMentionChildItems(EDITOR_PALETTE_MENTION_SOURCES, "skill");

function getActionLabel(request: RovoSparkleActionRequest): string {
	return request.kind === "ask-rovo"
		? `Ask Rovo: ${request.prompt}`
		: `${request.kind === "agent" ? "Agent" : "Skill"}: ${request.selectedItem.label}`;
}

export default function RovoSparkleDemo() {
	const [lastAction, setLastAction] = useState("Choose an action from either sparkle");

	function handleSubmit(request: RovoSparkleActionRequest) {
		setLastAction(getActionLabel(request));
	}

	return (
		<div className="flex flex-col items-start gap-4" data-testid="rovo-sparkle-demo">
			<div className="flex items-end gap-5">
				<div className="flex flex-col items-center gap-2">
					<RovoSparkle
						agents={DEMO_AGENTS}
						ariaLabel="Open compact Rovo actions"
						onSubmit={handleSubmit}
						size="compact"
						skills={DEMO_SKILLS}
					/>
					<span className="text-xs text-text-subtle">Compact · 24px</span>
				</div>
				<div className="flex flex-col items-center gap-2">
					<RovoSparkle
						agents={DEMO_AGENTS}
						ariaLabel="Open default Rovo actions"
						onSubmit={handleSubmit}
						skills={DEMO_SKILLS}
					/>
					<span className="text-xs text-text-subtle">Default · 32px</span>
				</div>
			</div>
			<output className="text-sm text-text-subtle">{lastAction}</output>
		</div>
	);
}


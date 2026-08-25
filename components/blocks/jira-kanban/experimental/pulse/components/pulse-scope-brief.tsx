"use client";

import type { RefCallback } from "react";

import { PulseEpicBrief } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-scope-brief-epic";
import { PulseSprintBrief } from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-scope-brief-sprint";
import type { PulseScope } from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Which brief opens the article.
 *
 * An epic and a sprint answer different questions — "how far through the body
 * of work are we" against "will this land by Friday" — so they are two
 * components with two compositions rather than one component with a mode flag
 * and six nullable fields. This is the seam where that choice is made, so the
 * stream can render a brief without knowing there are two of them.
 *
 * `PulseScope` is a discriminated union, which is what makes the switch total:
 * a third kind added to the union fails to compile here rather than silently
 * rendering nothing at the top of the page.
 */
export interface PulseScopeBriefProps {
	scope: PulseScope;
	/** `usePulseReading().registerAnchor(id)`, so the ruler can jump to it. */
	anchorRef?: RefCallback<HTMLElement>;
	anchorId: string;
}

export function PulseScopeBrief({ scope, anchorRef, anchorId }: Readonly<PulseScopeBriefProps>) {
	switch (scope.kind) {
		case "sprint":
			return <PulseSprintBrief anchorId={anchorId} anchorRef={anchorRef} scope={scope} />;
		case "epic":
			return <PulseEpicBrief anchorId={anchorId} anchorRef={anchorRef} scope={scope} />;
		default: {
			const exhaustive: never = scope;
			return exhaustive;
		}
	}
}

/**
 * Greeting conversation starters for the Skills project.
 *
 * Maps the scripted {@link SKILL_INVOCATIONS} dataset to `RovoSuggestion`s for
 * `ChatPanel`'s greeting. Each starter is a *manual trigger*: clicking it submits
 * the entry's `starterPrompt`, which the interceptor (`./skill-intercept`) matches
 * to render the inline "Skill invoked" card. Icons are representative ADS glyphs,
 * mirroring how `defaultSuggestions` (`@/lib/rovo-suggestions`) attaches icons.
 */

import type { ComponentType } from "react";
import BranchIcon from "@atlaskit/icon/core/branch";
import WorkItemIcon from "@atlaskit/icon/core/work-item";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import ChartBarIcon from "@atlaskit/icon/core/chart-bar";
import CalendarPlusIcon from "@atlaskit/icon/core/calendar-plus";
import PageIcon from "@atlaskit/icon/core/page";

import type { RovoSuggestion } from "@/lib/rovo-suggestions";
import { SKILL_INVOCATIONS } from "../data/skill-invocations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RovoSuggestion.icon accepts any ADS icon component.
type SkillStarterIcon = ComponentType<any>;

/** Representative ADS glyph per demo skill (keyed by catalog skill id). */
const SKILL_STARTER_ICONS: Readonly<Record<string, SkillStarterIcon>> = {
	"review-pull-request": BranchIcon,
	"create-work-items": WorkItemIcon,
	"summarize-thread": AiGenerativeTextSummaryIcon,
	"build-report": ChartBarIcon,
	"schedule-meeting": CalendarPlusIcon,
	"confluence-page-drafter": PageIcon,
};

export const SKILL_GREETING_SUGGESTIONS: readonly RovoSuggestion[] = SKILL_INVOCATIONS.map((entry) => ({
	id: `skill-${entry.skillId}`,
	label: entry.starterLabel,
	description: entry.starterDescription,
	prompt: entry.starterPrompt,
	icon: SKILL_STARTER_ICONS[entry.skillId],
	type: "skill",
}));

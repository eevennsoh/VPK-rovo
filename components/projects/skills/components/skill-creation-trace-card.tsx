"use client";

import type { ComponentType, ReactNode } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import SearchIcon from "@atlaskit/icon/core/search";
import QuestionCircleIcon from "@atlaskit/icon/core/question-circle";
import ListChecklistIcon from "@atlaskit/icon/core/list-checklist";
import EditIcon from "@atlaskit/icon/core/edit";
import LinkIcon from "@atlaskit/icon/core/link";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import PageIcon from "@atlaskit/icon/core/page";
import SkillIcon from "@atlaskit/icon-lab/core/skill";

import { ChainOfThoughtScenario, type ChainOfThoughtScenarioState, type ChainOfThoughtScenarioStep } from "@/components/ui-custom/chain-of-thought";
import { SkillTag } from "@/components/ui-custom/skill-tag";
import { getSkillIcon } from "@/app/data/directory/skills";
import type { SkillCreationTracePayload } from "../lib/create-skill-flow";

// Distinct icon per step so the trace isn't a single repeated glyph.
const STEP_ICONS: Record<string, ComponentType<NewCoreIconProps>> = {
	search: SearchIcon,
	skill: SkillIcon,
	question: QuestionCircleIcon,
	review: ListChecklistIcon,
	draft: EditIcon,
	wire: LinkIcon,
	save: CheckCircleIcon,
};

function stepIcon(iconKey: string): ComponentType<NewCoreIconProps> {
	return STEP_ICONS[iconKey] ?? PageIcon;
}

/** "Invoking /create-skill" — the skill mention rendered as a tag inside the step. */
function invokingSkillLabel(skillId: string): ReactNode {
	return (
		<span className="inline-flex min-w-0 items-center gap-1.5">
			<span>Invoking</span>
			<SkillTag color="platform" icon={getSkillIcon("skill")}>
				{skillId}
			</SkillTag>
		</span>
	);
}

interface SkillCreationTraceCardProps {
	payload: SkillCreationTracePayload;
	/** Flow ids whose question card has been answered. The awaiting trace flips
	 *  its header to "Questions answered" when its own flow id is in this set, so
	 *  multiple create-skill flows in one transcript stay independent. */
	answeredFlowIds?: ReadonlySet<string>;
}

/**
 * Renders the create-skill chain-of-thought using the canonical
 * `ChainOfThoughtScenario`, so styling (header, per-step icons, bylines) matches
 * the design-system component exactly. The header is general (not parroting the
 * active step) and reflects awaiting/answered/duration states.
 */
export function SkillCreationTraceCard({ payload, answeredFlowIds }: Readonly<SkillCreationTraceCardProps>) {
	const isAwaiting = payload.awaiting === true;
	const answered = isAwaiting && payload.flowId ? Boolean(answeredFlowIds?.has(payload.flowId)) : false;
	const state: ChainOfThoughtScenarioState =
		isAwaiting ? (answered ? "completed" : "thinking") : payload.headerState;
	const headerLabel: ReactNode = isAwaiting
		? answered
			? "Questions answered"
			: "Awaiting user response"
		: payload.headerLabel;

	const steps: ChainOfThoughtScenarioStep[] = payload.steps.map((step) => ({
		id: step.id,
		label: step.skillMention ? invokingSkillLabel(step.skillMention) : step.label,
		description: step.byline,
		status: step.status,
		icon: stepIcon(step.iconKey),
	}));

	return (
		<ChainOfThoughtScenario
			animateStepEntrance
			state={state}
			headerLabel={headerLabel}
			duration={payload.durationSeconds}
			steps={steps}
		/>
	);
}

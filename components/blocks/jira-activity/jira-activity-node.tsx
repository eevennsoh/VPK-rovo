import AddIcon from "@atlaskit/icon/core/add";
import BranchIcon from "@atlaskit/icon/core/branch";
import ProjectStatusIcon from "@atlaskit/icon/core/project-status";
import StopwatchIcon from "@atlaskit/icon/core/stopwatch";
import TagIcon from "@atlaskit/icon/core/tag";
import PersonAssigneeIcon from "@atlaskit/icon-lab/core/person-assignee";
import TeamworkGraphIcon from "@atlaskit/icon-lab/core/teamwork-graph";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";

import type { JiraActivityActor, JiraActivityEventIcon } from "./jira-activity-types";

// All ADS core icons share one signature, so `typeof AddIcon` types the whole map.
const EVENT_ICON: Record<JiraActivityEventIcon, typeof AddIcon> = {
	created: AddIcon,
	label: TagIcon,
	sla: StopwatchIcon,
	status: ProjectStatusIcon,
	delegated: PersonAssigneeIcon,
	"in-progress": ProjectStatusIcon,
	linked: BranchIcon,
	"teamwork-graph": TeamworkGraphIcon,
};

function initialsOf(name: string): string {
	return (
		name
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase())
			.join("") || "?"
	);
}

function ActorGlyph({ actor }: Readonly<{ actor: JiraActivityActor }>) {
	if (actor.kind === "person") {
		return (
			<Avatar label={actor.name} size="xs">
				{actor.avatarSrc ? <AvatarImage alt="" src={actor.avatarSrc} /> : null}
				<AvatarFallback>{initialsOf(actor.name)}</AvatarFallback>
			</Avatar>
		);
	}

	// Agents render as hexagon art; apps render their third-party brand mark.
	return (
		<AgentAvatarVisual
			avatarSrc={actor.avatarSrc}
			brandName={actor.brandName}
			fallbackText={initialsOf(actor.name)}
			label={actor.name}
			sizePx={16}
			vpkLogo={actor.vpkLogo}
		/>
	);
}

function EventGlyph({ icon }: Readonly<{ icon: JiraActivityEventIcon }>) {
	const IconComponent = EVENT_ICON[icon];
	return (
		<Icon
			aria-hidden
			className="text-icon-subtle"
			render={<IconComponent color="currentColor" label="" size="small" />}
		/>
	);
}

/**
 * Leading timeline cell: an actor avatar (person / agent / app) or a neutral
 * event glyph, above a `w-px` connector that threads to the next entry. The
 * connector is omitted on the last entry. Spine lifted from
 * `components/ui/progress-tracker.tsx`.
 */
export function JiraActivityNode({
	actor,
	icon,
	isLast,
}: Readonly<{
	actor: JiraActivityActor;
	icon?: JiraActivityEventIcon;
	isLast: boolean;
}>) {
	return (
		<div className="flex w-6 shrink-0 flex-col items-center">
			<div className="flex h-6 shrink-0 items-center justify-center">
				{icon ? <EventGlyph icon={icon} /> : <ActorGlyph actor={actor} />}
			</div>
			{isLast ? null : <div className="min-h-4 w-px flex-1 bg-border" />}
		</div>
	);
}

import AddIcon from "@atlaskit/icon/core/add";
import BranchIcon from "@atlaskit/icon/core/branch";
import ClockIcon from "@atlaskit/icon/core/clock";
import RadioUncheckedIcon from "@atlaskit/icon/core/radio-unchecked";
import ShortcutIcon from "@atlaskit/icon/core/shortcut";
import StopwatchIcon from "@atlaskit/icon/core/stopwatch";
import TagIcon from "@atlaskit/icon/core/tag";

import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import type { JiraActivityActor, JiraActivityEventIcon } from "./jira-activity-types";

// All ADS core icons share one signature, so `typeof AddIcon` types the whole map.
const EVENT_ICON: Record<JiraActivityEventIcon, typeof AddIcon> = {
	created: AddIcon,
	label: TagIcon,
	sla: StopwatchIcon,
	status: RadioUncheckedIcon,
	delegated: ShortcutIcon,
	"in-progress": ClockIcon,
	linked: BranchIcon,
};

// Most glyphs read as subtle; the in-progress clock carries the warning accent
// to echo the "In Progress" status color.
const EVENT_ICON_COLOR: Partial<Record<JiraActivityEventIcon, string>> = {
	"in-progress": "text-icon-warning",
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
		/>
	);
}

function EventGlyph({ icon }: Readonly<{ icon: JiraActivityEventIcon }>) {
	const IconComponent = EVENT_ICON[icon];
	return (
		<Icon
			aria-hidden
			className={cn("text-icon-subtle", EVENT_ICON_COLOR[icon])}
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

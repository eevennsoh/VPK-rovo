"use client";

import * as React from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
	EntityCard,
	type EntityCardIcon,
	type EntityCardSource,
} from "@/components/ui-custom/entity-card";
import { cn } from "@/lib/utils";

export type SkillCardIcon = EntityCardIcon;
export type SkillCardSource = EntityCardSource;

export type SkillCardRootProps = React.ComponentProps<typeof HoverCard>;

function SkillCardRoot(props: Readonly<SkillCardRootProps>) {
	return <HoverCard {...props} />;
}

export type SkillCardTriggerProps = React.ComponentProps<typeof HoverCardTrigger>;

function SkillCardTrigger(props: Readonly<SkillCardTriggerProps>) {
	return <HoverCardTrigger {...props} />;
}

export interface SkillCardContentProps
	extends Omit<React.ComponentProps<typeof HoverCardContent>, "children"> {
	skillName: string;
	description?: string;
	icon?: SkillCardIcon;
	source?: SkillCardSource;
}

function SkillCardContent({
	skillName,
	description,
	icon,
	source,
	className,
	side = "top",
	sideOffset = 8,
	align = "center",
	alignOffset = 0,
	...props
}: Readonly<SkillCardContentProps>) {
	return (
		<HoverCardContent
			side={side}
			sideOffset={sideOffset}
			align={align}
			alignOffset={alignOffset}
			className={cn("w-80 rounded-md bg-surface-overlay p-4 shadow-2xl", className)}
			{...props}
		>
			<EntityCard.Skill
				density="preview"
				description={description}
				iconMeta={icon}
				name={skillName}
				source={source}
			/>
		</HoverCardContent>
	);
}

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export const SkillCard = {
	Root: SkillCardRoot,
	Trigger: SkillCardTrigger,
	Content: SkillCardContent,
} as const;

export {
	SkillCardRoot,
	SkillCardTrigger,
	SkillCardContent,
};

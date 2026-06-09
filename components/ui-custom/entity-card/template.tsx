"use client";

import Image from "next/image";
import { type ReactNode } from "react";

import { SkillTag, SkillTagGroup, type SkillTagColor } from "@/components/ui-custom/skill-tag";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { cn } from "@/lib/utils";

import {
	EntityCardDescription,
	EntityCardHeader,
	EntityCardSection,
} from "./parts";

export interface EntityCardTemplateSkill {
	label: string;
	color?: SkillTagColor;
	icon?: ReactNode;
}

export interface EntityCardTemplateProps {
	name: string;
	iconSrc: string;
	description?: string;
	sources?: ReadonlyArray<TwgToolSource>;
	skills?: ReadonlyArray<EntityCardTemplateSkill>;
	className?: string;
}

export function EntityCardTemplate({
	name,
	iconSrc,
	description,
	sources = [],
	skills = [],
	className,
}: Readonly<EntityCardTemplateProps>) {
	return (
		<div data-slot="entity-card-template" className={cn("contents", className)}>
			<EntityCardHeader
				leading={
					<Image alt="" aria-hidden className="size-8 object-contain" height={32} src={iconSrc} width={32} />
				}
				title={name}
			/>

			<EntityCardDescription>
				{description ?? `Learn how ${name} can help your team work faster.`}
			</EntityCardDescription>

			{sources.length > 0 ? (
				<EntityCardSection label="Works with">
					<TWGAppstack animated={false} className="justify-start" iconSize="md" maxVisible={6} sources={sources} />
				</EntityCardSection>
			) : null}

			{skills.length > 0 ? (
				<EntityCardSection label="Skills">
					<SkillTagGroup maxRows={2}>
						{skills.map((skill) => (
							<SkillTag color={skill.color ?? "default"} icon={skill.icon} key={skill.label}>
								{skill.label}
							</SkillTag>
						))}
					</SkillTagGroup>
				</EntityCardSection>
			) : null}
		</div>
	);
}

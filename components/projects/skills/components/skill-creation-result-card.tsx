"use client";

import type { ComponentProps } from "react";

import {
	GenerativeCard,
	GenerativeCardBody,
	GenerativeCardContent,
	GenerativeCardFooter,
	GenerativeCardHeader,
} from "@/components/blocks/generative-card";
import { Button } from "@/components/ui/button";
import { Tile } from "@/components/ui/tile";
import { getSkillIcon } from "@/app/data/directory/skills";
import {
	getSkillCollectionMetadata,
	SKILL_COLLECTIONS,
	type SkillCollectionMetadata,
	type SkillCollectionId,
} from "@/app/data/directory/skill-collections";
import type { SkillIconKey } from "@/app/data/directory/types";
import type { SkillCreationResultPayload } from "../lib/create-skill-flow";

type SkillResultTileVariant = NonNullable<ComponentProps<typeof Tile>["variant"]>;

interface SkillCreationResultCardProps {
	payload: SkillCreationResultPayload;
	onEdit: (skillId: string) => void;
}

const SKILL_ICON_TILE_TO_TILE_VARIANTS = {
	transparent: "transparent",
	gray: "graySubtle",
	blue: "blueSubtle",
	teal: "tealSubtle",
	green: "greenSubtle",
	lime: "limeSubtle",
	yellow: "yellowSubtle",
	orange: "orangeSubtle",
	red: "redSubtle",
	magenta: "magentaSubtle",
	purple: "purpleSubtle",
	grayBold: "grayBold",
	blueBold: "blueBold",
	tealBold: "tealBold",
	greenBold: "greenBold",
	limeBold: "limeBold",
	yellowBold: "yellowBold",
	orangeBold: "orangeBold",
	redBold: "redBold",
	magentaBold: "magentaBold",
	purpleBold: "purpleBold",
} as const satisfies Record<SkillCollectionMetadata["iconTileVariant"], SkillResultTileVariant>;

function isSkillCollectionId(collectionId: string): collectionId is SkillCollectionId {
	return collectionId in SKILL_COLLECTIONS;
}

function getSkillResultTileVariant(collectionId: string): SkillResultTileVariant {
	const resolvedCollectionId = isSkillCollectionId(collectionId) ? collectionId : "default";
	return SKILL_ICON_TILE_TO_TILE_VARIANTS[getSkillCollectionMetadata(resolvedCollectionId).iconTileVariant];
}

/**
 * The generated-skill result card. A plain card (no WebGL/entrance animation):
 * header is the skill name, the body is its description, and the footer holds the
 * single **Edit** CTA that opens the skill config dialog.
 */
export function SkillCreationResultCard({ payload, onEdit }: Readonly<SkillCreationResultCardProps>) {
	return (
		<GenerativeCard className="w-full">
			<GenerativeCardHeader
				showToggle={false}
				title={payload.name}
				leading={(
					<Tile label={payload.name} size="medium" variant={getSkillResultTileVariant(payload.collectionId)}>
						{getSkillIcon(payload.iconKey as SkillIconKey)}
					</Tile>
				)}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent className="py-3 text-sm leading-5 text-text-subtle">
					{payload.description}
				</GenerativeCardContent>
				<GenerativeCardFooter>
					<Button type="button" variant="outline" onClick={() => onEdit(payload.skillId)}>
						Edit
					</Button>
				</GenerativeCardFooter>
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

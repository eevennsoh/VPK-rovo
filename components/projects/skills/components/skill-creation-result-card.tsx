"use client";

import { useState, type ComponentProps } from "react";
import EditIcon from "@atlaskit/icon/core/edit";

import {
	GenerativeCard,
	GenerativeCardBody,
	GenerativeCardContent,
	GenerativeCardFooter,
	GenerativeCardHeader,
} from "@/components/blocks/generative-card";
import { Button } from "@/components/ui/button";
import { Tile } from "@/components/ui/tile";
import { SkillTag } from "@/components/ui-custom/skill-tag";
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
 * header is the skill name, the body is its description, and the edit action is
 * in the footer while expanded or the header while collapsed.
 */
export function SkillCreationResultCard({ payload, onEdit }: Readonly<SkillCreationResultCardProps>) {
	const skillTagColor = isSkillCollectionId(payload.collectionId) ? payload.collectionId : "default";
	const [isExpanded, setExpanded] = useState(true);

	return (
		<>
			{payload.showSuccessSummary ? (
				<p className="mb-3 text-sm leading-6 text-text">
					Created{" "}
					<SkillTag className="mx-1" color={skillTagColor} icon={getSkillIcon(payload.iconKey as SkillIconKey)}>
						{payload.name}
					</SkillTag>{" "}
					and added it to your skills. I prefilled the composer with its skill tag so you can run it now, or open the card to edit the generated instructions.
				</p>
			) : null}
			<GenerativeCard className="w-full" expanded={isExpanded} onExpandedChange={setExpanded}>
				<GenerativeCardHeader
					action={!isExpanded ? (
						<Button
							variant="ghost"
							size="icon"
							className="text-icon-subtle"
							onClick={() => onEdit(payload.skillId)}
							type="button"
							aria-label="Edit skill"
						>
							<EditIcon label="" size="small" />
						</Button>
					) : null}
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
		</>
	);
}

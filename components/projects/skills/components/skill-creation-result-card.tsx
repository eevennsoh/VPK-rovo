"use client";

import EditIcon from "@atlaskit/icon/core/edit";
import { GenerativeCard, GenerativeCardFooter } from "@/components/blocks/generative-card";
import { Button } from "@/components/ui/button";
import { getSkillIcon } from "@/app/data/directory/skills";
import type { SkillIconKey } from "@/app/data/directory/types";
import type { SkillCreationResultPayload } from "../lib/create-skill-flow";

interface SkillCreationResultCardProps {
	payload: SkillCreationResultPayload;
	onEdit: (skillId: string) => void;
}

/**
 * The generated-skill result card. A plain card (no WebGL/entrance animation):
 * header is the skill name, the body is its description, and the footer holds the
 * single **Edit** CTA that opens the skill config dialog.
 */
export function SkillCreationResultCard({ payload, onEdit }: Readonly<SkillCreationResultCardProps>) {
	return (
		<GenerativeCard className="w-full">
			{/* Header: skill name (with its icon) */}
			<div className="flex items-center gap-2.5 border-b px-4 py-3">
				<span className="flex size-6 shrink-0 items-center justify-center text-text-subtle [&_span]:size-4! [&_svg]:size-4!">
					{getSkillIcon(payload.iconKey as SkillIconKey)}
				</span>
				<p className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{payload.name}</p>
			</div>
			{/* Body: description */}
			<div className="px-4 py-3 text-sm leading-5 text-text-subtle">{payload.description}</div>
			{/* Footer: single Edit CTA */}
			<GenerativeCardFooter className="border-t">
				<Button type="button" onClick={() => onEdit(payload.skillId)}>
					<EditIcon label="" size="small" />
					Edit
				</Button>
			</GenerativeCardFooter>
		</GenerativeCard>
	);
}

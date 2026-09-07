"use client";

import { useMemo } from "react";

import type { JiraIssueAgentSessionTransferMember } from "@/components/blocks/jira-issue/agent-session-drag";
import {
	JiraLinking,
	type JiraLinkingIdentity,
} from "@/components/blocks/jira-linking";

import { resolveAgentBrandTint } from "../lib/agent-brand-tint";
import type { BoardAgentSessionAttachProximity } from "../lib/board-agent-session-drag";
import { toSessionFusionTarget } from "../lib/session-fusion-overlay-state";

/**
 * Both drag sources put this attribute on the centred inner chip node. The
 * outer portal wrapper's border box ignores that child's transform, so
 * measuring the wrapper instead would be off by half the chip in both axes.
 */
const CHIP_SELECTOR = "[data-session-drag-overlay] [data-session-fusion-chip]";

/**
 * Below both drag-chip portals (z-[400] detached, z-[300] chin) so the goo forms
 * behind the chip and its label stays readable.
 */
const FUSION_Z_INDEX = 290;

/**
 * Board agents identify through a brand logo *component* rather than an image
 * URL, so the shared effect gets a resolved brand tint instead of an `imageSrc`
 * for most drags. `tintSeed` is passed through untouched as the fallback seed,
 * so an agent we have no brand colour for still melts in its own stable hue.
 */
function toLinkingIdentities(
	members: readonly JiraIssueAgentSessionTransferMember[] | null,
): readonly JiraLinkingIdentity[] | null {
	if (!members) {
		return null;
	}

	return members.map((member) => ({
		id: member.id,
		imageSrc: member.avatarSrc,
		tint: resolveAgentBrandTint(member.tintSeed),
		tintSeed: member.tintSeed || member.name || member.id,
	}));
}

export interface SessionFusionOverlayProps {
	/** Cohort being dragged, or null between drags. */
	members: readonly JiraIssueAgentSessionTransferMember[] | null;
	/** Nearest eligible issue card during the approach. */
	proximity: BoardAgentSessionAttachProximity | null;
}

/**
 * Board adapter for the reusable Jira linking.
 *
 * Approach only. The drop is acknowledged by a brand sweep across the chin rows
 * the sessions land in — see `toBoardAgentSessionLinkFlash` — rather than by
 * animating the field across the card to reach them, so this never arms the
 * effect's release fuse.
 */
export function SessionFusionOverlay({
	members,
	proximity,
}: Readonly<SessionFusionOverlayProps>) {
	const identities = useMemo(() => toLinkingIdentities(members), [members]);

	return (
		<JiraLinking
			identities={identities}
			nearness={proximity?.nearness ?? 0}
			release={null}
			sourceSelector={CHIP_SELECTOR}
			target={toSessionFusionTarget(proximity)}
			zIndex={FUSION_Z_INDEX}
		/>
	);
}

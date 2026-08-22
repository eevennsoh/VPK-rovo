import type { JiraActivityActor, JiraActivitySegment } from "./jira-activity-types";

export function activityActorVpkLogo(
	actor: Pick<JiraActivityActor, "id" | "kind" | "name">,
): "rovo" | undefined {
	if (actor.kind !== "agent") return undefined;
	if (actor.name === "Rovo" || actor.id === "rovo" || actor.id === "rovo-dev") {
		return "rovo";
	}
	return undefined;
}

/**
 * Maps a timeline actor to the matching inline mention segment so event
 * prefixes and authored mention chips share one segment model.
 */
export function mentionSegmentForActor(actor: JiraActivityActor): JiraActivitySegment {
	switch (actor.kind) {
		case "person":
			return {
				type: "user-mention",
				text: actor.name,
				...(actor.avatarSrc ? { avatarSrc: actor.avatarSrc } : {}),
			};
		case "agent": {
			const vpkLogo = activityActorVpkLogo(actor);
			return {
				type: "agent-mention",
				text: actor.name,
				...(vpkLogo
					? { vpkLogo }
					: {
						...(actor.avatarSrc ? { avatarSrc: actor.avatarSrc } : {}),
						...(actor.brandName ? { brandName: actor.brandName } : {}),
					}),
			};
		}
		case "app":
			return {
				type: "app-mention",
				text: actor.name,
				...(actor.brandName ? { brandName: actor.brandName } : {}),
			};
		default: {
			const _exhaustive: never = actor.kind;
			throw new Error(`Unhandled activity actor kind: ${_exhaustive}`);
		}
	}
}

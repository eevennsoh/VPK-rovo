import type {
	JiraActivityActor,
	JiraActivityEntry,
	JiraActivitySegment,
} from "@/components/blocks/jira-activity";

import type {
	PullRequestActivity,
	PullRequestActivityActor,
} from "./pull-request-detail-data";

function adaptActor(actor: PullRequestActivityActor): JiraActivityActor {
	const brandName = actor.kind === "app"
		? actor.id === "codex"
			? "openai"
			: actor.id.startsWith("github") ? "github" : undefined
		: undefined;
	return {
		id: actor.id,
		name: actor.name,
		kind: actor.kind,
		avatarSrc: actor.avatarSrc,
		brandName,
	};
}

function adaptDetail(detail: { label: string; body: string } | undefined) {
	return detail
		? {
				label: detail.label,
				content: [{ type: "text", text: detail.body }] as const,
			}
		: undefined;
}

function reviewBody(activity: Extract<PullRequestActivity, { kind: "review-submitted" }>): JiraActivitySegment[] {
	const decision = activity.decision === "approved"
		? "approved this pull request. "
		: activity.decision === "changes-requested"
			? "requested changes. "
			: "reviewed this pull request. ";
	return [
		{ type: "text", text: decision + activity.body },
		...(activity.filePath
			? [
					{ type: "text", text: " Reviewed " } as const,
					{ type: "link", text: activity.filePath } as const,
				]
			: []),
	];
}

function adaptActivity(activity: PullRequestActivity): JiraActivityEntry {
	const base = {
		id: `pull-request-${activity.id}`,
		actor: adaptActor(activity.actor),
		timestamp: activity.timestamp,
	};

	switch (activity.kind) {
		case "opened":
			return {
				...base,
				kind: "event",
				segments: [
					{ type: "text", text: "opened the pull request from " },
					{ type: "code", text: activity.headBranch },
					{ type: "text", text: " into " },
					{ type: "code", text: activity.baseBranch },
				],
			};
		case "commits-pushed":
			return {
				...base,
				kind: "event",
				segments: [
					{ type: "text", text: `pushed ${activity.commitCount} commits ending in ` },
					{ type: "code", text: activity.headSha },
				],
			};
		case "checks-completed":
			return {
				...base,
				kind: "event",
				segments: [
					{ type: "text", text: "completed checks: " },
					{
						type: "lozenge",
						text: `${activity.passed}/${activity.total} passed`,
						variant: activity.passed === activity.total ? "success" : "danger",
					},
				],
			};
		case "comment-posted":
			return {
				...base,
				kind: "comment",
				tag: activity.tag ? { text: activity.tag } : undefined,
				body: [{ type: "text", text: activity.body }],
				collapsible: adaptDetail(activity.detail),
				allowReply: false,
			};
		case "review-submitted":
			return {
				...base,
				kind: "comment",
				tag: activity.decision === "approved"
					? { text: "Approved", color: "green" }
					: activity.decision === "changes-requested"
						? { text: "Changes requested", color: "red" }
						: { text: "Reviewed", color: "blue" },
				body: reviewBody(activity),
				collapsible: adaptDetail(activity.detail),
				replies: activity.replies?.map((reply) => ({
					id: reply.id,
					actor: adaptActor(reply.actor),
					timestamp: reply.timestamp,
					body: reply.body,
				})),
				allowReply: activity.allowReply ?? false,
			};
		case "thread-resolved":
			return {
				...base,
				kind: "event",
				segments: [
					{ type: "text", text: "resolved a review thread in " },
					{ type: "link", text: activity.filePath },
				],
			};
		case "ready-to-merge":
			return {
				...base,
				kind: "event",
				segments: [
					{ type: "text", text: "marked the pull request " },
					{ type: "lozenge", text: "Ready to merge", variant: "success" },
				],
			};
	}
}

/** Adapts provider-neutral SCM activity into Jira Activity's oldest-first timeline contract. */
export function adaptPullRequestActivity(
	activity: readonly PullRequestActivity[],
): JiraActivityEntry[] {
	return activity
		.map((item, index) => ({ item, index }))
		.sort((left, right) => (
			left.item.occurredAtMs - right.item.occurredAtMs
			|| left.index - right.index
		))
		.map(({ item }) => adaptActivity(item));
}

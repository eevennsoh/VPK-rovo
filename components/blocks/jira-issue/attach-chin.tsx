import { token } from "@/lib/tokens";

/**
 * Occupied-slot attach placeholder. Same `h-6` as an activity row so replacing
 * the last chin row does not change card height.
 */
export function JiraIssueAttachChinSlot({
	copy,
}: Readonly<{ copy: string }>) {
	return (
		<div
			aria-hidden
			className="pointer-events-none flex h-6 w-full items-center justify-center rounded-md"
			data-slot="jira-issue-attach-chin-slot"
		>
			<span className="text-xs font-normal text-text-subtlest">
				{copy}
			</span>
		</div>
	);
}

/**
 * Same footprint as a `medium-detached` AgentSession row (`h-[33px]` plus the
 * 2px gap those pills use under the shell) so attach copy can take that slot
 * without growing a second chin.
 */
export function JiraIssueDetachedAttachChinSlot({
	copy,
}: Readonly<{ copy: string }>) {
	return (
		<div
			className="flex h-[33px] w-full items-center justify-center"
			data-slot="jira-issue-attach-chin"
			style={{ marginTop: token("space.025") }}
		>
			<JiraIssueAttachChinSlot copy={copy} />
		</div>
	);
}

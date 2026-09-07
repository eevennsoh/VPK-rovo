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

import { Fragment } from "react";
import TaskIcon from "@atlaskit/icon/core/task";

import { tokenizePulseProse } from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-prose";
import { Lozenge } from "@/components/ui/lozenge";

/**
 * Renders one Pulse outcome string with issue-key lozenges and type-name code.
 *
 * Shared by the story paragraphs, member-scoped summaries, and the signal /
 * action rows so every insight uses the same highlighter.
 */
export function PulseProseText({ text }: Readonly<{ text: string }>) {
	return tokenizePulseProse(text).map((token, index) => {
		const key = `${token.type}:${index}:${token.value}`;
		switch (token.type) {
			case "text":
				return <Fragment key={key}>{token.value}</Fragment>;
			case "code":
				return (
					<code
						className="rounded-xs bg-bg-neutral px-1 py-px align-middle text-[0.875em] leading-none text-text"
						data-pulse-prose="code"
						key={key}
					>
						{token.value}
					</code>
				);
			case "issue-key":
				return (
					<Lozenge
						className="mx-0.5 align-middle"
						data-pulse-prose="issue-key"
						elemBefore={<TaskIcon color="var(--ds-icon-brand)" label="Task" />}
						key={key}
						size="compact"
						variant="neutral"
					>
						{token.value}
					</Lozenge>
				);
			default: {
				const _exhaustive: never = token;
				return _exhaustive;
			}
		}
	});
}

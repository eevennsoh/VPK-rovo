import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import { Comment } from "@/components/ui/comment";
import { Icon } from "@/components/ui/icon";
import { Lozenge } from "@/components/ui/lozenge";
import { token } from "@/lib/tokens";

import type { PullRequestDetailData } from "../../lib/pull-request-detail-data";

export function PullRequestOverview({ data }: Readonly<{ data: PullRequestDetailData }>) {
	const review = data.guidedReview;
	if (!review) {
		return (
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.6fr)]">
				<section className="rounded-lg bg-surface-raised p-4">
					<h2 className="text-text" style={{ font: token("font.heading.small") }}>
						Pull request details
					</h2>
					<dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
						<dt className="text-text-subtle">Repository</dt>
						<dd className="min-w-0 truncate text-text">{data.repository}</dd>
						<dt className="text-text-subtle">Status</dt>
						<dd className="text-text">{data.status}</dd>
						<dt className="text-text-subtle">Changes</dt>
						<dd className="flex gap-2">
							<span className="text-text-success">+{data.additions}</span>
							<span className="text-text-danger">-{data.deletions}</span>
						</dd>
					</dl>
				</section>
				<aside className="rounded-lg bg-bg-neutral p-4">
					<h2 className="text-sm font-semibold text-text">Guided review unavailable</h2>
					<p className="mt-1 text-sm text-text-subtle">
						This pull request has metadata only. Open it in GitHub to review its changes.
					</p>
				</aside>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8">
			<section aria-labelledby="pull-request-description-heading">
				<h2
					className="text-text"
					id="pull-request-description-heading"
					style={{ font: token("font.heading.small") }}
				>
					Description
				</h2>
				<div className="mt-3 rounded-lg border border-border bg-surface-raised p-4">
					<h2 className="text-text" style={{ font: token("font.heading.small") }}>
						Summary
					</h2>
					<ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-text-subtle">
						{review.summary.map((item) => <li key={item}>{item}</li>)}
					</ul>
				</div>
			</section>
			<section aria-labelledby="pull-request-checks-heading">
				<div className="flex flex-wrap items-baseline justify-between gap-2">
					<h2
						className="text-text"
						id="pull-request-checks-heading"
						style={{ font: token("font.heading.small") }}
					>
						Checks
					</h2>
					<p className="text-xs text-text-subtle">
						{review.testGroups.length} groups passed · {review.totalChecks} checks
					</p>
				</div>
				<ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface-raised px-3">
						{review.testGroups.map((group) => (
							<li className="flex items-center gap-2 py-2 text-sm" key={group.id}>
								<Icon
									aria-hidden
									className="text-icon-success"
									render={<StatusSuccessIcon label="" size="small" />}
								/>
								<span className="min-w-0 flex-1 text-text">{group.label}</span>
								<span className="shrink-0 text-xs text-text-subtle">{group.checks} checks</span>
							</li>
						))}
				</ul>
			</section>
			<section aria-labelledby="pull-request-activity-heading">
				<h2
					className="text-text"
					id="pull-request-activity-heading"
					style={{ font: token("font.heading.small") }}
				>
					Activity
				</h2>
				<ol className="mt-3 space-y-3">
					{review.discussion.map((item) => (
						<li key={item.id}>
							<Comment
								author={item.author}
								avatarSrc={item.avatarSrc}
								className="rounded-lg border border-border bg-surface-raised p-3"
								time={item.timestamp}
								type={item.type}
							>
								<p className="mt-1 text-text-subtle">{item.body}</p>
								{item.filePath ? (
									<div className="mt-3 flex min-w-0 items-center gap-2 rounded-md bg-bg-neutral px-3 py-2 text-xs">
										<code className="min-w-0 flex-1 truncate text-text-subtle">{item.filePath}</code>
										{item.resolved ? <Lozenge variant="success">Resolved</Lozenge> : null}
									</div>
								) : null}
							</Comment>
						</li>
					))}
				</ol>
			</section>
		</div>
	);
}

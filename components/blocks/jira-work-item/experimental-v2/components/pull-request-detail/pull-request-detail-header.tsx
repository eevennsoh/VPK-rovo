import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { Lozenge } from "@/components/ui/lozenge";
import { ArrowLeftIcon, ExternalLinkIcon } from "@/components/ui/vpk-icons";
import { token } from "@/lib/tokens";

import type { PullRequestDetailData } from "../../lib/pull-request-detail-data";

interface PullRequestDetailHeaderProps {
	data: PullRequestDetailData;
	onBack: () => void;
}

export function PullRequestDetailHeader({
	data,
	onBack,
}: Readonly<PullRequestDetailHeaderProps>) {
	return (
		<header
			className="border-b border-border px-4 py-4 sm:px-6"
			data-jira-work-item-pull-request-detail-header
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-start gap-2">
					<Button
						aria-label="Back to description"
						onClick={onBack}
						size="icon-compact"
						type="button"
						variant="ghost"
					>
						<ArrowLeftIcon aria-hidden data-icon="inline-start" size="small" />
					</Button>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<span className="shrink-0 text-text-subtle">#{data.number}</span>
							<h1
								className="min-w-0 text-text"
								style={{ font: token("font.heading.medium") }}
							>
								{data.title}
							</h1>
							<Lozenge variant={data.status === "Merged" ? "discovery" : "success"}>
								{data.status}
							</Lozenge>
						</div>
						<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-text-subtle">
							<Avatar label={data.authorName} size="xs">
								{data.authorAvatarSrc ? <AvatarImage alt="" src={data.authorAvatarSrc} /> : null}
								<AvatarFallback>{data.authorName.slice(0, 1).toUpperCase()}</AvatarFallback>
							</Avatar>
							<span className="font-medium text-text">{data.authorName}</span>
							{data.baseBranch && data.headBranch ? (
								<>
									<code className="rounded-sm bg-bg-neutral px-1.5 py-0.5 text-text">{data.baseBranch}</code>
									<span aria-hidden>←</span>
									<code className="max-w-full truncate rounded-sm bg-bg-neutral px-1.5 py-0.5 text-text">
										{data.headBranch}
									</code>
								</>
							) : null}
						</div>
					</div>
				</div>
				<Button
					className="w-full sm:w-auto"
					nativeButton={false}
					render={
						<a
							href={data.url}
							rel="noreferrer noopener"
							target="_blank"
						/>
					}
					variant="outline"
				>
					Open in GitHub
					<ExternalLinkIcon aria-hidden data-icon="inline-end" size="small" />
				</Button>
			</div>
			<div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-text-subtle">
				<span className="inline-flex min-w-0 items-center gap-1.5">
					<GithubLogo aria-hidden borderless label="" size="xxsmall" />
					<span className="truncate">{data.repository}</span>
				</span>
				<span className="flex shrink-0 items-center gap-2">
					<span className="text-text-success">+{data.additions}</span>
					<span className="text-text-danger">-{data.deletions}</span>
					<span aria-hidden>·</span>
					<span>Updated {data.updatedTime}</span>
				</span>
			</div>
		</header>
	);
}

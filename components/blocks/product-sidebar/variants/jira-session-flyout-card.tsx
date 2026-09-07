import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared 320px overlay chrome for Jira session hover cards: title + meta header,
 * optional trailing lozenge, and a top-bordered footer. Hover surfaces get
 * overlay background + shadow from the parent flyout — no extra outer border.
 */
export function JiraSessionFlyoutCard({
	"aria-labelledby": ariaLabelledBy,
	children,
	footerClassName = "gap-3",
	meta,
	title,
	titleId,
	trailing,
}: Readonly<{
	"aria-labelledby"?: string;
	children: ReactNode;
	footerClassName?: string;
	meta: ReactNode;
	title: string;
	titleId: string;
	trailing?: ReactNode;
}>) {
	return (
		<section
			aria-labelledby={ariaLabelledBy ?? titleId}
			className="flex w-[320px] max-w-[calc(100vw-48px)] flex-col gap-3 pt-3 text-text"
		>
			<div className="flex items-start gap-3 px-3">
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<h2 className="min-w-0 text-sm leading-5 font-normal text-text" id={titleId} title={title}>
						{title}
					</h2>
					{meta}
				</div>
				{trailing ?? null}
			</div>
			<div className={cn("flex flex-col border-t border-border-disabled p-3", footerClassName)}>
				{children}
			</div>
		</section>
	);
}

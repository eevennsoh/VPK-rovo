import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MetadataPathLinkProps {
	children: ReactNode;
	className?: string;
	segmented?: boolean;
	title?: string;
}

/** A hover-underlined metadata link whose path segments keep their own text color. */
export function MetadataPathLink({
	children,
	className,
	segmented = false,
	title,
}: Readonly<MetadataPathLinkProps>): React.ReactElement {
	return (
		<a
			className={cn(
				"group min-w-0 truncate rounded-[3px] no-underline decoration-current outline-none",
				segmented ? null : "hover:underline focus-visible:underline",
				className,
			)}
			href="#"
			title={title}
		>
			{children}
		</a>
	);
}

/** Emphasizes the final segment of a slash-delimited metadata path. */
export function MetadataPathValue({ path }: Readonly<{ path: string }>): React.ReactElement {
	const lastSlash = path.lastIndexOf("/");
	if (lastSlash === -1) {
		return (
			<span className="text-text decoration-current group-hover:underline group-focus-visible:underline">
				{path}
			</span>
		);
	}

	const prefix = path.slice(0, lastSlash + 1);
	const tail = path.slice(lastSlash + 1);
	return (
		<>
			<span className="text-text-subtlest decoration-current group-hover:underline group-focus-visible:underline">
				{prefix}
			</span>
			<span className="text-text decoration-current group-hover:underline group-focus-visible:underline">
				{tail}
			</span>
		</>
	);
}

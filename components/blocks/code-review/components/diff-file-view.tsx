"use client";

import { MultiFileDiff } from "@pierre/diffs/react";

import { useTheme } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";

import type { ChangedFile, DiffLayout } from "../data/types";

interface DiffFileViewProps {
	file: ChangedFile;
	layout: DiffLayout;
	className?: string;
}

const DIFF_TOP_INSET_CSS = `
[data-diffs-header] ~ [data-diff] [data-code] {
	padding-top: var(--diffs-gap-inline, var(--diffs-gap-fallback));
}
`;

export function DiffFileView({ file, layout, className }: Readonly<DiffFileViewProps>) {
	const { actualTheme } = useTheme();

	return (
		<MultiFileDiff
			className={cn(className)}
			// disableFileHeader breaks light-mode rendering entirely (rows never mount);
			// a null custom header removes the built-in header without that code path.
			renderCustomHeader={() => null}
			oldFile={{
				name: file.path,
				contents: file.oldContents,
				lang: file.language,
			}}
			newFile={{
				name: file.path,
				contents: file.newContents,
				lang: file.language,
			}}
			options={{
				diffStyle: layout,
				unsafeCSS: DIFF_TOP_INSET_CSS,
				theme: {
					light: "github-light",
					dark: "github-dark",
				},
				themeType: actualTheme,
			}}
		/>
	);
}

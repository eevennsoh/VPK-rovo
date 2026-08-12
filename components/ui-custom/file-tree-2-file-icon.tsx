"use client";

import { createFileTreeIconResolver } from "@pierre/trees";
import { useMemo, type HTMLAttributes } from "react";

import {
	fileTree2IconColorStyles,
	getFileTree2IconSpriteSheet,
	type FileTree2Icons,
} from "@/components/ui-custom/file-tree-2-file-icon-helpers";
import { cn } from "@/lib/utils";

export type { FileTree2Icons };

interface FileTree2IconSpriteProps {
	icons?: FileTree2Icons;
}

export function FileTree2IconSprite({ icons = "complete" }: Readonly<FileTree2IconSpriteProps>) {
	return (
		<div
			aria-hidden="true"
			className="absolute size-0 overflow-hidden"
			dangerouslySetInnerHTML={{ __html: getFileTree2IconSpriteSheet(icons) }}
		/>
	);
}

interface FileTree2FileIconProps extends Omit<HTMLAttributes<SVGSVGElement>, "children"> {
	colored?: boolean;
	icons?: FileTree2Icons;
	path: string;
}

export function FileTree2FileIcon({
	className,
	colored,
	icons = "complete",
	path,
	...props
}: Readonly<FileTree2FileIconProps>) {
	const iconResolver = useMemo(() => createFileTreeIconResolver(icons), [icons]);
	const coloredIcons = colored ?? (typeof icons === "object" ? (icons.colored ?? true) : true);
	const resolvedIcon = iconResolver.resolveIcon("file-tree-icon-file", path);
	const resolvedIconColor = resolvedIcon?.token && coloredIcons
		? fileTree2IconColorStyles[resolvedIcon.token]
		: "text-icon-subtle";

	return (
		<svg
			aria-hidden="true"
			className={cn("size-4", resolvedIconColor, className)}
			data-icon-name={resolvedIcon?.name}
			data-icon-token={resolvedIcon?.token}
			viewBox={resolvedIcon?.viewBox ?? "0 0 16 16"}
			{...props}
		>
			<use href={`#${resolvedIcon?.name ?? "file-tree-icon-file"}`} />
		</svg>
	);
}

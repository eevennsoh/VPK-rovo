"use client";

import {
	createFileTreeIconResolver,
	getBuiltInSpriteSheet,
	type FileTreeBuiltInIconSet,
	type FileTreeIcons,
} from "@pierre/trees";
import { useMemo, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type FileTree2Icons = FileTreeIcons;

export const fileTree2IconColorStyles: Readonly<Record<string, string>> = {
	astro: "text-icon-accent-purple",
	babel: "text-icon-accent-yellow",
	bash: "text-icon-accent-green",
	biome: "text-icon-accent-blue",
	bootstrap: "text-icon-accent-purple",
	browserslist: "text-icon-accent-yellow",
	bun: "text-icon-accent-gray",
	c: "text-icon-accent-blue",
	claude: "text-icon-accent-orange",
	cpp: "text-icon-accent-blue",
	css: "text-icon-accent-purple",
	database: "text-icon-accent-purple",
	default: "text-icon-accent-gray",
	docker: "text-icon-accent-blue",
	eslint: "text-icon-accent-purple",
	font: "text-icon-accent-gray",
	git: "text-icon-accent-orange",
	go: "text-icon-accent-teal",
	graphql: "text-icon-accent-magenta",
	html: "text-icon-accent-orange",
	image: "text-icon-accent-magenta",
	javascript: "text-icon-accent-yellow",
	json: "text-icon-accent-orange",
	markdown: "text-icon-accent-green",
	mcp: "text-icon-accent-teal",
	nextjs: "text-icon-accent-gray",
	npm: "text-icon-accent-red",
	oxc: "text-icon-accent-teal",
	postcss: "text-icon-accent-red",
	prettier: "text-icon-accent-teal",
	python: "text-icon-accent-blue",
	react: "text-icon-accent-teal",
	ruby: "text-icon-accent-red",
	rust: "text-icon-accent-orange",
	sass: "text-icon-accent-magenta",
	stylelint: "text-icon-accent-gray",
	svelte: "text-icon-accent-red",
	svg: "text-icon-accent-orange",
	svgo: "text-icon-accent-green",
	swift: "text-icon-accent-orange",
	table: "text-icon-accent-teal",
	tailwind: "text-icon-accent-teal",
	terraform: "text-icon-accent-purple",
	text: "text-icon-accent-gray",
	typescript: "text-icon-accent-blue",
	vite: "text-icon-accent-purple",
	vscode: "text-icon-accent-blue",
	vue: "text-icon-accent-green",
	wasm: "text-icon-accent-purple",
	webpack: "text-icon-accent-blue",
	yml: "text-icon-accent-red",
	zig: "text-icon-accent-orange",
	zip: "text-icon-accent-orange",
};

export function getFileTree2IconSet(icons: FileTree2Icons | undefined): FileTreeBuiltInIconSet | "none" {
	if (!icons) {
		return "complete";
	}
	if (typeof icons === "string") {
		return icons;
	}
	if (icons.set) {
		return icons.set;
	}
	return icons.spriteSheet || icons.remap || icons.byFileName || icons.byFileNameContains || icons.byFileExtension
		? "none"
		: "complete";
}

export function getFileTree2IconSpriteSheet(icons: FileTree2Icons = "complete"): string {
	const iconSet = getFileTree2IconSet(icons);
	return `${getBuiltInSpriteSheet(iconSet)}${typeof icons === "object" ? (icons.spriteSheet ?? "") : ""}`;
}

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

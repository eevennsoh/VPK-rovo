"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LockIcon, RefreshCwIcon } from "@/components/ui/vpk-icons";
import {
	FileTree2,
	type FileTree2Item,
	type FileTree2MoveEvent,
} from "@/components/ui-custom/file-tree-2";

const projectItems: readonly FileTree2Item[] = [
	{ path: "public", type: "folder" },
	{ path: "src/components/Button.tsx", status: "added" },
	{ path: "src/components/Card.tsx" },
	{ path: "src/components/Header.tsx" },
	{ path: "src/lib/api.ts" },
	{ path: "src/styles/globals.css" },
	{ path: "src/index.ts", status: "modified" },
	{ path: ".browserslistrc", status: "ignored" },
	{ path: ".gitignore", status: "deleted" },
	{ path: "package.json", status: "renamed" },
	{ path: "README.md", status: "untracked" },
];

const flatteningItems: readonly FileTree2Item[] = [
	{ path: ".github/workflows/ci.yml" },
	{ path: "build/assets/images/social/logo.png" },
	{ path: "build/index.mjs" },
	{ path: "build/scripts.js" },
	{ path: "config/project/settings.json" },
	{ path: "node_modules/react/index.js" },
	{ path: "public/favicon.ico" },
	{ path: "scripts/release.mjs" },
	{ path: "src/index.ts" },
	{ path: ".browserslistrc" },
	{ path: ".gitignore" },
	{ path: "package.json" },
	{ path: "README.md" },
	{ path: "stylelint.config.js" },
];

function moveFileTree2Items(
	items: readonly FileTree2Item[],
	{ nextPath, sourcePath }: FileTree2MoveEvent,
): FileTree2Item[] {
	return items.map((item) => {
		if (item.path === sourcePath) {
			return { ...item, path: nextPath };
		}
		if (item.path.startsWith(`${sourcePath}/`)) {
			return { ...item, path: `${nextPath}${item.path.slice(sourcePath.length)}` };
		}
		return item;
	});
}

export default function FileTree2Demo() {
	const [selectedPath, setSelectedPath] = useState("src/components/Card.tsx");

	return (
		<FileTree2
			className="w-full max-w-sm"
			defaultExpandedPaths={["src", "src/components"]}
			items={projectItems}
			onSelectedPathChange={setSelectedPath}
			searchable
			selectedPath={selectedPath}
		/>
	);
}

export function FileTree2DemoPathFirst() {
	return (
		<FileTree2
			className="w-full max-w-sm"
			defaultExpandedPaths={["app", "app/api"]}
			items={[
				{ path: "app/api/chat/route.ts" },
				{ path: "app/api/search/route.ts" },
				{ path: "app/layout.tsx" },
				{ path: "app/page.tsx" },
				{ path: "lib/utils.ts" },
				{ path: "next.config.ts" },
			]}
		/>
	);
}

export function FileTree2DemoFlattenEmptyDirectories() {
	return (
		<div className="grid w-full max-w-3xl gap-4 md:grid-cols-2">
			<div className="space-y-2">
				<p className="text-sm font-semibold text-text">Default expanded</p>
				<FileTree2
					defaultExpandedPaths={[
						"build",
						"build/assets",
						"build/assets/images",
						"build/assets/images/social",
					]}
					items={flatteningItems}
				/>
			</div>
			<div className="space-y-2">
				<p className="text-sm font-semibold text-text">Flattened directories</p>
				<FileTree2
					defaultExpandedPaths={["build", "build/assets/images/social"]}
					defaultSelectedPath="build/assets/images/social"
					flattenEmptyDirectories
					items={flatteningItems}
				/>
			</div>
		</div>
	);
}

export function FileTree2DemoGitStatus() {
	return (
		<FileTree2
			className="w-full max-w-sm"
			defaultExpandedPaths={["src", "src/components"]}
			items={[
				{ path: "src/components/Button.tsx", status: "added" },
				{ path: "src/components/Card.tsx" },
				{ path: "src/components/LegacyPanel.tsx", status: "deleted" },
				{ path: "src/lib/api.ts" },
				{ path: "src/styles/globals.css" },
				{ path: "src/index.ts", status: "modified" },
				{ path: ".browserslistrc", status: "ignored" },
				{ path: ".gitignore" },
				{ path: "package.json", status: "renamed" },
				{ path: "README.md", status: "untracked" },
			]}
		/>
	);
}

export function FileTree2DemoDragAndDrop() {
	const [items, setItems] = useState(() => [...flatteningItems]);
	const [isPackageLocked, setIsPackageLocked] = useState(true);

	return (
		<div className="w-full max-w-3xl space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex h-8 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-text-subtle">
					<LockIcon className="size-4 text-icon-subtle" />
					<span>Lock package.json</span>
					<Switch
						checked={isPackageLocked}
						label="Lock package.json"
						onCheckedChange={setIsPackageLocked}
						size="sm"
					/>
				</div>
				<Button
					onClick={() => setItems([...flatteningItems])}
					size="compact"
					variant="outline"
				>
					<RefreshCwIcon />
					Reset
				</Button>
			</div>
			<FileTree2
				canDrag={(path) => !isPackageLocked || path !== "package.json"}
				dragAndDrop
				flattenEmptyDirectories
				items={items}
				onMove={(event) => setItems((currentItems) => moveFileTree2Items(currentItems, event))}
			/>
		</div>
	);
}

export function FileTree2DemoIconRules() {
	return (
		<FileTree2
			className="w-full max-w-sm"
			defaultExpandedPaths={["config", "src"]}
			icons={{
				set: "complete",
				byFileExtension: { log: "file-tree-builtin-text" },
			}}
			items={[
				{ path: "src/App.tsx" },
				{ path: "src/styles.scss" },
				{ path: "config/biome.json" },
				{ path: "config/vite.config.ts" },
				{ path: "Dockerfile" },
				{ path: "schema.graphql" },
				{ path: "release.log" },
			]}
		/>
	);
}

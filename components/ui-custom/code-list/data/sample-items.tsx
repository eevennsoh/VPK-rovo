import type { CodeListItem } from "@/components/ui-custom/code-list";

// Mirrors the Figma node "Code list" — an agent's "Edited N files" changeset.
// Each row expands to reveal the file's source in a small, line-numbered code
// block. Additions/deletions render as +N (lime) / -N (red) diff stats.
export const SAMPLE_CODE_LIST_ITEMS: readonly CodeListItem[] = [
	{
		id: "user-menu",
		path: "src/components/UserMenu.js",
		additions: 24,
		deletions: 2,
		language: "javascript",
		code: `import { useAuth } from "../hooks/useAuth";

export function UserMenu() {
	const { user, signOut } = useAuth();

	if (!user) {
		return null;
	}

	return (
		<div className="user-menu">
			<img alt="" className="user-menu__avatar" src={user.avatarUrl} />
			<span className="user-menu__name">{user.displayName}</span>
			<button onClick={signOut} type="button">
				Sign out
			</button>
		</div>
	);
}`,
	},
	{
		id: "use-auth",
		path: "src/hooks/useAuth.ts",
		additions: 12,
		language: "typescript",
		code: `import { use } from "react";

import { AuthContext } from "../context/AuthContext";

export function useAuth() {
	const context = use(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}`,
	},
	{
		id: "menu-styles",
		path: "src/styles/menu.css",
		additions: 6,
		deletions: 4,
		language: "css",
		code: `.user-menu {
	display: flex;
	align-items: center;
	gap: 8px;
}

.user-menu__avatar {
	width: 24px;
	height: 24px;
	border-radius: 50%;
}`,
	},
];

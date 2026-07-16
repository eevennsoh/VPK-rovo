import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CODE_LIST_DETAIL: ComponentDetail = {
	description:
		"A changeset list of edited code files. Each row shows a monospace file path (dir + filename) and +N/-N diff stats, and expands to reveal the file's source in a small, line-numbered code block. A summary header above the card reports the file count and total additions/deletions and can minimise the whole list.",
	importStatement: `import { CodeList } from "@/components/ui-custom/code-list";`,
	usage: `import { CodeList } from "@/components/ui-custom/code-list";
import type { CodeListItem } from "@/components/ui-custom/code-list";

const items: CodeListItem[] = [
  {
    id: "user-menu",
    path: "src/components/UserMenu.js",
    additions: 24,
    deletions: 2,
    language: "javascript",
    code: "export function UserMenu() {\\n  return null;\\n}",
  },
];

<CodeList items={items} />`,
	demoLayout: { previewHeight: "fixed" },
	props: [
		{
			name: "items",
			type: "readonly CodeListItem[]",
			required: true,
			description:
				"Rows to render. Each item provides a file `path`, the `code` shown when expanded, an optional Shiki `language` (inferred from the extension by default), and optional `additions`/`deletions` counts.",
		},
		{
			name: "summaryVerb",
			type: "string",
			description: 'Verb shown in the summary header, e.g. "Edited". Defaults to "Edited".',
		},
		{
			name: "hideSummary",
			type: "boolean",
			description: "Hide the summary/minimise header above the card. Defaults to false.",
		},
		{
			name: "defaultExpandedIds",
			type: "readonly string[]",
			description: "Ids of rows expanded on first render.",
		},
	],
};

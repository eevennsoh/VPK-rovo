import type { SourcesPreviewPage } from "@/components/ui-custom/sources-preview-menu-data";
import type { TwgToolSource } from "@/components/ui-custom/twg-appstack";

/**
 * The fourteen connected sources the Pulse synthesis reads across.
 *
 * Lives next to the preview-menu fixtures so the stack logos and the four
 * cards they open stay one data owner. A component file that also exported
 * this list would full-reload on every edit.
 */
export const PULSE_SOURCES = [
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "github", label: "GitHub", provider: "twg", name: "github" },
	{ id: "slack", label: "Slack", provider: "twg", name: "slack" },
	{ id: "sentry", label: "Sentry", provider: "twg", name: "sentry" },
	{ id: "launchdarkly", label: "LaunchDarkly", provider: "twg", name: "launchdarkly" },
	{ id: "loom", label: "Loom", provider: "loom" },
	{ id: "figma", label: "Figma", provider: "twg", name: "figma" },
	{ id: "google-docs", label: "Google Docs", provider: "twg", name: "google-docs" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "bitbucket", label: "Bitbucket", provider: "bitbucket" },
	{ id: "rovo", label: "Rovo", provider: "rovo" },
	{ id: "opsgenie", label: "Opsgenie", provider: "opsgenie" },
	{ id: "statuspage", label: "Statuspage", provider: "statuspage" },
] satisfies readonly TwgToolSource[];

/**
 * Preview-menu fixtures for the Pulse Insights app stack.
 *
 * One card per visible stack logo (Jira, Confluence, GitHub, Slack). Copy
 * comes from the Pulse timeline so the menu matches the logos, not the docs
 * UST Confluence set.
 */
export const PULSE_SOURCE_PREVIEW_PAGES: readonly SourcesPreviewPage[] = [
	{
		id: "pay-102",
		title: "PAY-102 — prove the adapter can go",
		href: "https://hello.atlassian.net/browse/PAY-102",
		updatedAt: new Date(2026, 7, 17),
		owner: "Maya Ferreira",
		snippet:
			"v2 exposes the same idempotency guarantees the adapter was faking on top of v1, so LegacyGatewayAdapter can be deleted outright.",
	},
	{
		id: "migration-scope",
		title: "Payments SDK v2 — migration scope",
		href: "https://hello.atlassian.net/wiki/spaces/PAY/pages/5483563901",
		updatedAt: new Date(2026, 7, 17),
		owner: "Priya Raman",
		snippet:
			"Fourteen items, one epic, and 61 call sites to port rather than the 47 everyone had been quoting since June.",
	},
	{
		id: "pr-1847",
		title: "Delete LegacyGatewayAdapter (proof branch)",
		href: "https://github.com/eevensoh/vpk-rovo/pull/1847",
		updatedAt: new Date(2026, 7, 17),
		owner: "Maya Ferreira",
		snippet:
			"GitHub · #1847 open · −4,180 lines. The proof is a branch nobody has linked, so PAY-102 still reads “investigate”.",
	},
	{
		id: "payments-migration-thread",
		title: "#payments-migration — keep or delete the adapter",
		href: "https://atlassian.slack.com/archives/C0PAYMENTS",
		updatedAt: new Date(2026, 7, 17),
		owner: "Priya Raman",
		snippet:
			"38-message thread where removal won, conditional on PAY-102 proving it is possible before anyone ports a call site.",
	},
];

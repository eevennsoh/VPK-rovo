"use client";

import {
	AtlassianLogo,
	CustomLogo,
	AdminIcon,
	AlignIcon,
	AnalyticsIcon,
	AssetsIcon,
	AtlassianBrandIcon,
	BambooIcon,
	BitbucketIcon,
	ChatIcon,
	CompassIcon,
	ConfluenceIcon,
	CustomerServiceManagementIcon,
	FocusIcon,
	GoalsIcon,
	GuardIcon,
	HomeIcon,
	HubIcon,
	JiraIcon,
	JiraProductDiscoveryIcon,
	JiraServiceManagementIcon,
	LoomIcon,
	OpsgenieIcon,
	ProjectsIcon,
	RovoIcon,
	RovoColorIcon,
	RovoDevIcon,
	RovoDevAgentIcon,
	SearchIcon,
	StatuspageIcon,
	StudioIcon,
	TalentIcon,
	TeamsIcon,
	TrelloIcon,
	type AtlassianLogoName,
	type LogoProps,
} from "@/components/ui/logo";

const logoEntries: ReadonlyArray<{ name: AtlassianLogoName; label: string }> = [
	{ name: "atlassian", label: "Atlassian" },
	{ name: "home", label: "Home" },
	{ name: "search", label: "Search" },
	{ name: "jira", label: "Jira" },
	{ name: "confluence", label: "Confluence" },
	{ name: "rovo", label: "Rovo" },
	{ name: "bitbucket", label: "Bitbucket" },
	{ name: "loom", label: "Loom" },
	{ name: "goals", label: "Goals" },
	{ name: "teams", label: "Teams" },
	{ name: "compass", label: "Compass" },
	{ name: "jira-service-management", label: "JSM" },
	{ name: "jira-product-discovery", label: "JPD" },
	{ name: "assets", label: "Assets" },
	{ name: "projects", label: "Projects" },
	{ name: "focus", label: "Focus" },
	{ name: "admin", label: "Admin" },
	{ name: "align", label: "Align" },
	{ name: "analytics", label: "Analytics" },
	{ name: "bamboo", label: "Bamboo" },
	{ name: "chat", label: "Chat" },
	{ name: "customer-service-management", label: "CSM" },
	{ name: "guard", label: "Guard" },
	{ name: "hub", label: "Hub" },
	{ name: "opsgenie", label: "Opsgenie" },
	{ name: "rovo-dev", label: "RovoDev" },
	{ name: "rovo-dev-agent", label: "RovoDev Agent" },
	{ name: "statuspage", label: "Statuspage" },
	{ name: "studio", label: "Studio" },
	{ name: "talent", label: "Talent" },
	{ name: "trello", label: "Trello" },
];

/* ── Overview demo (default export) ──────────────────────────────── */

export default function LogoDemo() {
	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex flex-wrap gap-4">
				{logoEntries.map((entry) => (
					<div key={entry.name} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 bg-surface">
						<AtlassianLogo name={entry.name} label={entry.label} size="small" />
						<span className="text-sm text-text">{entry.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}

/* ── Demo: Icons ──────────────────────────────────────────────── */

export function LogoDemoIcons() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			{logoEntries.map((entry) => (
				<div key={entry.name} className="flex flex-col items-center gap-1.5">
					<AtlassianLogo name={entry.name} label={entry.label} size="small" />
					<span className="text-xs text-text-subtle">{entry.label}</span>
				</div>
			))}
		</div>
	);
}

/* ── Demo: Lockups (icon + wordmark) ──────────────────────────── */

const lockupEntries: ReadonlyArray<{ name: AtlassianLogoName; label: string }> = [
	{ name: "atlassian", label: "Atlassian" },
	{ name: "jira", label: "Jira" },
	{ name: "confluence", label: "Confluence" },
	{ name: "bitbucket", label: "Bitbucket" },
	{ name: "loom", label: "Loom" },
	{ name: "rovo", label: "Rovo" },
	{ name: "home", label: "Home" },
	{ name: "goals", label: "Goals" },
	{ name: "teams", label: "Teams" },
	{ name: "compass", label: "Compass" },
	{ name: "focus", label: "Focus" },
	{ name: "admin", label: "Admin" },
	{ name: "guard", label: "Guard" },
	{ name: "studio", label: "Studio" },
	{ name: "trello", label: "Trello" },
	{ name: "chat", label: "Chat" },
	{ name: "hub", label: "Hub" },
	{ name: "rovo-dev", label: "RovoDev" },
	{ name: "bamboo", label: "Bamboo" },
	{ name: "opsgenie", label: "Opsgenie" },
	{ name: "statuspage", label: "Statuspage" },
];

export function LogoDemoLockups() {
	return (
		<div className="flex flex-wrap items-center gap-6">
			{lockupEntries.map((entry) => (
				<AtlassianLogo
					key={entry.name}
					name={entry.name}
					label={entry.label}
					variant="lockup"
					size="small"
				/>
			))}
		</div>
	);
}

/* ── Demo: Sizes ──────────────────────────────────────────────── */

const sizes: ReadonlyArray<NonNullable<LogoProps["size"]>> = [
	"xxsmall",
	"xsmall",
	"small",
	"medium",
	"large",
	"xlarge",
];

export function LogoDemoSizes() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-end gap-4">
				{sizes.map((size) => (
					<div key={size} className="flex flex-col items-center gap-1.5">
						<JiraIcon label="Jira" size={size} />
						<span className="text-xs text-text-subtle">{size}</span>
					</div>
				))}
			</div>
			<div className="flex flex-wrap items-end gap-4">
				{sizes.map((size) => (
					<div key={size} className="flex flex-col items-center gap-1.5">
						<AtlassianLogo name="jira" label="Jira" variant="lockup" size={size} />
						<span className="text-xs text-text-subtle">{size}</span>
					</div>
				))}
			</div>
		</div>
	);
}

/* ── Demo: Appearances ────────────────────────────────────────── */

const appearances: ReadonlyArray<"brand" | "neutral" | "inverse"> = [
	"brand",
	"neutral",
	"inverse",
];

export function LogoDemoAppearances() {
	return (
		<div className="flex flex-wrap gap-6">
			{appearances.map((appearance) => (
				<div
					key={appearance}
					className="flex flex-col items-center gap-2 rounded-md border border-border px-4 py-3"
					style={{
						backgroundColor: appearance === "inverse" ? "var(--ds-background-neutral-bold, #44546F)" : undefined,
					}}
				>
					<AtlassianLogo
						name="jira"
						label="Jira"
						variant="lockup"
						size="medium"
						appearance={appearance}
						themeAware={false}
					/>
					<span
						className="text-xs"
						style={{
							color: appearance === "inverse" ? "var(--ds-text-inverse, #FFF)" : undefined,
						}}
					>
						{appearance}
					</span>
				</div>
			))}
		</div>
	);
}

/* ── Demo: Custom Logo ────────────────────────────────────────── */

function RovoSvg(props: { width?: number; height?: number; "aria-hidden"?: boolean }) {
	return <RovoColorIcon {...props} />;
}

export function LogoDemoCustom() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-6">
				<CustomLogo
					svg={<RovoSvg />}
					label="Rovo icon"
					size="small"
				/>
				<CustomLogo
					svg={<RovoSvg />}
					wordmark="Rovo"
					label="Rovo"
					size="small"
				/>
				<CustomLogo
					svg={<RovoSvg />}
					wordmark="Rovo"
					label="Rovo"
					size="medium"
				/>
				<CustomLogo
					svg={<RovoSvg />}
					wordmark="Rovo"
					label="Rovo"
					size="large"
				/>
			</div>
			<p className="text-xs text-text-subtle">
				Pass any SVG element via the <code className="rounded bg-bg-neutral px-1 py-0.5">svg</code> prop. Add an optional <code className="rounded bg-bg-neutral px-1 py-0.5">wordmark</code> for a lockup layout.
			</p>
		</div>
	);
}

/* ── Demo: Named exports ──────────────────────────────────────── */

export function LogoDemoNamedExports() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<AdminIcon label="Admin" size="small" />
			<AlignIcon label="Align" size="small" />
			<AnalyticsIcon label="Analytics" size="small" />
			<AssetsIcon label="Assets" size="small" />
			<AtlassianBrandIcon label="Atlassian" size="small" />
			<BambooIcon label="Bamboo" size="small" />
			<BitbucketIcon label="Bitbucket" size="small" />
			<ChatIcon label="Chat" size="small" />
			<CompassIcon label="Compass" size="small" />
			<ConfluenceIcon label="Confluence" size="small" />
			<CustomerServiceManagementIcon label="CSM" size="small" />
			<FocusIcon label="Focus" size="small" />
			<GoalsIcon label="Goals" size="small" />
			<GuardIcon label="Guard" size="small" />
			<HomeIcon label="Home" size="small" />
			<HubIcon label="Hub" size="small" />
			<JiraIcon label="Jira" size="small" />
			<JiraProductDiscoveryIcon label="JPD" size="small" />
			<JiraServiceManagementIcon label="JSM" size="small" />
			<LoomIcon label="Loom" size="small" />
			<OpsgenieIcon label="Opsgenie" size="small" />
			<ProjectsIcon label="Projects" size="small" />
			<RovoIcon label="Rovo" size="small" />
			<RovoDevIcon label="RovoDev" size="small" />
			<RovoDevAgentIcon label="RovoDev Agent" size="small" />
			<SearchIcon label="Search" size="small" />
			<StatuspageIcon label="Statuspage" size="small" />
			<StudioIcon label="Studio" size="small" />
			<TalentIcon label="Talent" size="small" />
			<TeamsIcon label="Teams" size="small" />
			<TrelloIcon label="Trello" size="small" />
		</div>
	);
}

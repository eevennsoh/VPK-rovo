export type AdminRovoFixtureState = "configured" | "empty" | "loading" | "degraded";

export type AdminRovoStatusTone =
	| "danger"
	| "discovery"
	| "information"
	| "neutral"
	| "success"
	| "warning";

export interface AdminRovoStatus {
	label: string;
	tone: AdminRovoStatusTone;
}

export interface AdminRovoMetric {
	description?: string;
	label: string;
	status?: AdminRovoStatus;
	value: string;
}

export interface AdminRovoEmptyState {
	description: string;
	title: string;
}

export const ADMIN_ROVO_FIXTURE_STATE_OPTIONS = [
	{
		description: "Shows ready MCP connectors and complete usage insight fixtures.",
		label: "Configured",
		value: "configured",
	},
	{
		description: "Shows first-run empty states without configured data.",
		label: "Empty",
		value: "empty",
	},
	{
		description: "Shows deterministic loading placeholders.",
		label: "Loading",
		value: "loading",
	},
	{
		description: "Shows partial data and degraded connectivity messaging.",
		label: "Degraded",
		value: "degraded",
	},
] as const satisfies ReadonlyArray<{
	description: string;
	label: string;
	value: AdminRovoFixtureState;
}>;

export interface AdminRovoMcpServer {
	decision: string;
	endpoint: string;
	id: string;
	lastCheck: string;
	name: string;
	owner: string;
	status: AdminRovoStatus;
}

export interface AdminRovoMcpTool {
	decision: string;
	id: string;
	name: string;
	requests: string;
	status: AdminRovoStatus;
	surface: string;
}

export interface AdminRovoMcpCheck {
	detail: string;
	id: string;
	label: string;
	status: AdminRovoStatus;
}

export interface AdminRovoMcpFixture {
	checks: readonly AdminRovoMcpCheck[];
	connection: AdminRovoStatus & {
		detail: string;
	};
	emptyState: AdminRovoEmptyState;
	metrics: readonly AdminRovoMetric[];
	servers: readonly AdminRovoMcpServer[];
	state: AdminRovoFixtureState;
	stateSummary: string;
	tools: readonly AdminRovoMcpTool[];
}

export const ADMIN_ROVO_MCP_FIXTURES = {
	configured: {
		checks: [
			{
				detail: "The manifest exposes eight simulated tools across work graph sources.",
				id: "manifest",
				label: "Server manifest",
				status: { label: "Passed", tone: "success" },
			},
			{
				detail: "The fixture represents a valid handshake; no credentials are stored here.",
				id: "handshake",
				label: "OAuth handshake",
				status: { label: "Passed", tone: "success" },
			},
			{
				detail: "Tool schemas match the prototype's deterministic examples.",
				id: "schema",
				label: "Tool schema compatibility",
				status: { label: "Passed", tone: "success" },
			},
		],
		connection: {
			detail: "The local fixture represents a healthy MCP gateway for Atlassian work graph tools.",
			label: "Connected",
			tone: "success",
		},
		emptyState: {
			description: "Select another fixture state to review configured, loading, or degraded examples.",
			title: "No MCP connectivity in this fixture",
		},
		metrics: [
			{
				description: "Jira, Confluence, and Compass examples.",
				label: "Configured sources",
				value: "3",
			},
			{
				description: "Tools available to Rovo in the configured fixture.",
				label: "Available tools",
				value: "8",
			},
			{
				description: "Deterministic fixture timestamp.",
				label: "Last simulated check",
				value: "Jul 12, 2026",
			},
		],
		servers: [
			{
				decision: "Keep available for work graph search and issue lookup.",
				endpoint: "mcp://atlassian-work-graph",
				id: "work-graph",
				lastCheck: "Jul 12, 2026, 9:12 AM",
				name: "Atlassian work graph gateway",
				owner: "Platform team",
				status: { label: "Ready", tone: "success" },
			},
			{
				decision: "Keep available for internal knowledge retrieval.",
				endpoint: "mcp://confluence-knowledge",
				id: "confluence",
				lastCheck: "Jul 12, 2026, 9:12 AM",
				name: "Confluence knowledge connector",
				owner: "Knowledge team",
				status: { label: "Ready", tone: "success" },
			},
			{
				decision: "Keep available for service ownership lookups.",
				endpoint: "mcp://compass-catalog",
				id: "compass",
				lastCheck: "Jul 12, 2026, 9:12 AM",
				name: "Compass catalog connector",
				owner: "Operations team",
				status: { label: "Ready", tone: "success" },
			},
		],
		state: "configured",
		stateSummary: "Configured fixture with healthy MCP server status, available tools, and passing checks.",
		tools: [
			{
				decision: "Keep visible for support and project triage agents.",
				id: "jira-search",
				name: "Search Jira issues",
				requests: "428 simulated calls",
				status: { label: "Available", tone: "success" },
				surface: "Jira",
			},
			{
				decision: "Keep visible for knowledge answers that need source links.",
				id: "confluence-search",
				name: "Search Confluence pages",
				requests: "377 simulated calls",
				status: { label: "Available", tone: "success" },
				surface: "Confluence",
			},
			{
				decision: "Keep visible for service ownership and dependency questions.",
				id: "compass-lookup",
				name: "Lookup Compass components",
				requests: "91 simulated calls",
				status: { label: "Available", tone: "success" },
				surface: "Compass",
			},
		],
	},
	degraded: {
		checks: [
			{
				detail: "The work graph manifest is reachable in the fixture.",
				id: "manifest",
				label: "Server manifest",
				status: { label: "Passed", tone: "success" },
			},
			{
				detail: "The Confluence connector response is delayed in this degraded fixture.",
				id: "latency",
				label: "Connector latency",
				status: { label: "Slow", tone: "warning" },
			},
			{
				detail: "The Compass connector is represented as unavailable.",
				id: "compass",
				label: "Compass connector",
				status: { label: "Unavailable", tone: "danger" },
			},
		],
		connection: {
			detail: "The fixture represents partial MCP availability. Some tools are stale or unavailable.",
			label: "Degraded",
			tone: "warning",
		},
		emptyState: {
			description: "The degraded fixture still includes partial connectivity data.",
			title: "Partial MCP connectivity",
		},
		metrics: [
			{
				description: "One source is unavailable in the degraded fixture.",
				label: "Configured sources",
				status: { label: "Partial", tone: "warning" },
				value: "2 of 3",
			},
			{
				description: "Three simulated tools are blocked or stale.",
				label: "Available tools",
				status: { label: "Needs review", tone: "warning" },
				value: "5 of 8",
			},
			{
				description: "Deterministic fixture timestamp.",
				label: "Last simulated check",
				value: "Jul 12, 2026",
			},
		],
		servers: [
			{
				decision: "Keep available while monitoring delayed responses.",
				endpoint: "mcp://atlassian-work-graph",
				id: "work-graph",
				lastCheck: "Jul 12, 2026, 9:12 AM",
				name: "Atlassian work graph gateway",
				owner: "Platform team",
				status: { label: "Ready", tone: "success" },
			},
			{
				decision: "Review connector health before expanding use.",
				endpoint: "mcp://confluence-knowledge",
				id: "confluence",
				lastCheck: "Jul 12, 2026, 8:48 AM",
				name: "Confluence knowledge connector",
				owner: "Knowledge team",
				status: { label: "Slow", tone: "warning" },
			},
			{
				decision: "Restore service ownership lookups before promoting agents that depend on them.",
				endpoint: "mcp://compass-catalog",
				id: "compass",
				lastCheck: "Jul 12, 2026, 8:45 AM",
				name: "Compass catalog connector",
				owner: "Operations team",
				status: { label: "Unavailable", tone: "danger" },
			},
		],
		state: "degraded",
		stateSummary: "Degraded fixture showing partial MCP health and administrator follow-up decisions.",
		tools: [
			{
				decision: "Keep visible for critical issue triage.",
				id: "jira-search",
				name: "Search Jira issues",
				requests: "390 simulated calls",
				status: { label: "Available", tone: "success" },
				surface: "Jira",
			},
			{
				decision: "Warn agent owners that responses can be delayed.",
				id: "confluence-search",
				name: "Search Confluence pages",
				requests: "214 simulated calls",
				status: { label: "Slow", tone: "warning" },
				surface: "Confluence",
			},
			{
				decision: "Do not rely on this tool until connector health recovers.",
				id: "compass-lookup",
				name: "Lookup Compass components",
				requests: "0 simulated calls",
				status: { label: "Unavailable", tone: "danger" },
				surface: "Compass",
			},
		],
	},
	empty: {
		checks: [],
		connection: {
			detail: "No MCP server or connector examples are present in the empty fixture.",
			label: "Not configured",
			tone: "neutral",
		},
		emptyState: {
			description: "Use the configured fixture to review the target MCP connectivity layout.",
			title: "No MCP server configured",
		},
		metrics: [
			{ description: "No source fixtures are configured.", label: "Configured sources", value: "0" },
			{ description: "No tool fixtures are available.", label: "Available tools", value: "0" },
			{ description: "No local check has run in this fixture.", label: "Last simulated check", value: "Never" },
		],
		servers: [],
		state: "empty",
		stateSummary: "Empty fixture for first-run administration review.",
		tools: [],
	},
	loading: {
		checks: [],
		connection: {
			detail: "This fixture renders loading placeholders only; no network call is made.",
			label: "Checking",
			tone: "information",
		},
		emptyState: {
			description: "Loading placeholders are deterministic and do not represent a live request.",
			title: "Checking MCP connectivity",
		},
		metrics: [
			{ description: "Loading placeholder.", label: "Configured sources", value: "Checking" },
			{ description: "Loading placeholder.", label: "Available tools", value: "Checking" },
			{ description: "Loading placeholder.", label: "Last simulated check", value: "Checking" },
		],
		servers: [],
		state: "loading",
		stateSummary: "Loading fixture for deterministic skeleton review.",
		tools: [],
	},
} as const satisfies Record<AdminRovoFixtureState, AdminRovoMcpFixture>;

export interface AdminRovoInsightsSurface {
	decision: string;
	id: string;
	status: AdminRovoStatus;
	surface: string;
	trend: string;
	usage: string;
}

export interface AdminRovoInsightsDecision {
	description: string;
	id: string;
	status: AdminRovoStatus;
	title: string;
}

export interface AdminRovoInsightsFixture {
	decisions: readonly AdminRovoInsightsDecision[];
	emptyState: AdminRovoEmptyState;
	freshness: AdminRovoStatus & {
		detail: string;
	};
	metrics: readonly AdminRovoMetric[];
	state: AdminRovoFixtureState;
	stateSummary: string;
	surfaces: readonly AdminRovoInsightsSurface[];
}

export const ADMIN_ROVO_INSIGHTS_FIXTURES = {
	configured: {
		decisions: [
			{
				description: "Usage is concentrated in Jira and Administration examples, so onboarding should start there.",
				id: "enablement",
				status: { label: "Review", tone: "information" },
				title: "Where should admins focus enablement?",
			},
			{
				description: "MCP tool calls are frequent enough in the fixture to justify reviewing connector health.",
				id: "connectivity",
				status: { label: "Watch", tone: "warning" },
				title: "Which dependency needs operational follow-up?",
			},
			{
				description: "Source-linked responses are the clearest quality signal represented by this prototype.",
				id: "quality",
				status: { label: "Track", tone: "success" },
				title: "Which usage signal is ready for weekly review?",
			},
		],
		emptyState: {
			description: "Select configured or degraded to review usage insight examples.",
			title: "No Rovo usage insights in this fixture",
		},
		freshness: {
			detail: "Fixture window: Jul 6-12, 2026. Values are local examples, not organization telemetry.",
			label: "Complete fixture",
			tone: "success",
		},
		metrics: [
			{
				description: "Users represented in the configured local fixture.",
				label: "Rovo active users",
				status: { label: "+12%", tone: "success" },
				value: "312",
			},
			{
				description: "Calls routed through configured MCP fixture tools.",
				label: "MCP tool calls",
				status: { label: "Stable", tone: "success" },
				value: "1,284",
			},
			{
				description: "Prototype ratio of answers that include a source link.",
				label: "Answers with sources",
				status: { label: "Track", tone: "information" },
				value: "74%",
			},
			{
				description: "Deterministic sample value for response wait.",
				label: "Median response wait",
				value: "6.4s",
			},
		],
		state: "configured",
		stateSummary: "Configured fixture with complete usage examples and decision prompts for administrators.",
		surfaces: [
			{
				decision: "Use for admin-facing onboarding because usage is already visible in the fixture.",
				id: "administration",
				status: { label: "Growing", tone: "success" },
				surface: "Rovo Chat in Administration",
				trend: "+18%",
				usage: "428 simulated sessions",
			},
			{
				decision: "Keep issue lookup guidance near project triage workflows.",
				id: "jira",
				status: { label: "Steady", tone: "information" },
				surface: "Jira",
				trend: "+4%",
				usage: "390 simulated sessions",
			},
			{
				decision: "Review source-link quality before expanding knowledge-answer use cases.",
				id: "confluence",
				status: { label: "Review", tone: "warning" },
				surface: "Confluence",
				trend: "-2%",
				usage: "214 simulated sessions",
			},
			{
				decision: "Use MCP health as the dependency signal for agent rollout readiness.",
				id: "mcp-tools",
				status: { label: "Healthy", tone: "success" },
				surface: "MCP tools",
				trend: "+9%",
				usage: "1,284 simulated calls",
			},
		],
	},
	degraded: {
		decisions: [
			{
				description: "Usage examples are available, but the freshness fixture is partial.",
				id: "freshness",
				status: { label: "Partial", tone: "warning" },
				title: "Can admins rely on this week's usage picture?",
			},
			{
				description: "MCP-dependent examples should wait for connector recovery before expansion.",
				id: "mcp-readiness",
				status: { label: "Hold", tone: "danger" },
				title: "Which rollout should pause?",
			},
			{
				description: "Jira examples remain stable enough for continued admin review.",
				id: "stable-surface",
				status: { label: "Continue", tone: "success" },
				title: "Which surface can continue operating?",
			},
		],
		emptyState: {
			description: "The degraded fixture still includes partial usage insight data.",
			title: "Partial Rovo usage insights",
		},
		freshness: {
			detail: "Fixture window is partial. Confluence and Compass examples are stale in this state.",
			label: "Partial fixture",
			tone: "warning",
		},
		metrics: [
			{
				description: "Users represented in the degraded local fixture.",
				label: "Rovo active users",
				status: { label: "Stale", tone: "warning" },
				value: "312",
			},
			{
				description: "Some connector events are missing from this fixture.",
				label: "MCP tool calls",
				status: { label: "Partial", tone: "warning" },
				value: "874",
			},
			{
				description: "Prototype ratio from available rows only.",
				label: "Answers with sources",
				status: { label: "Incomplete", tone: "warning" },
				value: "61%",
			},
			{
				description: "Deterministic sample value for degraded response wait.",
				label: "Median response wait",
				status: { label: "Slow", tone: "warning" },
				value: "9.1s",
			},
		],
		state: "degraded",
		stateSummary: "Degraded fixture with partial insight freshness and rollout decision prompts.",
		surfaces: [
			{
				decision: "Continue admin-facing review while MCP issues are isolated.",
				id: "administration",
				status: { label: "Steady", tone: "information" },
				surface: "Rovo Chat in Administration",
				trend: "+3%",
				usage: "401 simulated sessions",
			},
			{
				decision: "Keep issue lookup guidance available.",
				id: "jira",
				status: { label: "Healthy", tone: "success" },
				surface: "Jira",
				trend: "+2%",
				usage: "390 simulated sessions",
			},
			{
				decision: "Wait for connector freshness before expanding knowledge-answer use cases.",
				id: "confluence",
				status: { label: "Stale", tone: "warning" },
				surface: "Confluence",
				trend: "Stale",
				usage: "128 simulated sessions",
			},
			{
				decision: "Pause rollout decisions that depend on unavailable Compass examples.",
				id: "mcp-tools",
				status: { label: "Degraded", tone: "danger" },
				surface: "MCP tools",
				trend: "-31%",
				usage: "874 simulated calls",
			},
		],
	},
	empty: {
		decisions: [],
		emptyState: {
			description: "The empty fixture represents an organization before usage examples are available.",
			title: "No Rovo usage insights yet",
		},
		freshness: {
			detail: "No local usage examples are available in the empty fixture.",
			label: "No data",
			tone: "neutral",
		},
		metrics: [
			{ description: "No active-user fixture data.", label: "Rovo active users", value: "0" },
			{ description: "No MCP call fixture data.", label: "MCP tool calls", value: "0" },
			{ description: "No source-link fixture data.", label: "Answers with sources", value: "0%" },
			{ description: "No response wait fixture data.", label: "Median response wait", value: "-" },
		],
		state: "empty",
		stateSummary: "Empty fixture for first-run usage insight review.",
		surfaces: [],
	},
	loading: {
		decisions: [],
		emptyState: {
			description: "Loading placeholders are deterministic and do not represent a live request.",
			title: "Loading Rovo usage insights",
		},
		freshness: {
			detail: "This fixture renders loading placeholders only; no telemetry job is running.",
			label: "Aggregating",
			tone: "information",
		},
		metrics: [
			{ description: "Loading placeholder.", label: "Rovo active users", value: "Loading" },
			{ description: "Loading placeholder.", label: "MCP tool calls", value: "Loading" },
			{ description: "Loading placeholder.", label: "Answers with sources", value: "Loading" },
			{ description: "Loading placeholder.", label: "Median response wait", value: "Loading" },
		],
		state: "loading",
		stateSummary: "Loading fixture for deterministic skeleton review.",
		surfaces: [],
	},
} as const satisfies Record<AdminRovoFixtureState, AdminRovoInsightsFixture>;

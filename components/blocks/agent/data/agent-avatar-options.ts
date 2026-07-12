export interface AgentAvatarOption {
	label: string;
	src: string;
}

export interface AgentAvatarOptionGroup {
	id: string;
	label: string;
	options: readonly AgentAvatarOption[];
}

export const AGENT_AVATAR_OPTION_GROUPS = [
	{
		id: "dev-agents",
		label: "Lime",
		options: [
			{ label: "Basic Coding Agent Template", src: "/avatar-agent/dev-agents/basic-coding-agent-template.svg" },
			{ label: "Code Accessibility Checker", src: "/avatar-agent/dev-agents/code-accessibility-checker.svg" },
			{ label: "Code Documentation Writer", src: "/avatar-agent/dev-agents/code-documentation-writer.svg" },
			{ label: "Code Observer Signalfx", src: "/avatar-agent/dev-agents/code-observer-signalfx.svg" },
			{ label: "Code Planner", src: "/avatar-agent/dev-agents/code-planner.svg" },
			{ label: "Code Reviewer", src: "/avatar-agent/dev-agents/code-reviewer.svg" },
			{ label: "Code Standardizer", src: "/avatar-agent/dev-agents/code-standardizer.svg" },
			{ label: "Code Vulnerability Scanner Npm Yarn", src: "/avatar-agent/dev-agents/code-vulnerability-scanner-npm-yarn.svg" },
			{ label: "Deployment Summarizer", src: "/avatar-agent/dev-agents/deployment-summarizer.svg" },
			{ label: "Feature Flag Cleaner", src: "/avatar-agent/dev-agents/feature-flag-cleaner.svg" },
			{ label: "Migration Config Changer", src: "/avatar-agent/dev-agents/migration-config-changer.svg" },
			{ label: "Pipeline Troubleshooter", src: "/avatar-agent/dev-agents/pipeline-troubleshooter.svg" },
			{ label: "Unit Test Creator", src: "/avatar-agent/dev-agents/unit-test-creator.svg" },
			{ label: "Wildcard 1", src: "/avatar-agent/dev-agents/wildcard-1.svg" },
			{ label: "Wildcard 2", src: "/avatar-agent/dev-agents/wildcard-2.svg" },
			{ label: "Wildcard 3", src: "/avatar-agent/dev-agents/wildcard-3.svg" },
			{ label: "Wildcard 4", src: "/avatar-agent/dev-agents/wildcard-4.svg" },
		],
	},
	{
		id: "product-agents",
		label: "Purple",
		options: [
			{ label: "Feedback Analyzer", src: "/avatar-agent/product-agents/feedback-analyzer.svg" },
			{ label: "Wildcard 1", src: "/avatar-agent/product-agents/wildcard-1.svg" },
			{ label: "Wildcard 2", src: "/avatar-agent/product-agents/wildcard-2.svg" },
			{ label: "Wildcard 3", src: "/avatar-agent/product-agents/wildcard-3.svg" },
			{ label: "Wildcard 4", src: "/avatar-agent/product-agents/wildcard-4.svg" },
			{ label: "Wildcard 5", src: "/avatar-agent/product-agents/wildcard-5.svg" },
			{ label: "Wildcard 6", src: "/avatar-agent/product-agents/wildcard-6.svg" },
		],
	},
	{
		id: "service-agents",
		label: "Yellow",
		options: [
			{ label: "Ops Guide", src: "/avatar-agent/service-agents/ops-guide.svg" },
			{ label: "Rca Agent", src: "/avatar-agent/service-agents/rca-agent.svg" },
			{ label: "Service Request Helper", src: "/avatar-agent/service-agents/service-request-helper.svg" },
			{ label: "Service Triage", src: "/avatar-agent/service-agents/service-triage.svg" },
			{ label: "Wildcard 1", src: "/avatar-agent/service-agents/wildcard-1.svg" },
			{ label: "Wildcard 2", src: "/avatar-agent/service-agents/wildcard-2.svg" },
			{ label: "Wildcard 3", src: "/avatar-agent/service-agents/wildcard-3.svg" },
			{ label: "Wildcard 4", src: "/avatar-agent/service-agents/wildcard-4.svg" },
			{ label: "Wildcard 5", src: "/avatar-agent/service-agents/wildcard-5.svg" },
		],
	},
	{
		id: "strategy-agents",
		label: "Orange",
		options: [
			{ label: "Strategic Insight", src: "/avatar-agent/strategy-agents/strategic-insight.svg" },
			{ label: "Talent Finder", src: "/avatar-agent/strategy-agents/talent-finder.svg" },
			{ label: "Wildcard 1", src: "/avatar-agent/strategy-agents/wildcard-1.svg" },
			{ label: "Wildcard 2", src: "/avatar-agent/strategy-agents/wildcard-2.svg" },
			{ label: "Wildcard 3", src: "/avatar-agent/strategy-agents/wildcard-3.svg" },
			{ label: "Wildcard 4", src: "/avatar-agent/strategy-agents/wildcard-4.svg" },
			{ label: "Wildcard 5", src: "/avatar-agent/strategy-agents/wildcard-5.svg" },
		],
	},
	{
		id: "teamwork-agents",
		label: "Blue",
		options: [
			{ label: "Blocker Checker", src: "/avatar-agent/teamwork-agents/blocker-checker.svg" },
			{ label: "Brainstorm Facilitator", src: "/avatar-agent/teamwork-agents/brainstorm-facilitator.svg" },
			{ label: "Brand Guardian", src: "/avatar-agent/teamwork-agents/brand-guardian.svg" },
			{ label: "Bug Report Assistant", src: "/avatar-agent/teamwork-agents/bug-report-assistant.svg" },
			{ label: "Customer Insights", src: "/avatar-agent/teamwork-agents/customer-insights.svg" },
			{ label: "Decision Director", src: "/avatar-agent/teamwork-agents/decision-director.svg" },
			{ label: "Diagram Creator", src: "/avatar-agent/teamwork-agents/diagram-creator.svg" },
			{ label: "Global Translator", src: "/avatar-agent/teamwork-agents/global-translator.svg" },
			{ label: "Jira Theme Analyzer", src: "/avatar-agent/teamwork-agents/jira-theme-analyzer.svg" },
			{ label: "Job Listing Assistant", src: "/avatar-agent/teamwork-agents/job-listing-assistant.svg" },
			{ label: "Meeting Insights Reporter", src: "/avatar-agent/teamwork-agents/meeting-insights-reporter.svg" },
			{ label: "Okr Generator", src: "/avatar-agent/teamwork-agents/okr-generator.svg" },
			{ label: "Product Requirements Guide", src: "/avatar-agent/teamwork-agents/product-requirements-guide.svg" },
			{ label: "Progress Tracker", src: "/avatar-agent/teamwork-agents/progress-tracker.svg" },
			{ label: "Readiness Checker", src: "/avatar-agent/teamwork-agents/readiness-checker.svg" },
			{ label: "Release Notes Drafter", src: "/avatar-agent/teamwork-agents/release-notes-drafter.svg" },
			{ label: "Social Media Writer", src: "/avatar-agent/teamwork-agents/social-media-writer.svg" },
			{ label: "Team Recap", src: "/avatar-agent/teamwork-agents/team-recap.svg" },
			{ label: "Teamwork Coach", src: "/avatar-agent/teamwork-agents/teamwork-coach.svg" },
			{ label: "Teamwork Trivia Host", src: "/avatar-agent/teamwork-agents/teamwork-trivia-host.svg" },
			{ label: "Transcript Insights Reporter", src: "/avatar-agent/teamwork-agents/transcript-insights-reporter.svg" },
			{ label: "User Manual Writer", src: "/avatar-agent/teamwork-agents/user-manual-writer.svg" },
			{ label: "Whtieboard Agent", src: "/avatar-agent/teamwork-agents/whtieboard-agent.svg" },
			{ label: "Wildcard 1", src: "/avatar-agent/teamwork-agents/wildcard-1.svg" },
			{ label: "Wildcard 2", src: "/avatar-agent/teamwork-agents/wildcard-2.svg" },
			{ label: "Wildcard 3", src: "/avatar-agent/teamwork-agents/wildcard-3.svg" },
			{ label: "Wildcard 4", src: "/avatar-agent/teamwork-agents/wildcard-4.svg" },
			{ label: "Work Item Planner", src: "/avatar-agent/teamwork-agents/work-item-planner.svg" },
			{ label: "Work Organizer", src: "/avatar-agent/teamwork-agents/work-organizer.svg" },
			{ label: "Workflow Builder", src: "/avatar-agent/teamwork-agents/workflow-builder.svg" },
		],
	},
] as const satisfies readonly AgentAvatarOptionGroup[];

export const AGENT_AVATAR_OPTION_SRCS = AGENT_AVATAR_OPTION_GROUPS.flatMap((group) =>
	group.options.map((option) => option.src)
);

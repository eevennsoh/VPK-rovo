// Landing-bento prompt-starter data, copied from the studio shell
// (`HomeStarterBento` in rovo-app-shell.tsx). Drives the tabbed "Agent bento"
// landing variant: each category maps to a set of tiles, the first of which can
// be a richer "hero" tile (with "Works with" sources + "Skills").

import type { SkillTagColor } from "@/components/ui-custom/skill-tag";
import type { TwgToolSource } from "@/components/ui-custom/twg-appstack";

export type HomeStarterCategory = "analyze" | "brainstorm" | "review" | "summarize" | "create";

export interface HomeStarterCategoryOption {
	iconClassName?: string;
	iconSrc?: string;
	id: HomeStarterCategory;
	label: string;
}

export interface HomeStarterHeroSkill {
	color?: SkillTagColor;
	icon?: React.ReactNode;
	label: string;
}

export interface HomeStarterHeroDecoration {
	bannerClassName: string;
	skills: ReadonlyArray<HomeStarterHeroSkill>;
	sources: ReadonlyArray<TwgToolSource>;
}

export interface HomeStarterTemplate {
	description: string;
	hero?: HomeStarterHeroDecoration;
	iconSrc: string;
	layoutClassName: string;
	prompt: string;
	title: string;
}

const RICH_ICON_ROOT = "/illustration/rich-icon";

export const HOME_STARTER_DEFAULT_CATEGORY: HomeStarterCategory = "brainstorm";

export const HOME_STARTER_CATEGORIES: ReadonlyArray<HomeStarterCategoryOption> = [
	{ id: "brainstorm", label: "Planning", iconSrc: `${RICH_ICON_ROOT}/lightbulb/standard.svg`, iconClassName: "-translate-y-px scale-[1.08]" },
	{ id: "analyze", label: "Insights", iconSrc: `${RICH_ICON_ROOT}/marketing/standard.svg`, iconClassName: "scale-[1.08]" },
	{ id: "review", label: "Operations", iconSrc: `${RICH_ICON_ROOT}/product-management/standard.svg`, iconClassName: "translate-x-0.5 -translate-y-0.5 scale-[1.14]" },
	{ id: "summarize", label: "Writing", iconSrc: `${RICH_ICON_ROOT}/illustrations/standard.svg`, iconClassName: "-translate-y-px scale-[0.88]" },
	{ id: "create", label: "Work management", iconSrc: `${RICH_ICON_ROOT}/project-management/standard.svg`, iconClassName: "scale-[1.08]" },
];

export const HOME_STARTER_VIEWS: Readonly<Record<HomeStarterCategory, ReadonlyArray<HomeStarterTemplate>>> = {
	analyze: [
		{
			description: "Synthesize feedback into themes, customer needs, risks, and recommended product actions.",
			iconSrc: "/avatar-agent/teamwork-agents/customer-insights.svg",
			layoutClassName: "sm:col-span-2 lg:col-start-1 lg:col-span-1 lg:row-start-1",
			prompt: "Build a Studio agent named Customer Insights that analyzes customer feedback from provided pages, links, or projects, then returns themes, needs, risks, and recommended actions.",
			title: "Customer Insights",
		},
		{
			description: "Scan Jira work items to find themes, candidate epics, and patterns worth acting on.",
			hero: {
				bannerClassName: "bg-[#82B536]",
				skills: [
					{ color: "strategy", label: "theme-mining" },
					{ color: "teamwork", label: "quote-selection" },
					{ color: "software", label: "decision-brief" },
					{ color: "service", label: "transcript-review" },
				],
				sources: [
					{ id: "jira", label: "Jira", provider: "jira" },
					{ id: "jira-product-discovery", label: "Jira Product Discovery", provider: "jira-product-discovery" },
					{ id: "confluence", label: "Confluence", provider: "confluence" },
				],
			},
			iconSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-2 lg:row-start-1",
			prompt: "Build a Studio agent named Jira Theme Analyzer that scans Jira work items from a JQL query, search results, or project context, then identifies themes and recommends epic groupings.",
			title: "Jira Theme Analyzer",
		},
		{
			description: "Turn transcripts into decisions, insights, recommendations, owners, and follow-up actions.",
			iconSrc: "/avatar-agent/strategy-agents/wildcard-1.svg",
			layoutClassName: "sm:row-span-2 lg:col-start-4 lg:row-start-1",
			prompt: "Build a Studio agent named Transcript Insights Reporter that turns meeting transcripts into decisions, insights, recommendations, owners, and follow-up action items.",
			title: "Transcript Insights Reporter",
		},
		{
			description: "Find decisions, action items, highlights, and useful context across meeting notes.",
			iconSrc: "/avatar-agent/product-agents/wildcard-6.svg",
			layoutClassName: "sm:row-span-2 lg:col-start-5 lg:row-start-1",
			prompt: "Build a Studio agent named Meeting Insights that searches meeting notes, transcripts, and summaries to surface decisions, action items, highlights, and useful context.",
			title: "Meeting Insights",
		},
		{
			description: "Spot emerging trends across notes and feedback.",
			iconSrc: "/avatar-agent/service-agents/wildcard-5.svg",
			layoutClassName: "lg:col-start-1 lg:row-start-2",
			prompt: "Build a Studio agent named Trend Spotter that scans recent notes, transcripts, and feedback for emerging themes, leading indicators, and worth-watching shifts.",
			title: "Trend Spotter",
		},
		{
			description: "Map sentiment shifts across customer signals.",
			iconSrc: "/avatar-agent/product-agents/wildcard-4.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Sentiment Mapper that clusters customer comments by sentiment, intent, and impact, then highlights the shifts that need a response.",
			title: "Sentiment Mapper",
		},
		{
			description: "Trace product drop-offs, connect them to feedback, and suggest the next investigation.",
			iconSrc: "/avatar-agent/product-agents/wildcard-5.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Funnel Analyzer that examines event data and feedback to identify drop-off points, the most likely causes, and the next investigation step.",
			title: "Funnel Analyzer",
		},
		{
			description: "Pull research into a single, decision-ready brief.",
			iconSrc: "/avatar-agent/teamwork-agents/work-organizer.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Research Synthesizer that pulls together notes, interviews, and reports into a single brief with insights, supporting quotes, and recommended decisions.",
			title: "Research Synthesizer",
		},
	],
	brainstorm: [
		{
			description: "Review DACI decisions, close context gaps, and suggest the next decision-ready resources.",
			hero: {
				bannerClassName: "bg-[#1868DB]",
				skills: [
					{ color: "platform", label: "stakeholder-input" },
					{ color: "2p3p", label: "opportunity-sizing" },
					{ color: "default", label: "option-mapping" },
					{ color: "product", label: "risk-spotting" },
					{ color: "strategy", label: "constraint-mapping" },
					{ color: "teamwork", label: "rubric-building" },
					{ color: "software", label: "evidence-gap-check" },
					{ color: "service", label: "idea-ranking" },
				],
				sources: [
					{ id: "powerbi", label: "Power BI", provider: "teams", iconSrc: "/3p/powerbi/24.svg" },
					{ id: "jira-service-management", label: "Jira Service Management", provider: "jira-service-management" },
					{ id: "figma", label: "Figma", provider: "teams", iconSrc: "/3p/figma/24.svg" },
					{ id: "jira", label: "Jira", provider: "jira" },
					{ id: "microsoft-teams", label: "Microsoft Teams", provider: "teams", iconSrc: "/3p/microsoft-teams/24.svg" },
					{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
					{ id: "slack", label: "Slack", provider: "teams", iconSrc: "/3p/slack/24.svg" },
				],
			},
			iconSrc: "/avatar-agent/teamwork-agents/decision-director.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Decision Director that reviews DACI decision documents, suggests improvements, identifies missing context, and points to useful resources.",
			title: "Decision Director",
		},
		{
			description: "Create and review clear, measurable OKRs against examples, team priorities, and outcome guidance.",
			iconSrc: "/avatar-agent/product-agents/wildcard-2.svg",
			layoutClassName: "lg:col-start-3 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Studio agent named OKR Generator that creates effective OKRs from scratch, reviews draft OKRs, finds similar examples, and shares guidance for stronger objectives and key results.",
			title: "OKR Generator",
		},
		{
			description: "Explore non-obvious directions before committing.",
			iconSrc: "/avatar-agent/dev-agents/code-planner.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-1",
			prompt: "Build a Studio agent named Opportunity Explorer that expands a rough idea into distinct approaches, adjacent opportunities, risks, and the strongest path to investigate first.",
			title: "Opportunity Explorer",
		},
		{
			description: "Turn ideas into experiments and decision points.",
			iconSrc: "/avatar-agent/service-agents/wildcard-1.svg",
			layoutClassName: "lg:col-start-3 lg:col-span-2 lg:row-start-2",
			prompt: "Build a Studio agent named Experiment Planner that turns ideas into experiments with hypotheses, success criteria, owners, decision points, and next steps.",
			title: "Experiment Planner",
		},
		{
			description: "Compare options by upside, cost, and risk.",
			iconSrc: "/avatar-agent/strategy-agents/wildcard-2.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Studio agent named Tradeoff Mapper that compares competing options by upside, cost, risk, reversibility, confidence, and team fit before recommending a direction.",
			title: "Tradeoff Mapper",
		},
		{
			description: "Stress-test ideas against weak assumptions.",
			iconSrc: "/avatar-agent/dev-agents/basic-coding-agent-template.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Assumption Tester that lists likely failure modes, weak assumptions, unknowns, and the evidence that would change the recommendation.",
			title: "Assumption Tester",
		},
		{
			description: "Define practical criteria for choosing a path.",
			iconSrc: "/avatar-agent/product-agents/wildcard-3.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Criteria Builder that defines must-haves, nice-to-haves, risks, disqualifiers, and a comparison rubric for evaluating options.",
			title: "Criteria Builder",
		},
	],
	review: [
		{
			description: "Triage service requests, recommend field updates, and ask for missing details when needed.",
			iconSrc: "/avatar-agent/service-agents/service-triage.svg",
			layoutClassName: "sm:col-span-2 lg:col-start-1 lg:col-span-1 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Service Triage that triages service requests, recommends field updates, explains automation-ready output, and asks for missing details when needed.",
			title: "Service Triage",
		},
		{
			description: "Draft support responses, suggest assignees, and summarize requests for faster resolution.",
			hero: {
				bannerClassName: "bg-[#FCA700]",
				skills: [
					{ color: "platform", label: "handoff" },
					{ color: "2p3p", label: "postmortem-scan" },
					{ color: "default", label: "incident-routing" },
					{ color: "product", label: "readiness-review" },
					{ color: "strategy", label: "escalation-drafting" },
					{ color: "teamwork", label: "status-update" },
					{ color: "software", label: "owner-mapping" },
					{ color: "service", label: "compliance-note" },
				],
				sources: [
					{ id: "jira-service-management", label: "Jira Service Management", provider: "jira-service-management" },
					{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
					{ id: "microsoft-teams", label: "Microsoft Teams", provider: "teams", iconSrc: "/3p/microsoft-teams/24.svg" },
				],
			},
			iconSrc: "/avatar-agent/strategy-agents/strategic-insight.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Service Request Helper that drafts responses using prior request insights, suggests assignees and skills, and summarizes requests for faster resolution.",
			title: "Service Request Helper",
		},
		{
			description: "Guide incident response, on-call actions, mitigation, status updates, and recovery.",
			iconSrc: "/avatar-agent/dev-agents/code-standardizer.svg",
			layoutClassName: "lg:col-start-4 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Studio agent named Rovo Ops that assists incident management, on-call duties, mitigation guidance, and faster detection, response, and recovery.",
			title: "Rovo Ops",
		},
		{
			description: "Answer Rovo setup and usage questions with concise guidance and helpful links.",
			iconSrc: "/avatar-agent/product-agents/wildcard-3.svg",
			layoutClassName: "lg:col-start-4 lg:row-start-2",
			prompt: "Build a Studio agent named Rovo Expert that introduces Rovo features, answers setup and usage questions, and shares helpful links for unlocking organizational knowledge.",
			title: "Rovo Expert",
		},
		{
			description: "Help teammates document working style, communication norms, and collaboration preferences.",
			iconSrc: "/avatar-agent/teamwork-agents/user-manual-writer.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Studio agent named User Manual Writer that helps people write a friendly personal user manual covering working hours, preferred environments, communication norms, and collaboration tips.",
			title: "User Manual Writer",
		},
		{
			description: "Answer policy and process questions from trusted context.",
			iconSrc: "/avatar-agent/teamwork-agents/workflow-builder.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Knowledge Base Guide that answers policy and process questions from trusted source context, cites useful references, and flags missing information.",
			title: "Knowledge Base Guide",
		},
		{
			description: "Compile post-incident timelines, decisions, and follow-ups.",
			iconSrc: "/avatar-agent/service-agents/rca-agent.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Incident Recap Writer that turns incident channels, timelines, and notes into a recap with root causes, decisions, follow-ups, and owners.",
			title: "Incident Recap Writer",
		},
	],
	summarize: [
		{
			description: "Create and review PRDs with customer empathy, evidence, acceptance criteria, and direct feedback.",
			hero: {
				bannerClassName: "bg-[#BF63F3]",
				skills: [
					{ color: "default", label: "content-briefing" },
					{ color: "product", label: "audience-fit" },
					{ color: "strategy", label: "meeting-recap" },
					{ color: "teamwork", label: "executive-summary" },
					{ color: "software", label: "brand-review" },
					{ color: "service", label: "translation-review" },
					{ color: "platform", label: "clarity-pass" },
					{ color: "2p3p", label: "prd-outline" },
					{ color: "default", label: "action-extraction" },
					{ color: "product", label: "changelog-writing" },
				],
				sources: [
					{ id: "figma", label: "Figma", provider: "teams", iconSrc: "/3p/figma/24.svg" },
					{ id: "bitbucket", label: "Bitbucket", provider: "bitbucket" },
					{ id: "github", label: "GitHub", provider: "teams", iconSrc: "/3p/github/24.svg" },
					{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
					{ id: "jira-product-discovery", label: "Jira Product Discovery", provider: "jira-product-discovery" },
				],
			},
			iconSrc: "/avatar-agent/product-agents/wildcard-1.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Product Requirements Guide that creates and reviews PRDs with direct language, customer empathy, supporting evidence, and actionable feedback.",
			title: "Product Requirements Guide",
		},
		{
			description: "Convert Jira work items into grouped release notes for customers and stakeholders.",
			iconSrc: "/avatar-agent/dev-agents/deployment-summarizer.svg",
			layoutClassName: "lg:col-start-3 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Release Notes Drafter that summarizes up to 20 Jira work items, groups them into themes, and drafts clear release notes for stakeholders.",
			title: "Release Notes Drafter",
		},
		{
			description: "Draft or review content against brand voice, tone guidance, and audience needs.",
			iconSrc: "/avatar-agent/strategy-agents/wildcard-3.svg",
			layoutClassName: "lg:col-start-4 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Studio agent named Brand Voice Crafter that reviews or generates content against supplied brand voice and tone guidelines to help produce consistent communications.",
			title: "Brand Voice Crafter",
		},
		{
			description: "Draft social posts, improve engagement, and adapt messages by channel and audience.",
			iconSrc: "/avatar-agent/service-agents/wildcard-4.svg",
			layoutClassName: "lg:col-start-4 lg:row-start-2",
			prompt: "Build a Studio agent named Social Media Writer that drafts social media posts, suggests more engaging variants, and adapts messaging for channel, audience, and tone.",
			title: "Social Media Writer",
		},
		{
			description: "Translate writing while preserving meaning, tone, accessibility, and audience context.",
			iconSrc: "/avatar-agent/teamwork-agents/global-translator.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Studio agent named Global Translator that translates writing into most languages while preserving meaning, tone, and accessibility for speakers of other languages.",
			title: "Global Translator",
		},
		{
			description: "Condense dense context for leadership updates.",
			iconSrc: "/avatar-agent/service-agents/wildcard-5.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Executive Briefing Writer that condenses dense context into key points, decisions, risks, recommendations, and next steps for leadership.",
			title: "Executive Briefing Writer",
		},
		{
			description: "Package progress into stakeholder-ready updates.",
			iconSrc: "/avatar-agent/service-agents/ops-guide.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Stakeholder Update Builder that summarizes progress, decisions, risks, blockers, and next steps in a concise update format.",
			title: "Stakeholder Update Builder",
		},
	],
	create: [
		{
			description: "Break large projects, epics, or workstreams into sequenced tasks, owners, and next steps.",
			hero: {
				bannerClassName: "bg-[#FFC716]",
				skills: [
					{ color: "teamwork", label: "dependency-map" },
					{ color: "software", label: "workflow-design" },
					{ color: "service", label: "blocker-scan" },
					{ color: "platform", label: "acceptance-criteria" },
					{ color: "2p3p", label: "prioritization" },
				],
				sources: [
					{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
					{ id: "slack", label: "Slack", provider: "teams", iconSrc: "/3p/slack/24.svg" },
					{ id: "loom", label: "Loom", provider: "loom" },
				],
			},
			iconSrc: "/avatar-agent/service-agents/wildcard-2.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-4 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Work Item Planner that breaks big projects, epics, or streams of work into smaller actionable tasks, owners, sequencing, and next steps.",
			title: "Work Item Planner",
		},
		{
			description: "Find, move, update, and organize Jira work items across sprints, epics, and stale queues.",
			iconSrc: "/avatar-agent/teamwork-agents/work-organizer.svg",
			layoutClassName: "lg:col-start-1 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Work Item Organizer that finds and updates project work items, moves them into sprints, assigns epics, deletes stale items, and recommends cleanup actions.",
			title: "Work Item Organizer",
		},
		{
			description: "Write concise bug reports with reproduction steps, impact, expected behavior, and triage notes.",
			iconSrc: "/avatar-agent/dev-agents/code-vulnerability-scanner-npm-yarn.svg",
			layoutClassName: "lg:col-start-2 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Studio agent named Bug Report Assistant that turns issue context into clear, concise bug reports with reproduction details, impact, expected behavior, and triage-ready notes.",
			title: "Bug Report Assistant",
		},
		{
			description: "Detect blocked work, explain the evidence, and recommend the clearest unblocking move.",
			iconSrc: "/avatar-agent/strategy-agents/wildcard-4.svg",
			layoutClassName: "lg:col-start-2 lg:row-start-2",
			prompt: "Build a Studio agent named Blocker Checker that detects work items likely to be blocked, explains the evidence, and recommends how to update or unblock the work.",
			title: "Blocker Checker",
		},
		{
			description: "Review work items against a team's definition of ready and suggest missing details.",
			iconSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
			layoutClassName: "lg:col-start-3 lg:row-start-2",
			prompt: "Build a Studio agent named Readiness Checker that reviews a work item against a team's definition of ready and suggests fixes when required details are missing.",
			title: "Readiness Checker",
		},
		{
			description: "Summarize in-flight projects, priorities, owners, progress, and work that needs attention.",
			iconSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Progress Tracker that gives teams a real-time overview of in-flight projects, current priorities, owners, and what should be prioritized next.",
			title: "Progress Tracker",
		},
		{
			description: "Recommend balanced sprint scope using capacity, velocity, issue size, and delivery risk.",
			iconSrc: "/avatar-agent/product-agents/wildcard-2.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Sprint Capacity Planner that recommends a balanced sprint scope based on team capacity, ticket sizes, prior velocity, and risk.",
			title: "Sprint Capacity Planner",
		},
	],
};

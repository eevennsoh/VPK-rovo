import type { ChatGalleryExample } from "./examples";

export const DEFAULT_CHAT_GALLERY_EXAMPLES: ChatGalleryExample[] = [
	// Analysis
	{
		iconPath: "/illustration/rich-icon/search/standard.svg",
		title: "Summarize a Confluence page",
		description: "Extract key points, decisions, and action items from a lengthy Confluence page.",
		useCase: "Analysis",
		role: "Product Manager",
		prompt: "Summarize this Confluence page into key points, decisions made, and action items. Highlight anything that needs follow-up.",
	},
	{
		iconPath: "/illustration/rich-icon/customer/standard.svg",
		title: "Analyze support ticket trends",
		description: "Identify recurring themes and top issues from recent support tickets.",
		useCase: "Analysis",
		role: "Customer Success",
		prompt: "Analyze recent Jira Service Management tickets and identify the top recurring themes, common pain points, and areas where our documentation could reduce ticket volume. Triage service request patterns worth automating.",
	},
	{
		iconPath: "/illustration/rich-icon/software/standard.svg",
		title: "Convert request into JQL",
		description: "Write a JQL query to find specific issues in Jira based on natural language.",
		useCase: "Analysis",
		role: "Developer",
		prompt: "Write a JQL query in Jira to find all unresolved bugs with priority Critical or Blocker assigned to my team in the current sprint. Use the JQL query builder to refine the filter.",
	},
	{
		iconPath: "/illustration/rich-icon/accessibility/standard.svg",
		title: "Create accessibility audit report",
		description: "Evaluate a component or page against WCAG 2.1 AA accessibility standards.",
		useCase: "Analysis",
		role: "Designer",
		prompt: "Audit this Figma component for WCAG 2.1 AA compliance. Get Figma context, then check color contrast, keyboard navigation, screen reader support, and how focusable elements are managed. Provide a prioritized list of issues with recommended fixes.",
	},
	{
		iconPath: "/illustration/rich-icon/product-management/standard.svg",
		title: "Generate competitive analysis",
		description: "Compare features, positioning, and strengths across competitor products.",
		useCase: "Analysis",
		role: "Product Manager",
		prompt: "Run deep research and create a competitive analysis comparing our product against key competitors. Save the findings to Confluence with feature comparison, pricing positioning, strengths and weaknesses, and opportunities for differentiation.",
	},
	{
		iconPath: "/illustration/rich-icon/questions/standard.svg",
		title: "Design a user interview script",
		description: "Prepare open-ended questions for user research interviews.",
		useCase: "Analysis",
		role: "Designer",
		prompt: "Create a user interview script in Dovetail with 10-12 open-ended questions to understand how users currently manage their work. Include warm-up questions, core exploration, and wrap-up prompts, and capture insights as you go.",
	},

	// Brainstorming
	{
		iconPath: "/illustration/rich-icon/lightbulb/standard.svg",
		title: "Brainstorm feature names",
		description: "Generate creative naming options for a new product feature.",
		useCase: "Brainstorming",
		role: "Marketing",
		prompt: "Brainstorm 10 creative name options for a new AI-powered search feature and capture them in Confluence. Names should be memorable, convey intelligence and speed, and work well across our launch channels.",
	},
	{
		iconPath: "/illustration/rich-icon/design/standard.svg",
		title: "Brainstorm onboarding flow ideas",
		description: "Explore creative approaches to improve new user onboarding experience.",
		useCase: "Brainstorming",
		role: "Designer",
		prompt: "Brainstorm 5 different approaches for a new user onboarding flow in Figma. Generate wireframe sketches for progressive disclosure, interactive tutorials, checklist-driven, and contextual guidance patterns. Include pros and cons for each.",
	},

	// Documentation
	{
		iconPath: "/illustration/rich-icon/content-design/standard.svg",
		title: "Draft a product requirements doc",
		description: "Structure a PRD with goals, user stories, and acceptance criteria.",
		useCase: "Documentation",
		role: "Product Manager",
		prompt: "Build PRD for a new feature as a Confluence page. Include problem statement, goals and success metrics, user stories with acceptance criteria, technical considerations, and rollout plan.",
	},
	{
		iconPath: "/illustration/rich-icon/develop/standard.svg",
		title: "Generate API documentation",
		description: "Document REST API endpoints with parameters, responses, and examples.",
		useCase: "Documentation",
		role: "Developer",
		prompt: "Generate API documentation for these Bitbucket endpoints and write user manual sections for each. Include request/response schemas, authentication requirements, error codes, rate limits, and example curl commands.",
	},
	{
		iconPath: "/illustration/rich-icon/playbook/standard.svg",
		title: "Write a customer success playbook",
		description: "Document best practices for customer engagement and retention.",
		useCase: "Documentation",
		role: "Customer Success",
		prompt: "Write a customer success playbook in Confluence covering onboarding best practices, health score monitoring, quarterly business review templates, escalation procedures, and renewal preparation checklists. Build onboarding plan templates for new accounts.",
	},
	{
		iconPath: "/illustration/rich-icon/it/standard.svg",
		title: "Create a runbook for deployments",
		description: "Document step-by-step deployment procedures with rollback plans.",
		useCase: "Documentation",
		role: "IT Admin",
		prompt: "Create a Spinnaker deployment runbook in Confluence with pre-deployment checks, step-by-step deployment procedure, health verification steps, rollback procedure, and post-deployment monitoring checklist.",
	},
	{
		iconPath: "/illustration/rich-icon/ui-styling/standard.svg",
		title: "Write a design system proposal",
		description: "Outline the structure, principles, and adoption plan for a design system.",
		useCase: "Documentation",
		role: "Designer",
		prompt: "Draft Confluence page proposing a design system sourced from our Figma library. Include design principles, component inventory, token architecture, governance model, and a phased adoption plan with success metrics.",
	},

	// Planning
	{
		iconPath: "/illustration/rich-icon/checklist/standard.svg",
		title: "Write a sprint retrospective",
		description: "Structure a retro with what went well, improvements, and action items.",
		useCase: "Planning",
		role: "Product Manager",
		prompt: "Help me structure a sprint retrospective from our Jira board. Organize feedback into what went well, what could be improved, and action items, and feed takeaways into the sprint planner. Include suggested discussion prompts for each section.",
	},
	{
		iconPath: "/illustration/rich-icon/events-checklist/standard.svg",
		title: "Create a launch checklist",
		description: "Build a comprehensive go-to-market checklist for a feature launch.",
		useCase: "Planning",
		role: "Marketing",
		prompt: "Create a comprehensive launch checklist in Confluence covering pre-launch preparation, day-of activities, and post-launch follow-up. Include the release announcement, internal communications, support readiness, and success metrics.",
	},
	{
		iconPath: "/illustration/rich-icon/guidelines/standard.svg",
		title: "Create a data migration plan",
		description: "Plan the steps, risks, and validation for a data migration project.",
		useCase: "Planning",
		role: "Developer",
		prompt: "Create a data migration plan in Confluence including source-to-target mapping, transformation rules, validation criteria, rollback strategy, downtime estimation, and a phased migration timeline. Use the dependency mapper to surface cross-system risks.",
	},
	{
		iconPath: "/illustration/rich-icon/onboarding/standard.svg",
		title: "Create customer onboarding steps",
		description: "Outline a clear customer onboarding flow for new accounts.",
		useCase: "Planning",
		role: "Customer Success",
		prompt: "Build onboarding plan for a 30/60/90 day customer onboarding, tracked in Jira. Include kickoff meeting agenda, key milestones, success metrics at each stage, and escalation triggers for at-risk accounts.",
	},

	// Communication
	{
		iconPath: "/illustration/rich-icon/voice-and-tone/standard.svg",
		title: "Write release notes",
		description: "Summarize changes into user-friendly release notes for stakeholders.",
		useCase: "Communication",
		role: "Product Manager",
		prompt: "Draft release notes for this update from the resolved Jira issues. Group changes by category (new features, improvements, bug fixes), write clear descriptions that non-technical users can understand, and highlight the most impactful changes.",
	},
	{
		iconPath: "/illustration/rich-icon/social-media/standard.svg",
		title: "Draft a stakeholder update email",
		description: "Compose a concise project status update for leadership.",
		useCase: "Communication",
		role: "Product Manager",
		prompt: "Draft a stakeholder update to post in Slack covering project status, key accomplishments this week, upcoming milestones, risks and blockers, and any decisions needed from leadership. Pull progress from the standup summarizer.",
	},
	{
		iconPath: "/illustration/rich-icon/resilience/standard.svg",
		title: "Draft an incident postmortem",
		description: "Write a blameless postmortem with timeline, impact, and follow-ups.",
		useCase: "Communication",
		role: "IT Admin",
		prompt: "Draft a blameless incident postmortem in Jira Service Management including incident summary, timeline of events, root cause analysis, customer impact assessment, and follow-up action items with owners and due dates. Loop in the incident responder for the timeline.",
	},

	// Development
	{
		iconPath: "/illustration/rich-icon/eslint-plugin/standard.svg",
		title: "Write unit test cases",
		description: "Generate comprehensive test cases covering edge cases and error paths.",
		useCase: "Development",
		role: "Developer",
		prompt: "Write comprehensive unit test cases for this function in our Bitbucket repo, working from the test plan builder. Cover happy path, edge cases, error handling, boundary values, and null/undefined inputs. Use descriptive test names that explain the expected behavior.",
	},
	{
		iconPath: "/illustration/rich-icon/platform/standard.svg",
		title: "Explain a code review finding",
		description: "Break down a complex code issue into a clear, actionable explanation.",
		useCase: "Development",
		role: "Developer",
		prompt: "Review pull request in Bitbucket and explain this code review finding clearly. Describe why the current approach is problematic, what issues it could cause in production, and provide a recommended fix with a code example.",
	},
	{
		iconPath: "/illustration/rich-icon/release-phases/standard.svg",
		title: "Debug a build failure",
		description: "Analyze build error logs and suggest fixes for common failure patterns.",
		useCase: "Development",
		role: "Developer",
		prompt: "Analyze this build failure log from Bitbucket Pipelines. Debug log issue to identify the root cause, explain why it's happening, and provide step-by-step instructions to fix it. Also suggest preventive measures to avoid similar failures.",
	},

	// IT Support
	{
		iconPath: "/illustration/rich-icon/trust/standard.svg",
		title: "Troubleshoot permission errors",
		description: "Diagnose and resolve access control and permission issues.",
		useCase: "IT Support",
		role: "IT Admin",
		prompt: "Help troubleshoot this permission error from a Jira Service Management request. Run a permission audit covering group membership, role assignments, resource-level permissions, and inheritance rules. Provide a step-by-step diagnostic checklist.",
	},
] as const;

export const CHAT_GALLERY_USE_CASE_OPTIONS = ["Analysis", "Brainstorming", "Communication", "Development", "Documentation", "IT Support", "Planning"] as const;
export const CHAT_GALLERY_ROLE_OPTIONS = ["Product Manager", "Developer", "Designer", "Customer Success", "Marketing", "IT Admin"] as const;

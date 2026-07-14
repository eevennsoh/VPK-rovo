import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROJECT_DETAILS: Record<string, ComponentDetail> = {
	"admin": {
		description: "An Atlassian Administration surface with organization settings, users, billing, audit logs, Rovo settings, and security controls.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"asx": {
		description: "Agent Sessions Experience — a gallery of agent-session design patterns. Each dock card is a pattern; selecting one reveals its design in the stage (the Kanban card shows the Jira Kanban board). New patterns are added as cards over time.",
		importStatement: `import AsxPage from "@/components/projects/asx";`,
		demoLayout: {
			previewHeight: "fixed",
			previewContentWidth: "full",
		},
	},
	"confluence": {
		description: "A document editing interface inspired by Confluence with rich text editing, bubble menus, and collaboration features.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"html": {
		description: "The vpk-html reference index embedded as a project surface, pointing at the checked-in `.agents/skills/vpk-html/index.html` catalog and demos.",
		importStatement: `import HtmlDemo from "@/components/website/demos/projects/html-demo";`,
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"jira": {
		description: "A Jira RFP response board with embedded agents, generated report workflows, and detailed work item modals.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"rovo": {
		description: "A Vercel-style AI chat workspace with persistent thread history, local attachments, artifact editing, and Rovo-backed streaming.",
		importStatement: `import Rovo from "@/components/projects/rovo";`,
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"rovo-button": {
		description: "A floating action button that summons the Rovo chat panel from any product surface. Demonstrates hover scale, theme-aware surface color, and auto-hide behavior on the Rovo route.",
		importStatement: `import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";`,
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"search": {
		description: "A search results page with AI-powered summary panel, source cards carousel, and filterable result cards.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"sidebar-chat": {
		description: "A sliding chat panel with message bubbles, greeting view, and integrated composer for conversational AI interfaces.",
	},
	"skills": {
		description: "A skills workspace built on the Sidebar Chat interface that shows how skills are invoked and triggered inline, with deterministic skill-invocation cards.",
		importStatement: `import SkillsPanel from "@/components/projects/skills/page";`,
	},
	"studio": {
		description: "A Studio project template forked from the Rovo chat workspace for future template design customization.",
		importStatement: `import Studio from "@/components/projects/studio";`,
		demoLayout: {
			previewHeight: "fixed",
		},
	},
};

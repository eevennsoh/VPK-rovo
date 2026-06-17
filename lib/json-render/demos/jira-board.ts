import type { Spec } from "@json-render/react";

export const jiraBoardSpec: Spec = {
	root: "root",
	elements: {
		root: {
			type: "Stack",
			props: { direction: "vertical", gap: "lg" },
			children: ["header", "breadcrumb", "board"],
		},
		header: {
			type: "PageHeader",
			props: { title: "Sprint 24 Board", description: "Mar 3 – Mar 17, 2025" },
		},
		breadcrumb: {
			type: "Breadcrumb",
			props: {
				items: [{ label: "Projects", href: "/" }, { label: "AUTH", href: "/" }, { label: "Board" }],
			},
		},
		board: {
			type: "Grid",
			props: { columns: "3", gap: "md" },
			children: ["colTodo", "colInProgress", "colDone"],
		},

		// To Do column
		colTodo: {
			type: "Card",
			props: { title: "To Do" },
			children: ["colTodoStack"],
		},
		colTodoStack: {
			type: "Stack",
			props: { direction: "vertical", gap: "sm" },
			children: ["issueTodo1", "issueTodo2"],
		},
		issueTodo1: {
			type: "Card",
			props: { title: "AUTH-201: Add rate limiting" },
			children: ["issueTodo1Details"],
		},
		issueTodo1Details: {
			type: "Stack",
			props: { direction: "horizontal", gap: "sm", align: "center" },
			children: ["issueTodo1Status", "issueTodo1Tags", "issueTodo1Assignee"],
		},
		issueTodo1Status: {
			type: "Lozenge",
			props: { text: "To Do", variant: "neutral" },
		},
		issueTodo1Tags: {
			type: "TagGroup",
			props: {},
			children: ["issueTodo1TagSecurity"],
		},
		issueTodo1TagSecurity: {
			type: "Tag",
			props: { text: "security", color: "red" },
		},
		issueTodo1Assignee: {
			type: "Avatar",
			props: { fallback: "AS", size: "sm" },
		},
		issueTodo2: {
			type: "Card",
			props: { title: "AUTH-205: Update error messages" },
			children: ["issueTodo2Details"],
		},
		issueTodo2Details: {
			type: "Stack",
			props: { direction: "horizontal", gap: "sm", align: "center" },
			children: ["issueTodo2Status", "issueTodo2Tags"],
		},
		issueTodo2Status: {
			type: "Lozenge",
			props: { text: "To Do", variant: "neutral" },
		},
		issueTodo2Tags: {
			type: "TagGroup",
			props: {},
			children: ["issueTodo2TagUx"],
		},
		issueTodo2TagUx: {
			type: "Tag",
			props: { text: "ux", color: "discovery" },
		},

		// In Progress column
		colInProgress: {
			type: "Card",
			props: { title: "In Progress" },
			children: ["colInProgressStack"],
		},
		colInProgressStack: {
			type: "Stack",
			props: { direction: "vertical", gap: "sm" },
			children: ["issueIp1", "issueIp2"],
		},
		issueIp1: {
			type: "Card",
			props: { title: "AUTH-198: Fix login timeout" },
			children: ["issueIp1Details"],
		},
		issueIp1Details: {
			type: "Stack",
			props: { direction: "horizontal", gap: "sm", align: "center" },
			children: ["issueIp1Status", "issueIp1Priority", "issueIp1Tags", "issueIp1Assignee"],
		},
		issueIp1Status: {
			type: "Lozenge",
			props: { text: "In Progress", variant: "information", isBold: true },
		},
		issueIp1Priority: {
			type: "Badge",
			props: { text: "High", variant: "danger" },
		},
		issueIp1Tags: {
			type: "TagGroup",
			props: {},
			children: ["issueIp1TagAuth", "issueIp1TagBug"],
		},
		issueIp1TagAuth: {
			type: "Tag",
			props: { text: "auth", color: "blue" },
		},
		issueIp1TagBug: {
			type: "Tag",
			props: { text: "bug", color: "red" },
		},
		issueIp1Assignee: {
			type: "Avatar",
			props: { fallback: "JD", size: "sm" },
		},
		issueIp2: {
			type: "Card",
			props: { title: "AUTH-200: OAuth2 integration" },
			children: ["issueIp2Details"],
		},
		issueIp2Details: {
			type: "Stack",
			props: { direction: "horizontal", gap: "sm", align: "center" },
			children: ["issueIp2Status", "issueIp2Tags", "issueIp2Assignee"],
		},
		issueIp2Status: {
			type: "Lozenge",
			props: { text: "In Progress", variant: "information", isBold: true },
		},
		issueIp2Tags: {
			type: "TagGroup",
			props: {},
			children: ["issueIp2TagFeature"],
		},
		issueIp2TagFeature: {
			type: "Tag",
			props: { text: "feature", color: "green" },
		},
		issueIp2Assignee: {
			type: "Avatar",
			props: { fallback: "MK", size: "sm" },
		},

		// Done column
		colDone: {
			type: "Card",
			props: { title: "Done" },
			children: ["colDoneStack"],
		},
		colDoneStack: {
			type: "Stack",
			props: { direction: "vertical", gap: "sm" },
			children: ["issueDone1", "issueDone2"],
		},
		issueDone1: {
			type: "Card",
			props: { title: "AUTH-195: Session management" },
			children: ["issueDone1Details"],
		},
		issueDone1Details: {
			type: "Stack",
			props: { direction: "horizontal", gap: "sm", align: "center" },
			children: ["issueDone1Status", "issueDone1Assignee"],
		},
		issueDone1Status: {
			type: "Lozenge",
			props: { text: "Done", variant: "success", isBold: true },
		},
		issueDone1Assignee: {
			type: "Avatar",
			props: { fallback: "JD", size: "sm" },
		},
		issueDone2: {
			type: "Card",
			props: { title: "AUTH-196: Password reset flow" },
			children: ["issueDone2Details"],
		},
		issueDone2Details: {
			type: "Stack",
			props: { direction: "horizontal", gap: "sm", align: "center" },
			children: ["issueDone2Status", "issueDone2Assignee"],
		},
		issueDone2Status: {
			type: "Lozenge",
			props: { text: "Done", variant: "success", isBold: true },
		},
		issueDone2Assignee: {
			type: "Avatar",
			props: { fallback: "AS", size: "sm" },
		},
	},
};

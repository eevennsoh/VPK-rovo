/**
 * Seed data for the experimental Details right column (video-matched Jira layout).
 * Presentation-only, deterministic. Type-only imports so it stays bundle-clean.
 */

import type { WorkItemChildItem } from "@/app/contexts/context-work-item-modal";

export interface ParentOption {
	key: string;
	summary: string;
	type: NonNullable<WorkItemChildItem["type"]>;
}

/** Candidate parents for the Parent picker (empty-to-add + change). */
export const PARENT_OPTIONS: readonly ParentOption[] = [
	{ key: "RFP-100", summary: "Enterprise RFP Response", type: "Epic" },
	{ key: "RFP-102", summary: "Northstar Bank supplier packet review", type: "Task" },
	{ key: "RFP-103", summary: "Meridian Health RFP qualification", type: "Task" },
];

/** Candidate labels for the Labels picker. */
export const LABEL_OPTIONS: readonly string[] = [
	"enterprise-rfp",
	"esm",
	"bid-recommendation",
	"assets-cmdb",
	"security-review",
];

/** Candidate Atlassian projects for the empty "Atlassian Project" row picker. */
export const PROJECT_OPTIONS: readonly { id: string; name: string; team: string }[] = [
	{ id: "rovo-brand-council", name: "Rovo Brand Council", team: "Brand" },
	{ id: "esm-rfp-response", name: "Enterprise RFP Response", team: "Sales" },
	{ id: "assets-cmdb", name: "Assets & CMDB readiness", team: "Platform" },
];

/** Recur config options for the Automation "Set to recur" popover. */
export const RECUR_FREQUENCIES: readonly string[] = ["Daily", "Weekly", "Monthly", "Yearly"];
export const RECUR_DAYS: readonly string[] = [
	"On Monday",
	"On Tuesday",
	"On Wednesday",
	"On Thursday",
	"On Friday",
];
export const RECUR_TIMINGS: readonly string[] = ["When scheduled", "When work starts", "When work is due"];

export interface AppRow {
	id: string;
	name: string;
	byline: string;
}

/** Mock connected apps shown in the collapsible Apps section. */
export const APP_ROWS: readonly AppRow[] = [
	{ id: "work-taxonomy", name: "Engineering Work Taxonomy", byline: "Work Taxonomy" },
	{ id: "my-reminders", name: "My Reminders", byline: "Create work reminders" },
	{ id: "whos-looking", name: "Who's Looking?", byline: "Open Who's Looking?" },
];

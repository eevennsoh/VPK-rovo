/**
 * Selection catalogs + factory helpers for the experimental Context panel
 * popovers (attachments / subtasks / linked work items).
 *
 * This module is presentation-only seed data: it does NOT seed reducer state
 * (the presets in `session-state.ts` own that). It imports TYPES only from the
 * work-item modal + the pure session model, so it stays cheap to require and
 * never introduces a data cycle with the foundation.
 *
 * Determinism: every generated id/key comes from a monotonic module counter, not
 * `crypto.randomUUID()` / `Date.now()`. The factories only run inside click
 * handlers (never during render/SSR), so the counter cannot cause a hydration
 * mismatch and keeps repeated adds collision-free.
 */

import type { WorkItemAttachment, WorkItemChildItem } from "@/app/contexts/context-work-item-modal";
import type {
	ContextLinkedItem,
	LinkedWorkItemType,
	RelationshipOption,
} from "@/components/blocks/agent-sessions/data/session-state";

let generatedSeq = 0;
function nextSeq(): number {
	generatedSeq += 1;
	return generatedSeq;
}

// ── Attachments ──────────────────────────────────────────────────────────────

export const ATTACHMENT_RECENT: readonly WorkItemAttachment[] = [
	{ id: "recent-brief", name: "acmecorp-discovery-brief", displayName: "Acmecorp discovery brief", ext: "page", date: "3 Jun 2026", thumbnailKind: "document", sourceLabel: "Confluence page", sourceProduct: "confluence" },
	{ id: "recent-notes", name: "buyer-call-notes", displayName: "Buyer call notes", ext: "page", date: "1 Jun 2026", thumbnailKind: "document", sourceLabel: "Confluence page", sourceProduct: "confluence" },
	{ id: "recent-walkthrough", name: "esm-demo-walkthrough", displayName: "ESM demo walkthrough", ext: "loom", date: "28 May 2026", thumbnailKind: "video", sourceLabel: "Loom video", sourceProduct: "loom" },
];

export const ATTACHMENT_SUGGESTED: readonly WorkItemAttachment[] = [
	{ id: "suggested-matrix", name: "requirement-compliance-matrix", displayName: "Requirement compliance matrix", ext: "xlsx", date: "12 May 2026", thumbnailKind: "document" },
	{ id: "suggested-pricing", name: "pricing-tco-model", displayName: "Pricing TCO model", ext: "xlsx", date: "2 Jun 2026", thumbnailKind: "document" },
	{ id: "suggested-security", name: "security-questionnaire", displayName: "Security questionnaire", ext: "pdf", date: "9 May 2026", thumbnailKind: "file", thumbnailTone: "success" },
];

export type AttachmentCreateKind = "page" | "live-doc" | "whiteboard" | "loom-video";
export interface AttachmentCreateOption {
	id: AttachmentCreateKind;
	label: string;
}
export const ATTACHMENT_CREATE_OPTIONS: readonly AttachmentCreateOption[] = [
	{ id: "page", label: "Page" },
	{ id: "live-doc", label: "Live doc" },
	{ id: "whiteboard", label: "Whiteboard" },
	{ id: "loom-video", label: "Loom video" },
];

const ATTACHMENT_UPLOAD_TEMPLATES: readonly Omit<WorkItemAttachment, "id">[] = [
	{ name: "acmecorp-org-chart", displayName: "acmecorp-org-chart.png", ext: "png", date: "Just now", thumbnailKind: "image", source: "generated" },
	{ name: "rfp-requirements", displayName: "rfp-requirements.pdf", ext: "pdf", date: "Just now", thumbnailKind: "file", thumbnailTone: "success", source: "generated" },
	{ name: "evaluation-scorecard", displayName: "evaluation-scorecard.xlsx", ext: "xlsx", date: "Just now", thumbnailKind: "document", source: "generated" },
];

export function getAttachmentLabel(attachment: Readonly<WorkItemAttachment>): string {
	return attachment.displayName ?? `${attachment.name}.${attachment.ext}`;
}

/** A deterministic "uploaded" attachment (Upload files tab is a mock drop-zone). */
export function createUploadedAttachment(): WorkItemAttachment {
	const seq = nextSeq();
	const template = ATTACHMENT_UPLOAD_TEMPLATES[(seq - 1) % ATTACHMENT_UPLOAD_TEMPLATES.length];
	return { ...template, id: `upload-${seq}` };
}

/** Link-to-content attachment built from a pasted URL + optional display name. */
export function createLinkedContentAttachment(url: string, displayName?: string): WorkItemAttachment {
	const seq = nextSeq();
	const trimmed = displayName?.trim();
	return {
		id: `linked-content-${seq}`,
		name: trimmed || url,
		displayName: trimmed || url,
		ext: "link",
		date: "Just now",
		thumbnailKind: "file",
		sourceLabel: "Linked content",
		source: "generated",
	};
}

/** New Page / Live doc / Whiteboard / Loom video from the Create new tab. */
export function createCreatedAttachment(option: Readonly<AttachmentCreateOption>): WorkItemAttachment {
	const seq = nextSeq();
	const base = { id: `created-${seq}`, date: "Just now", source: "generated" as const };
	switch (option.id) {
		case "page":
			return { ...base, name: "untitled-page", displayName: `Untitled page ${seq}`, ext: "page", thumbnailKind: "document", sourceLabel: "Confluence page", sourceProduct: "confluence" };
		case "live-doc":
			return { ...base, name: "untitled-live-doc", displayName: `Untitled live doc ${seq}`, ext: "doc", thumbnailKind: "document", sourceLabel: "Live doc", sourceProduct: "confluence" };
		case "whiteboard":
			return { ...base, name: "untitled-whiteboard", displayName: `Untitled whiteboard ${seq}`, ext: "whiteboard", thumbnailKind: "image", sourceLabel: "Whiteboard" };
		case "loom-video":
			return { ...base, name: "untitled-recording", displayName: `Untitled recording ${seq}`, ext: "loom", thumbnailKind: "video", sourceLabel: "Loom video", sourceProduct: "loom" };
		default: {
			const _exhaustive: never = option.id;
			return { ...base, name: _exhaustive ?? "untitled", displayName: "Untitled", ext: "page" };
		}
	}
}

// ── Subtasks ─────────────────────────────────────────────────────────────────

export const SUBTASK_SUGGESTIONS: readonly string[] = [
	"Draft the compliance matrix response section",
	"Collect stakeholder sign-offs on scope",
	"Validate CMDB and Assets requirements with product",
	"Prepare the pricing approval request for deal desk",
];

export const SUBTASK_EXISTING: readonly WorkItemChildItem[] = [
	{ type: "Task", key: "RFP-121", summary: "Compile Acmecorp security control matrix", priority: "high", assignee: "Maya Chen", status: "todo" },
	{ type: "Task", key: "RFP-122", summary: "Confirm data residency commitments", priority: "medium", assignee: "Jordan Lee", status: "inprogress" },
	{ type: "Story", key: "RFP-123", summary: "Outline Rovo AI differentiation narrative", priority: "medium", assignee: "Priya Nair", status: "todo" },
	{ type: "Task", key: "RFP-124", summary: "Gather reference customers for enterprise ESM", priority: "low", assignee: "Sam Rivera", status: "done" },
];

/** New subtask from a typed name (Create new tab). */
export function createSubtaskFromName(name: string): WorkItemChildItem {
	const seq = nextSeq();
	return {
		type: "Subtask",
		key: `NEW-${100 + seq}`,
		summary: name.trim() || "Untitled subtask",
		priority: "medium",
		status: "todo",
	};
}

// ── Linked work items ────────────────────────────────────────────────────────

export const LINK_RELATIONSHIPS: readonly RelationshipOption[] = [
	"blocks",
	"is blocked by",
	"relates to",
	"duplicates",
	"clones",
];

export const LINK_TYPES: readonly LinkedWorkItemType[] = ["Task", "Story", "Bug", "Epic"];

export const LINK_RECENT: readonly ContextLinkedItem[] = [
	{ id: "recent-rfp-100", key: "RFP-100", summary: "Enterprise RFP Response", type: "Epic", relationship: "relates to" },
	{ id: "recent-rfp-140", key: "RFP-140", summary: "Acmecorp procurement onboarding", type: "Task", relationship: "relates to" },
	{ id: "recent-rfp-141", key: "RFP-141", summary: "Security review for enterprise bids", type: "Task", relationship: "relates to" },
];

export const LINK_SIMILAR: readonly ContextLinkedItem[] = [
	{ id: "similar-rfp-102", key: "RFP-102", summary: "Northstar Bank supplier packet review", type: "Task", relationship: "relates to" },
	{ id: "similar-rfp-150", key: "RFP-150", summary: "Duplicate: Acmecorp ESM evaluation", type: "Story", relationship: "duplicates" },
	{ id: "similar-rfp-151", key: "RFP-151", summary: "CMDB scale spike blocking bid", type: "Bug", relationship: "is blocked by" },
];

/** New linked item created from the Create new tab. */
export function createLinkedItem(
	relationship: RelationshipOption,
	type: LinkedWorkItemType,
	summary: string,
): ContextLinkedItem {
	const seq = nextSeq();
	return {
		id: `link-new-${seq}`,
		key: `NEW-${200 + seq}`,
		summary: summary.trim() || "Untitled work item",
		type,
		relationship,
	};
}

/** Add an existing catalog item under a chosen relationship (fresh id each add). */
export function linkExistingItem(
	item: Readonly<ContextLinkedItem>,
	relationship: RelationshipOption,
): ContextLinkedItem {
	const seq = nextSeq();
	return { ...item, id: `link-existing-${seq}`, relationship };
}

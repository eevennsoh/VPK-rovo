"use client";

import { useEffect, useMemo, useState } from "react";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";

import {
	JiraList,
	type JiraListInsertion,
	type JiraListIssueType,
	type JiraListPerson,
} from "./index";
import { JIRA_LIST_SAMPLE_ROWS, type JiraListSampleRow } from "./data";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Tag, TagGroup } from "@/components/ui/tag";

function getNextIssueKey(rows: readonly JiraListSampleRow[]): string {
	const highestIssueNumber = rows.reduce((maxIssueNumber, row) => {
		const parsedIssueNumber = Number.parseInt(row.issueKey.split("-")[1] ?? "0", 10);
		return Number.isNaN(parsedIssueNumber) ? maxIssueNumber : Math.max(maxIssueNumber, parsedIssueNumber);
	}, 0);

	return `PD-${String(highestIssueNumber + 1).padStart(3, "0")}`;
}

export default function JiraListPage() {
	const [demoRows, setDemoRows] = useState<JiraListSampleRow[]>(() => [...JIRA_LIST_SAMPLE_ROWS]);
	const [selectedIssueKeys, setSelectedIssueKeys] = useState<Set<string>>(
		() => new Set(["PD-001"]),
	);
	const [copiedIssueKey, setCopiedIssueKey] = useState<string | null>(null);
	const [draftWorkItem, setDraftWorkItem] = useState<{
		anchorIssueKey: string | null;
		assignee?: JiraListPerson;
		dueDate?: string;
		insertAtIndex: number | null;
		issueType: JiraListIssueType;
		summary: string;
	} | null>(null);
	const [inModelRow, setInModelRow] = useState<JiraListSampleRow | null>(null);

	const nextIssueKey = useMemo(() => getNextIssueKey(demoRows), [demoRows]);

	useEffect(() => {
		if (!copiedIssueKey) {
			return;
		}

		const copiedStateTimer = window.setTimeout(() => {
			setCopiedIssueKey(null);
		}, 1800);

		return () => window.clearTimeout(copiedStateTimer);
	}, [copiedIssueKey]);

	const handleSelectAllRows = (checked: boolean) => {
		setSelectedIssueKeys(
			checked ? new Set(demoRows.map((row) => row.issueKey)) : new Set<string>(),
		);
	};

	const handleSelectRow = (issueKey: string, checked: boolean) => {
		setSelectedIssueKeys((currentSelected) => {
			const nextSelected = new Set(currentSelected);
			if (checked) {
				nextSelected.add(issueKey);
			} else {
				nextSelected.delete(issueKey);
			}
			return nextSelected;
		});
	};

	const handleMoveRow = (issueKey: string, targetIndex: number) => {
		setDemoRows((currentRows) => {
			const sourceIndex = currentRows.findIndex((row) => row.issueKey === issueKey);
			const boundedTargetIndex = Math.min(
				Math.max(targetIndex, 0),
				currentRows.length - 1,
			);
			if (sourceIndex < 0 || sourceIndex === boundedTargetIndex) {
				return currentRows;
			}

			const nextRows = [...currentRows];
			const [movedRow] = nextRows.splice(sourceIndex, 1);
			if (!movedRow) {
				return currentRows;
			}

			nextRows.splice(boundedTargetIndex, 0, movedRow);
			return nextRows;
		});
	};

	const handleCreateWorkItem = (insertion?: JiraListInsertion) => {
		const anchorRow = insertion
			? demoRows.find((row) => row.issueKey === insertion.relativeToIssueKey)
			: undefined;
		setDraftWorkItem({
			anchorIssueKey: anchorRow?.issueKey ?? null,
			insertAtIndex: insertion?.insertAtIndex ?? null,
			issueType: anchorRow?.issueType ?? "task",
			summary: "",
		});
	};

	const handleDraftWorkItemSubmit = () => {
		if (!draftWorkItem?.summary.trim()) {
			return;
		}

		const anchorRow = draftWorkItem.anchorIssueKey
			? demoRows.find((row) => row.issueKey === draftWorkItem.anchorIssueKey)
			: null;
		const nextIssueKey = getNextIssueKey(demoRows);
		const nextRow: JiraListSampleRow = {
			issueKey: nextIssueKey,
			summary: draftWorkItem.summary.trim(),
			issueType: draftWorkItem.issueType,
			priority: anchorRow?.priority ?? "medium",
			status: "To do",
			statusVariant: "neutral",
			assignee: draftWorkItem.assignee,
			agentSessions: [],
			goals: [],
			labels: [],
			dueDate: draftWorkItem.dueDate
				? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
						new Date(`${draftWorkItem.dueDate}T00:00:00`),
					)
				: undefined,
			contributors: [],
		};

		setDemoRows((currentRows) => {
			if (draftWorkItem.insertAtIndex === null) {
				return [...currentRows, nextRow];
			}

			const insertAtIndex = Math.min(Math.max(draftWorkItem.insertAtIndex, 0), currentRows.length);

			return [
				...currentRows.slice(0, insertAtIndex),
				nextRow,
				...currentRows.slice(insertAtIndex),
			];
		});
		setSelectedIssueKeys(new Set([nextIssueKey]));
		setDraftWorkItem(null);
	};

	const handleCopyLink = async (row: JiraListSampleRow) => {
		const currentUrl = new URL(window.location.href);
		currentUrl.hash = row.issueKey.toLowerCase();

		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(currentUrl.toString());
			}
		} catch {
			// Keep the demo optimistic even if clipboard access is blocked.
		}

		setCopiedIssueKey(row.issueKey);
	};

	const handleRefresh = () => {
		setDemoRows([...JIRA_LIST_SAMPLE_ROWS]);
		setSelectedIssueKeys(new Set());
		setCopiedIssueKey(null);
		setDraftWorkItem(null);
		setInModelRow(null);
	};

	return (
		<div className="rounded-lg bg-surface p-4 md:p-5">
			<JiraList
				copiedIssueKey={copiedIssueKey}
				draftWorkItem={draftWorkItem ? {
					assignee: draftWorkItem.assignee,
					dueDate: draftWorkItem.dueDate,
					insertAtIndex: draftWorkItem.insertAtIndex,
					issueKeyLabel: nextIssueKey,
					issueType: draftWorkItem.issueType,
					summary: draftWorkItem.summary,
				} : null}
				onCopyLink={handleCopyLink}
				onCreate={handleCreateWorkItem}
				onDraftWorkItemCancel={() => setDraftWorkItem(null)}
				onDraftWorkItemAssigneeChange={(assignee) => {
					setDraftWorkItem((currentDraft) => currentDraft ? { ...currentDraft, assignee } : currentDraft);
				}}
				onDraftWorkItemDueDateChange={(dueDate) => {
					setDraftWorkItem((currentDraft) => currentDraft ? { ...currentDraft, dueDate } : currentDraft);
				}}
				onDraftWorkItemIssueTypeChange={(issueType) => {
					setDraftWorkItem((currentDraft) => currentDraft ? { ...currentDraft, issueType } : currentDraft);
				}}
				onDraftWorkItemSubmit={handleDraftWorkItemSubmit}
				onDraftWorkItemSummaryChange={(summary) => {
					setDraftWorkItem((currentDraft) => currentDraft ? { ...currentDraft, summary } : currentDraft);
				}}
				onIssueClick={() => undefined}
				onIssueKeyClick={() => undefined}
				onMoveRow={handleMoveRow}
				onOpenAgentSessions={setInModelRow}
				onRefresh={handleRefresh}
				onSelectAllRows={handleSelectAllRows}
				onSelectRow={handleSelectRow}
				rows={demoRows}
				selectedIssueKeys={selectedIssueKeys}
				totalCountLabel={`${demoRows.length}`}
				visibleCount={demoRows.length}
			/>
			<Dialog open={Boolean(inModelRow)} onOpenChange={(open) => {
				if (!open) {
					setInModelRow(null);
				}
			}}>
				<DialogContent size="sm">
					<DialogHeader>
						<DialogTitle>
							<span className="inline-flex items-center gap-2">
								<Icon render={<AiChatIcon label="" size="small" />} />
								In Model
							</span>
						</DialogTitle>
						<DialogDescription>
							{inModelRow
								? `${inModelRow.issueKey} keeps its linked agent sessions available from the list hover state in this block demo.`
								: "Review the linked agent sessions for this work item."}
						</DialogDescription>
					</DialogHeader>
					{inModelRow ? (
						<div className="grid gap-3">
							<div className="rounded-lg border border-border bg-surface-sunken px-3 py-2">
								<p className="text-sm font-medium text-text">{inModelRow.summary}</p>
								<p className="text-xs text-text-subtle">{inModelRow.issueKey}</p>
							</div>
							<div className="grid gap-2">
								<p className="text-xs font-semibold tracking-[0.08em] text-text-subtle uppercase">
									Agent sessions
								</p>
								{inModelRow.agentSessions?.length ? (
									<TagGroup className="gap-1.5">
										{inModelRow.agentSessions.map((session, sessionIndex) => (
											<Tag color="teal" key={`${session}-${sessionIndex}`}>
												{session}
											</Tag>
										))}
									</TagGroup>
								) : (
									<p className="text-sm text-text-subtle">No linked sessions yet.</p>
								)}
							</div>
						</div>
					) : null}
					<DialogFooter>
						<Button onClick={() => setInModelRow(null)} variant="outline">
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

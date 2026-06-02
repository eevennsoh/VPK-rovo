"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ComponentProps, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";

import {
	Agent,
	AgentCompactHeaderNav,
	AgentConfigFields,
	type AgentConfigFormValue,
	AgentHeader,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
} from "@/components/ui-custom/agent";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import { getStudioSessionAgentDisplayName, useRovoChat } from "@/app/contexts";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
	StudioSessionAgentEntry,
} from "@/app/contexts/context-rovo-chat";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

type AgentResult = RovoDataParts["agent-result"];
type AgentResultConfigLists = AgentResult & Pick<AgentConfigFormValue, AgentConfigListFieldName>;
export type AgentConfigView = "configure" | "test";

interface RovoAppAgentConfigPanelProps {
	activeView: AgentConfigView;
	entry: StudioSessionAgentEntry;
	onClose?: () => void;
	onCommitPublishReady: (profileId: string) => void;
	onPublish: (profileId: string) => void;
	onTest: (profileId: string) => void;
	onViewChange: (view: AgentConfigView) => void;
	testPanel: ReactNode;
	onUpdateDraft: (
		profileId: string,
		patch: Partial<AgentResult>,
	) => void;
	className?: string;
}

function stringifyForComparison(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

type AgentConfigActionButtonProps = ButtonProps & {
	children: ReactNode;
	disabledTooltip?: string;
};

function AgentConfigActionButton({
	children,
	disabled,
	disabledTooltip,
	...props
}: Readonly<AgentConfigActionButtonProps>) {
	const button = (
		<Button disabled={disabled} {...props}>
			{children}
		</Button>
	);

	if (!disabled || !disabledTooltip) {
		return button;
	}

	return (
		<Tooltip>
			<TooltipTrigger render={<span className="inline-flex" />}>
				{button}
			</TooltipTrigger>
			<TooltipContent side="bottom">
				<p>{disabledTooltip}</p>
			</TooltipContent>
		</Tooltip>
	);
}

type AgentConfigToggleItemProps = ComponentProps<typeof ToggleGroupItem> & {
	disabledTooltip?: string;
};

function AgentConfigToggleItem({
	disabled,
	disabledTooltip,
	...props
}: Readonly<AgentConfigToggleItemProps>) {
	const item = <ToggleGroupItem disabled={disabled} {...props} />;

	if (!disabled || !disabledTooltip) {
		return item;
	}

	return (
		<Tooltip>
			<TooltipTrigger render={<span className="inline-flex" />}>
				{item}
			</TooltipTrigger>
			<TooltipContent side="bottom">
				<p>{disabledTooltip}</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function RovoAppAgentConfigPanel({
	activeView,
	entry,
	onClose,
	onCommitPublishReady,
	onPublish,
	onTest,
	onViewChange,
	testPanel,
	onUpdateDraft,
	className,
}: Readonly<RovoAppAgentConfigPanelProps>) {
	const draft = entry.draftResult;
	const shouldReduceMotion = useReducedMotion();
	const profileId = entry.profile.id;

	// Floating Rovo chat launcher for the agent config screen. studio surfaces
	// suppress the floating button by default (the shell owns chat), so we render
	// it with product="home" — product only gates visibility, it has no visual
	// effect — and pair it with the RovoFloatingChat surface the button opens,
	// mirroring the components/projects/rovo-button demo.
	const { chatSurface } = useRovoChat();

	const updateDraft = useCallback(
		(patch: Partial<AgentResult>) => {
			onUpdateDraft(profileId, patch);
		},
		[onUpdateDraft, profileId],
	);

	const handleConfigTextChange = useCallback(
		(field: AgentConfigTextFieldName, value: string) => {
			if (field === "description") {
				updateDraft({ description: value, summary: value });
				return;
			}
			updateDraft({ [field]: value } as Partial<AgentResult>);
		},
		[updateDraft],
	);

	const getDraftList = useCallback(
		(field: AgentConfigListFieldName): readonly string[] => {
			const value = (draft as AgentResultConfigLists)[field];
			return Array.isArray(value) ? value : [];
		},
		[draft],
	);

	const updateListItem = useCallback(
		(field: AgentConfigListFieldName, index: number, value: string) => {
			const current = getDraftList(field);
			const next = [...current];
			next[index] = value;
			updateDraft({ [field]: next } as Partial<AgentResult>);
		},
		[getDraftList, updateDraft],
	);

	const removeListItem = useCallback(
		(field: AgentConfigListFieldName, index: number) => {
			const current = getDraftList(field);
			const next = current.filter((_, itemIndex) => itemIndex !== index);
			updateDraft({ [field]: next } as Partial<AgentResult>);
		},
		[getDraftList, updateDraft],
	);

	const appendListItem = useCallback(
		(field: AgentConfigListFieldName) => {
			const current = getDraftList(field);
			updateDraft({ [field]: [...current, ""] } as Partial<AgentResult>);
		},
		[getDraftList, updateDraft],
	);

	const hasUpdateChanges = useMemo(() => {
		return (
			stringifyForComparison(entry.draftResult) !==
			stringifyForComparison(entry.publishReadyResult)
		);
	}, [entry.draftResult, entry.publishReadyResult]);

	const hasPublishChanges = useMemo(() => {
		if (!entry.publishedResult) {
			return true;
		}
		return (
			stringifyForComparison(entry.publishReadyResult) !==
			stringifyForComparison(entry.publishedResult)
		);
	}, [entry.publishReadyResult, entry.publishedResult]);

	const [justUpdatedAt, setJustUpdatedAt] = useState<number | null>(null);
	const justUpdatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (justUpdatedTimerRef.current) {
				clearTimeout(justUpdatedTimerRef.current);
			}
		};
	}, []);

	const handleUpdate = useCallback(() => {
		onCommitPublishReady(profileId);
		setJustUpdatedAt(Date.now());
		if (justUpdatedTimerRef.current) {
			clearTimeout(justUpdatedTimerRef.current);
		}
		justUpdatedTimerRef.current = setTimeout(() => {
			setJustUpdatedAt(null);
		}, 1500);
	}, [onCommitPublishReady, profileId]);

	const handlePublish = useCallback(() => {
		// Ensure publish-ready snapshot reflects current draft before publishing.
		if (hasUpdateChanges) {
			onCommitPublishReady(profileId);
		}
		onPublish(profileId);
	}, [hasUpdateChanges, onCommitPublishReady, onPublish, profileId]);

	const hasAgentInstructions = Boolean(draft.instructions?.trim());
	useEffect(() => {
		if (activeView === "test" && !hasAgentInstructions) {
			onViewChange("configure");
		}
	}, [activeView, hasAgentInstructions, onViewChange]);

	const handleTest = useCallback(() => {
		if (!hasAgentInstructions) {
			return;
		}
		if (hasUpdateChanges) {
			onCommitPublishReady(profileId);
		}
		onTest(profileId);
	}, [hasAgentInstructions, hasUpdateChanges, onCommitPublishReady, onTest, profileId]);

	const handleViewChange = useCallback(
		(value: string | null) => {
			if (value !== "configure" && value !== "test") {
				return;
			}
			if (value === "test") {
				handleTest();
				return;
			}
			onViewChange(value);
		},
		[handleTest, onViewChange],
	);

	// Mirror the avatar the sidebar nav renders for this agent (entry.profile.avatarSrc)
	// so the header + profile cover match instead of falling back to the static default.
	const agentAvatarSrc = entry.profile.avatarSrc;
	// `name` is still required by AgentHeader (accessibility/fallback); the compact
	// nav supplied via `leadingContent` is what actually renders on the left.
	const agentName = getStudioSessionAgentDisplayName(entry);

	return (
		<>
			<motion.div
				className={cn("flex h-full w-full flex-col overflow-hidden bg-surface", className)}
				data-screen-assistant-target="studio-agent-config-panel"
				initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.24, ease: [0, 0.4, 0, 1] }}
			>
			<Agent className="flex min-h-0 flex-1 flex-col">
				<Tabs
					className="min-h-0 flex-1"
					onValueChange={handleViewChange}
					value={activeView}
				>
					<AgentHeader
						name={agentName}
						leadingContent={<AgentCompactHeaderNav avatarSrc={agentAvatarSrc} />}
						actions={
							<>
								<ToggleGroup
									aria-label="Agent config views"
									variant="outline"
									size="sm"
									value={[activeView]}
									onValueChange={(value) =>
										handleViewChange((value[0] as AgentConfigView | undefined) ?? null)
									}
								>
									<ToggleGroupItem
										value="configure"
										data-testid="agent-config-configure"
										data-screen-assistant-target="studio-agent-config-configure"
									>
										Configure
									</ToggleGroupItem>
									<AgentConfigToggleItem
										value="test"
										disabled={!hasAgentInstructions}
										disabledTooltip="Add agent instructions before testing this agent."
										data-testid="agent-config-test"
										data-screen-assistant-target="studio-agent-config-test"
									>
										Test
									</AgentConfigToggleItem>
								</ToggleGroup>
								<AgentConfigActionButton
									type="button"
									size="default"
									variant="ghost"
									onClick={handleUpdate}
									disabled={!hasUpdateChanges}
									disabledTooltip="Make a change to the agent before updating the testing version."
									data-testid="agent-config-update"
									data-screen-assistant-target="studio-agent-config-update"
								>
									{justUpdatedAt ? "Updated" : "Update"}
								</AgentConfigActionButton>
								<Button
									type="button"
									size="default"
									variant="default"
									onClick={handlePublish}
									disabled={!hasPublishChanges}
									data-testid="agent-config-publish"
									data-screen-assistant-target="studio-agent-config-publish"
								>
									Publish
								</Button>
								{onClose ? (
									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={onClose}
										aria-label="Close agent config"
									>
										<CrossIcon label="" spacing="none" />
									</Button>
								) : null}
							</>
						}
					/>
					<TabsContent value="configure" className="min-h-0 flex-1 overflow-y-auto data-[hidden]:hidden">
						<div className="flex h-full w-full flex-col px-6 py-5">
							<AgentConfigFields
								config={draft}
								avatarSrc={agentAvatarSrc}
								idPrefix={`agent-${profileId}`}
								layout="compact"
								onTextChange={handleConfigTextChange}
								onListItemChange={updateListItem}
								onRemoveListItem={removeListItem}
								onAppendListItem={appendListItem}
								screenAssistantTargetPrefix="studio-agent-config"
							/>
						</div>
					</TabsContent>
					<TabsContent value="test" keepMounted={false} className="min-h-0 flex-1 data-[hidden]:hidden">
						{testPanel}
					</TabsContent>
				</Tabs>
			</Agent>
		</motion.div>
			{chatSurface === null ? (
				<FloatingRovoButton ariaLabel="Open Rovo chat" product="home" />
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>
		</>
	);
}

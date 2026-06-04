"use client";

import { useCallback, useId, useState } from "react";
import WarningIcon from "@atlaskit/icon/core/warning";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";
import CrossCircleIcon from "@atlaskit/icon/core/cross-circle";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
	AGENT_ACCESS_OPTIONS,
	DEFAULT_ATLASSIAN_APP_ACCESS,
	type AgentAccessMode,
	type AtlassianAppAccess,
	type ConnectedApp,
} from "../data/access";

export interface AgentAccessProps {
	/** Controlled selected access mode. */
	value?: AgentAccessMode;
	/** Initial mode for uncontrolled usage. Defaults to `"requesting-user"`. */
	defaultValue?: AgentAccessMode;
	/** Fires after a mode change is confirmed (post-warning for agent account). */
	onValueChange?: (value: AgentAccessMode) => void;
	/** Atlassian apps the agent account has been granted/denied access to. */
	atlassianApps?: readonly AtlassianAppAccess[];
	/** Third-party apps available once connected. Empty renders the empty state. */
	connectedApps?: readonly ConnectedApp[];
	/** Invoked by the connected-apps empty-state action. */
	onGoToAgentDetails?: () => void;
	className?: string;
}

/**
 * Agent "Access" settings screen: choose whether an agent acts as the
 * requesting user or via its own account, with a confirmation step that warns
 * about broad access, plus Atlassian + connected app access summaries shown for
 * the agent-account mode.
 */
export function AgentAccess({
	value,
	defaultValue = "requesting-user",
	onValueChange,
	atlassianApps = DEFAULT_ATLASSIAN_APP_ACCESS,
	connectedApps = [],
	onGoToAgentDetails,
	className,
}: Readonly<AgentAccessProps>) {
	const headingId = useId();
	const [internalValue, setInternalValue] = useState<AgentAccessMode>(defaultValue);
	const [warningOpen, setWarningOpen] = useState(false);

	const isControlled = value !== undefined;
	const selected = isControlled ? value : internalValue;

	const commit = useCallback(
		(next: AgentAccessMode) => {
			if (!isControlled) {
				setInternalValue(next);
			}
			onValueChange?.(next);
		},
		[isControlled, onValueChange],
	);

	const handleChange = useCallback(
		(next: unknown) => {
			const mode = next as AgentAccessMode;
			// Switching to the agent account broadens access, so confirm first.
			if (mode === "agent-account" && selected !== "agent-account") {
				setWarningOpen(true);
				return;
			}
			commit(mode);
		},
		[commit, selected],
	);

	const confirmAgentAccount = useCallback(() => {
		setWarningOpen(false);
		commit("agent-account");
	}, [commit]);

	const showAppAccess = selected === "agent-account";

	return (
		<section
			aria-labelledby={headingId}
			className={cn("flex w-full flex-col gap-8", className)}
			data-slot="agent-access"
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<h3 id={headingId} className="text-sm font-semibold text-text">
						Account
					</h3>
					<p className="text-sm text-text-subtle">
						Choose which permissions this agent will use when using a tool or
						accessing knowledge.
					</p>
				</div>

				<RadioGroup
					aria-label="Agent account permissions"
					className="grid gap-4 sm:grid-cols-2"
					value={selected}
					onValueChange={handleChange}
				>
					{AGENT_ACCESS_OPTIONS.map((option) => {
						const isSelected = option.value === selected;
						return (
							<label
								key={option.value}
								className={cn(
									"group flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
									isSelected
										? "border-border-selected bg-bg-selected"
										: "border-border bg-surface hover:bg-bg-neutral-subtle-hovered",
								)}
							>
								<RadioGroupItem
									value={option.value}
									className="mt-0.5"
									aria-label={option.title}
								/>
								<span className="flex min-w-0 flex-col gap-1">
									<span className="text-sm font-medium text-text">
										{option.title}
									</span>
									<span className="text-sm leading-5 text-text-subtle">
										{option.description}
									</span>
								</span>
							</label>
						);
					})}
				</RadioGroup>
			</div>

			{showAppAccess ? (
				<>
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<h3 className="text-sm font-semibold text-text">
								Atlassian app access
							</h3>
							<p className="text-sm text-text-subtle">
								This agent has been granted access to the following apps. If an
								app isn&apos;t listed here, then the agent can&apos;t access or use
								it. If you&apos;re an organization admin, you can configure this
								agent&apos;s app access in Atlassian Administration.
							</p>
						</div>

						<div className="rounded-lg border border-border">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="px-4">App</TableHead>
										<TableHead className="px-4 text-right">Access</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{atlassianApps.map((app) => {
										const AppIcon = app.icon;
										const granted = app.access === "granted";
										return (
											<TableRow key={app.id} className="hover:bg-transparent">
												<TableCell className="px-4">
													<span className="flex items-center gap-3">
														<Checkbox checked={granted} aria-label={`${app.name} access`} />
														<AppIcon label="" size="small" />
														<span className="text-sm text-text">{app.name}</span>
													</span>
												</TableCell>
												<TableCell className="px-4 text-right">
													<span className="inline-flex justify-end">
														{granted ? (
															<span className="text-icon-success" title="Access granted">
																<StatusSuccessIcon label="Access granted" />
															</span>
														) : (
															<span className="text-icon-subtle" title="No access">
																<CrossCircleIcon label="No access" />
															</span>
														)}
													</span>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</div>

					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<h3 className="text-sm font-semibold text-text">
								Connected app access
							</h3>
							<p className="text-sm text-text-subtle">
								Based on your agent&apos;s tools and knowledge, the following apps
								are available for your agent to use once connected.
							</p>
						</div>

						{connectedApps.length === 0 ? (
							<div className="rounded-lg border border-border">
								<Empty>
									<EmptyHeader>
										<EmptyTitle headingSize="xsmall">
											Your agent doesn&apos;t use any connected apps
										</EmptyTitle>
										<EmptyDescription>
											Add tools or knowledge sources to your agent that require
											third-party connections. They will appear here once
											configured.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Button variant="default" onClick={onGoToAgentDetails}>
											Go to agent details
										</Button>
									</EmptyContent>
								</Empty>
							</div>
						) : (
							<div className="rounded-lg border border-border">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											<TableHead className="px-4">App</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{connectedApps.map((app) => (
											<TableRow key={app.id} className="hover:bg-transparent">
												<TableCell className="px-4">
													<span className="flex items-center gap-3 text-sm text-text">
														{app.icon}
														{app.name}
													</span>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</div>
				</>
			) : null}

			<AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia className="bg-bg-warning text-icon-warning">
							<WarningIcon label="" />
						</AlertDialogMedia>
						<AlertDialogTitle>This agent is available to all users</AlertDialogTitle>
						<AlertDialogDescription>
							Using <strong>Agent account</strong>{" "}will mean that all users can
							access the information that the agent has access to. If you&apos;re
							unsure of what information the agent can access with its account, you
							can restrict the people who can use it before choosing this setting.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction variant="warning" onClick={confirmAgentAccount}>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}

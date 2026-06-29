"use client"

import Image from "next/image"
import { useState } from "react"

import InformationIcon from "@atlaskit/icon/core/status-information"
import ThumbsDownIcon from "@atlaskit/icon/core/thumbs-down"
import ThumbsUpIcon from "@atlaskit/icon/core/thumbs-up"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Lozenge } from "@/components/ui/lozenge"
import {
	Panel,
	PanelActionBack,
	PanelActionClose,
	PanelActionExpand,
	PanelActionGroup,
	PanelActionMore,
	PanelActionNewTab,
	PanelBody,
	PanelContent,
	PanelDisclaimer,
	PanelFooter,
	PanelHeader,
	PanelSubheader,
	PanelTitle,
} from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { AtlassianLogo } from "@/components/ui/logo"

const PANEL_DOCS_HREF = "https://atlassian.design/components/panel/examples"
const PANEL_COVER_SRC = "/ambient/atlassian/pictorial/clouds/primary/blue.png"

function PanelFrame({
	children,
	height = "h-[520px]",
}: Readonly<{ children: React.ReactNode; height?: string }>) {
	return (
		<div
			className={`mx-auto ${height} w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface`}
		>
			{children}
		</div>
	)
}

function GalleryFrame({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="mx-auto flex w-full max-w-md flex-col gap-3">{children}</div>
	)
}

function VariantCard({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="overflow-hidden rounded-lg border border-border bg-surface">
			{children}
		</div>
	)
}

function JiraTitle({ label = "App name" }: Readonly<{ label?: string }>) {
	return (
		<PanelTitle
			icon={<AtlassianLogo name="jira" size="xxsmall" variant="icon" />}
		>
			{label}
		</PanelTitle>
	)
}

export default function PanelDemo() {
	return <PanelDemoDefault />
}

// ============================================================
// Default (page preview) — app name header with contextual body
// ============================================================

export function PanelDemoDefault() {
	return (
		<PanelFrame>
			<Panel aria-label="Issue details">
				<PanelHeader>
					<JiraTitle label="Jira" />
					<PanelActionGroup>
						<PanelActionExpand />
						<PanelActionNewTab href={PANEL_DOCS_HREF} />
						<PanelActionMore />
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
				<PanelContent>
					<PanelSubheader
						title="ENG-482 Improve import flow"
						breadcrumbs={
							<span className="text-sm text-text-subtle">
								Projects / Platform / Import
							</span>
						}
					/>
					<PanelBody>
						<div className="flex flex-col gap-4 text-sm leading-5 text-text">
							<div className="flex items-center justify-between gap-3">
								<span className="text-text-subtle">Status</span>
								<Lozenge variant="information">In progress</Lozenge>
							</div>
							<p>
								The importer needs clearer progress states and a retry path for
								records that fail validation.
							</p>
							<div className="rounded-md bg-bg-neutral p-3">
								<p className="font-medium text-text">Next step</p>
								<p className="mt-1 text-text-subtle">
									Review the failed records and confirm whether they should be
									skipped or remapped.
								</p>
							</div>
						</div>
					</PanelBody>
				</PanelContent>
			</Panel>
		</PanelFrame>
	)
}

// ============================================================
// Basic — minimal composition (header + body + footer)
// ============================================================

export function PanelDemoBasic() {
	return (
		<PanelFrame>
			<Panel aria-label="Basic panel">
				<PanelHeader>
					<PanelTitle>Panel title</PanelTitle>
					<PanelActionGroup>
						<PanelActionExpand />
						<PanelActionNewTab href={PANEL_DOCS_HREF} />
						<PanelActionMore />
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
				<PanelContent>
					<PanelBody>
						<div className="flex flex-col gap-3 pt-4 text-sm leading-5 text-text">
							<p>This is a basic example of the panel system components.</p>
							<p className="text-text-subtle">
								The panel includes a header with a title and actions, and a body
								area for content.
							</p>
						</div>
					</PanelBody>
				</PanelContent>
				<PanelFooter>
					<Button size="compact">Save</Button>
					<Button variant="ghost" size="compact">
						Cancel
					</Button>
				</PanelFooter>
			</Panel>
		</PanelFrame>
	)
}

// ============================================================
// Header — composition variants for PanelHeader
// ============================================================

export function PanelDemoHeader() {
	return (
		<GalleryFrame>
			{/* Title only */}
			<VariantCard>
				<PanelHeader>
					<PanelTitle>Header title</PanelTitle>
					<PanelActionGroup>
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
			</VariantCard>

			{/* Title with leading icon */}
			<VariantCard>
				<PanelHeader>
					<PanelTitle
						icon={
							<Icon
								render={
									<InformationIcon label="" size="small" color="currentColor" />
								}
								aria-hidden
							/>
						}
					>
						Header title
					</PanelTitle>
					<PanelActionGroup>
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
			</VariantCard>

			{/* App name with product logo */}
			<VariantCard>
				<PanelHeader>
					<JiraTitle />
					<PanelActionGroup>
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
			</VariantCard>

			{/* Back navigation */}
			<VariantCard>
				<PanelHeader>
					<PanelActionBack />
					<JiraTitle />
					<PanelActionGroup>
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
			</VariantCard>

			{/* App name with open in new tab */}
			<VariantCard>
				<PanelHeader>
					<JiraTitle />
					<PanelActionGroup>
						<PanelActionNewTab href={PANEL_DOCS_HREF} />
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
			</VariantCard>

			{/* App name with full action group */}
			<VariantCard>
				<PanelHeader>
					<JiraTitle />
					<PanelActionGroup>
						<PanelActionMore />
						<PanelActionExpand />
						<PanelActionNewTab href={PANEL_DOCS_HREF} />
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
			</VariantCard>
		</GalleryFrame>
	)
}

// ============================================================
// Subheader — cover image and breadcrumbs
// ============================================================

export function PanelDemoWithSubheader() {
	return (
		<PanelFrame height="h-[560px]">
			<Panel aria-label="Page preview">
				<PanelHeader>
					<PanelTitle>Confluence</PanelTitle>
					<PanelActionGroup>
						<PanelActionNewTab href={PANEL_DOCS_HREF} />
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
				<PanelContent>
					<PanelSubheader
						title="Launch readiness"
						coverImage={
							<Image
								src={PANEL_COVER_SRC}
								alt=""
								width={640}
								height={160}
							/>
						}
					/>
					<PanelBody>
						<div className="flex flex-col gap-3 text-sm leading-5 text-text">
							<p>
								Use a subheader when the panel needs object-level context below
								the source header. Cover media can bleed to the panel edge while
								the body keeps the standard 24px horizontal padding.
							</p>
							<div className="grid gap-2">
								<div className="rounded-md border border-border p-3">
									<p className="font-medium">Release checklist</p>
									<p className="text-text-subtle">8 of 12 tasks complete</p>
								</div>
								<div className="rounded-md border border-border p-3">
									<p className="font-medium">Risk review</p>
									<p className="text-text-subtle">No blocking issues</p>
								</div>
							</div>
						</div>
					</PanelBody>
				</PanelContent>
			</Panel>
		</PanelFrame>
	)
}

// ============================================================
// Subheader — inline edit (editable title)
// ============================================================

export function PanelDemoInlineEdit() {
	return (
		<PanelFrame height="h-[440px]">
			<Panel aria-label="Edit page">
				<PanelHeader>
					<PanelTitle>Confluence</PanelTitle>
					<PanelActionGroup>
						<PanelActionMore />
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
				<PanelContent>
					<PanelSubheader
						title="Launch readiness"
						inlineEdit={
							<Input
								aria-label="Page title"
								defaultValue="Launch readiness"
								className="text-xl font-medium leading-6"
							/>
						}
					/>
					<PanelBody>
						<div className="flex flex-col gap-3 text-sm leading-5 text-text">
							<p>
								Pass an editable field to the subheader&apos;s{" "}
								<code>inlineEdit</code> slot to let people update the title
								without leaving the panel.
							</p>
						</div>
					</PanelBody>
				</PanelContent>
			</Panel>
		</PanelFrame>
	)
}

// ============================================================
// Footer — action alignment and disclaimer variants
// ============================================================

export function PanelDemoWithFooter() {
	return (
		<GalleryFrame>
			{/* Right aligned actions */}
			<VariantCard>
				<PanelFooter className="border-t-0">
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="compact">
							Secondary action
						</Button>
						<Button size="compact">Primary action</Button>
					</div>
				</PanelFooter>
			</VariantCard>

			{/* Spread out actions */}
			<VariantCard>
				<PanelFooter className="border-t-0">
					<Button size="compact">Primary action</Button>
					<Button variant="outline" size="compact">
						Secondary action
					</Button>
				</PanelFooter>
			</VariantCard>

			{/* Single-zone disclaimer */}
			<VariantCard>
				<PanelFooter
					className="border-t-0"
					disclaimer={
						<PanelDisclaimer className="text-center">
							Powered by Rovo AI. Verify results.
						</PanelDisclaimer>
					}
				>
					<Button size="compact">Primary action</Button>
					<label className="flex items-center gap-2">
						<Checkbox />
						<span className="min-w-0 flex-1">Label</span>
					</label>
				</PanelFooter>
			</VariantCard>

			{/* Two-zone disclaimer */}
			<VariantCard>
				<PanelFooter
					className="border-t-0"
					disclaimer={
						<PanelDisclaimer>
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-1">
									<Button variant="ghost" size="icon-compact" aria-label="Helpful">
										<Icon
											render={
												<ThumbsUpIcon
													label=""
													size="small"
													color="currentColor"
												/>
											}
											aria-hidden
										/>
									</Button>
									<Button
										variant="ghost"
										size="icon-compact"
										aria-label="Not helpful"
									>
										<Icon
											render={
												<ThumbsDownIcon
													label=""
													size="small"
													color="currentColor"
												/>
											}
											aria-hidden
										/>
									</Button>
								</div>
								<span>Powered by Rovo AI. Verify results.</span>
							</div>
						</PanelDisclaimer>
					}
				>
					<Button size="compact">Primary action</Button>
					<label className="flex items-center gap-2">
						<Checkbox />
						<span className="min-w-0 flex-1">Label</span>
					</label>
				</PanelFooter>
			</VariantCard>

			{/* Comment composer footer */}
			<VariantCard>
				<PanelFooter className="border-t-0">
					<div className="flex w-full flex-col gap-3">
						<Textarea
							rows={2}
							placeholder="Add text, @mention others, or use / for elements"
						/>
						<div className="flex items-center justify-between gap-2">
							<label className="flex items-center gap-2">
								<Checkbox />
								<span className="min-w-0 flex-1">Watch this content</span>
							</label>
							<Button size="compact">Add comment</Button>
						</div>
					</div>
				</PanelFooter>
			</VariantCard>
		</GalleryFrame>
	)
}

// ============================================================
// Loading — default skeleton state
// ============================================================

export function PanelDemoLoading() {
	return (
		<PanelFrame>
			<Panel aria-label="Loading panel">
				<PanelHeader>
					<div className="flex w-full items-center justify-between">
						<Skeleton className="h-5 w-24" />
						<div className="flex items-center gap-1">
							<Skeleton className="size-6 rounded-md" />
							<Skeleton className="size-6 rounded-md" />
						</div>
					</div>
				</PanelHeader>
				<PanelContent>
					<div className="flex flex-col gap-3 px-6 pb-4">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-7 w-3/4" />
					</div>
					<PanelBody>
						<div className="flex flex-col gap-3">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
							<Skeleton className="mt-2 h-20 w-full rounded-md" />
						</div>
					</PanelBody>
				</PanelContent>
			</Panel>
		</PanelFrame>
	)
}

// ============================================================
// Unsaved changes — intercept close with onBeforeClose
// ============================================================

export function PanelDemoUnsavedChanges() {
	const [closed, setClosed] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true)

	function handleBeforeClose() {
		if (!hasUnsavedChanges) {
			return true
		}
		return window.confirm("You have unsaved changes. Close the panel anyway?")
	}

	if (closed) {
		return (
			<PanelFrame height="h-[400px]">
				<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
					<p className="text-sm text-text-subtle">Panel closed.</p>
					<Button
						variant="ghost"
						size="compact"
						onClick={() => {
							setClosed(false)
							setHasUnsavedChanges(true)
						}}
					>
						Reopen panel
					</Button>
				</div>
			</PanelFrame>
		)
	}

	return (
		<PanelFrame height="h-[400px]">
			<Panel aria-label="Edit draft">
				<PanelHeader>
					<PanelTitle>Edit draft</PanelTitle>
					<PanelActionGroup>
						<PanelActionClose
							onBeforeClose={handleBeforeClose}
							onClick={() => setClosed(true)}
						/>
					</PanelActionGroup>
				</PanelHeader>
				<PanelContent>
					<PanelBody>
						<div className="flex flex-col gap-4 pt-4 text-sm leading-5 text-text">
							<p>
								<code>PanelActionClose</code> accepts an{" "}
								<code>onBeforeClose</code> callback. Return <code>false</code> to
								keep the panel open — for example, to confirm before discarding
								unsaved changes.
							</p>
							<label className="flex items-center gap-3">
								<Checkbox
									checked={hasUnsavedChanges}
									onCheckedChange={(checked) =>
										setHasUnsavedChanges(checked === true)
									}
								/>
								<span className="min-w-0 flex-1">Has unsaved changes</span>
							</label>
						</div>
					</PanelBody>
				</PanelContent>
			</Panel>
		</PanelFrame>
	)
}

"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Lozenge } from "@/components/ui/lozenge"
import {
	Panel,
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
import { AtlassianLogo } from "@/components/ui/logo"

export default function PanelDemo() {
	return <PanelDemoDefault />
}

export function PanelDemoDefault() {
	return (
		<div className="mx-auto h-[520px] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
			<Panel aria-label="Issue details">
				<PanelHeader>
					<PanelTitle
						icon={
							<AtlassianLogo
								name="atlassian"
								size="xxsmall"
								variant="icon"
							/>
						}
					>
						Jira
					</PanelTitle>
					<PanelActionGroup>
						<PanelActionExpand />
						<PanelActionNewTab href="https://atlassian.design/components/panel/examples" />
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
		</div>
	)
}

export function PanelDemoWithSubheader() {
	return (
		<div className="mx-auto h-[560px] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
			<Panel aria-label="Page preview">
				<PanelHeader>
					<PanelTitle>Confluence</PanelTitle>
					<PanelActionGroup>
						<PanelActionNewTab href="https://atlassian.design/components/panel/examples" />
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
				<PanelContent>
					<PanelSubheader
						title="Launch readiness"
						coverImage={
							<Image
								src="/illustration-ai/hero/light.svg"
								alt=""
								width={640}
								height={320}
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
		</div>
	)
}

export function PanelDemoWithFooter() {
	return (
		<div className="mx-auto h-[520px] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
			<Panel aria-label="Add fields">
				<PanelHeader>
					<PanelTitle>Add fields</PanelTitle>
					<PanelActionGroup>
						<PanelActionClose />
					</PanelActionGroup>
				</PanelHeader>
				<PanelContent>
					<PanelSubheader title="Default field scheme" />
					<PanelBody>
						<div className="flex flex-col gap-3 text-sm leading-5 text-text">
							<label className="flex items-center gap-3 rounded-md border border-border p-3">
								<input type="checkbox" className="size-4" defaultChecked />
								<span className="min-w-0 flex-1">Customer impact</span>
							</label>
							<label className="flex items-center gap-3 rounded-md border border-border p-3">
								<input type="checkbox" className="size-4" />
								<span className="min-w-0 flex-1">Risk level</span>
							</label>
							<label className="flex items-center gap-3 rounded-md border border-border p-3">
								<input type="checkbox" className="size-4" />
								<span className="min-w-0 flex-1">Launch owner</span>
							</label>
						</div>
					</PanelBody>
				</PanelContent>
				<PanelFooter
					disclaimer={
						<PanelDisclaimer>
							Fields added here apply to every work item using this scheme.
						</PanelDisclaimer>
					}
				>
					<Button size="compact">Add</Button>
					<Button variant="ghost" size="compact">
						Cancel
					</Button>
				</PanelFooter>
			</Panel>
		</div>
	)
}

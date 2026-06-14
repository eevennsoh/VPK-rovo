"use client"

import ArrowDownRightIcon from "@atlaskit/icon/core/arrow-down-right"
import ImageIcon from "@atlaskit/icon/core/image"
import LockIcon from "@atlaskit/icon/core/lock-locked"

import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { IconTile } from "@/components/ui/icon-tile"
import { Lozenge, LozengeDropdownTrigger } from "@/components/ui/lozenge"
import { AtlassianLogo, RovoColorIcon } from "@/components/ui/logo"
import { BrandLogoMark } from "@/components/ui/logo-mark"

export default function LozengeDemo() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Lozenge>Neutral</Lozenge>
			<Lozenge variant="success">Success</Lozenge>
			<Lozenge variant="information">Information</Lozenge>
			<Lozenge variant="discovery">Discovery</Lozenge>
		</div>
	)
}

export function LozengeDemoDefault() {
	return <Lozenge>Neutral</Lozenge>
}

export function LozengeDemoAppearances() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Lozenge variant="neutral">Neutral</Lozenge>
			<Lozenge variant="success">Success</Lozenge>
			<Lozenge variant="warning">Warning</Lozenge>
			<Lozenge variant="danger">Danger</Lozenge>
			<Lozenge variant="information">Information</Lozenge>
			<Lozenge variant="discovery">Discovery</Lozenge>
		</div>
	)
}

export function LozengeDemoAccentColors() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Lozenge variant="accent-red">Red</Lozenge>
			<Lozenge variant="accent-orange">Orange</Lozenge>
			<Lozenge variant="accent-yellow">Yellow</Lozenge>
			<Lozenge variant="accent-lime">Lime</Lozenge>
			<Lozenge variant="accent-green">Green</Lozenge>
			<Lozenge variant="accent-teal">Teal</Lozenge>
			<Lozenge variant="accent-blue">Blue</Lozenge>
			<Lozenge variant="accent-purple">Purple</Lozenge>
			<Lozenge variant="accent-magenta">Magenta</Lozenge>
			<Lozenge variant="accent-gray">Gray</Lozenge>
		</div>
	)
}

export function LozengeDemoSpacing() {
	return (
		<div className="flex flex-col items-start gap-3">
			<Lozenge variant="information">Default</Lozenge>
			<Lozenge variant="information" size="spacious">
				Spacious
			</Lozenge>
			<Lozenge
				variant="information"
				size="spacious"
				icon={
					<Icon
						render={<ImageIcon label="" size="small" />}
						aria-hidden
					/>
				}
			>
				Spacious with icon
			</Lozenge>
		</div>
	)
}

export function LozengeDemoWithIcon() {
	return (
		<Lozenge
			variant="success"
			icon={
				<Icon
					render={<ImageIcon label="" size="small" />}
					aria-hidden
				/>
			}
		>
			With icon
		</Lozenge>
	)
}

export function LozengeDemoFrontSlot() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Lozenge
				variant="accent-blue"
				elemBefore={
					<AtlassianLogo name="jira" label="Jira" size="xxsmall" withUsageBorder />
				}
			>
				Jira
			</Lozenge>
			<Lozenge
				variant="accent-purple"
				elemBefore={
					<IconTile
						aria-hidden
						icon={<AtlassianLogo name="atlassian" label="Atlassian" size="xxsmall" />}
						label="Atlassian"
						size="xxsmall"
						variant="transparent"
					/>
				}
			>
				Atlassian
			</Lozenge>
			<Lozenge
				variant="accent-green"
				elemBefore={
					<IconTile
						aria-hidden
						icon={<RovoColorIcon aria-hidden />}
						label="Rovo"
						size="xxsmall"
						variant="transparent"
					/>
				}
			>
				Rovo
			</Lozenge>
			<Lozenge
				variant="accent-orange"
				elemBefore={<BrandLogoMark frame="chip" src="/2p/appfire.png" label="Appfire" />}
			>
				Appfire
			</Lozenge>
			<Lozenge
				variant="accent-purple"
				elemBefore={<BrandLogoMark frame="chip" src="/3p/figma/16.svg" label="Figma" />}
			>
				Figma
			</Lozenge>
			<Lozenge
				variant="accent-green"
				elemBefore={
					<BrandLogoMark frame="chip" src="/3p/google-drive/16.svg" label="Google Drive" />
				}
			>
				Drive
			</Lozenge>
			<Lozenge
				variant="danger"
				elemBefore={
					<IconTile
						aria-hidden
						icon={<Icon aria-hidden render={<LockIcon label="" size="small" />} />}
						label=""
						size="xxsmall"
						variant="transparent"
					/>
				}
			>
				Restricted
			</Lozenge>
		</div>
	)
}

export function LozengeDemoTrailingMetric() {
	return (
		<div className="flex flex-col items-start gap-3">
			<Lozenge variant="neutral" className="pr-px">
				Not started
				<Badge
					variant="secondary"
					className="ml-1 min-w-0 bg-bg-neutral-pressed hover:bg-bg-neutral-pressed active:bg-bg-neutral-pressed"
				>
					0
				</Badge>
			</Lozenge>
			<Lozenge variant="success" className="pr-px">
				Completed
				<Badge
					variant="success"
					className="ml-1 min-w-0 bg-bg-success-subtler-pressed hover:bg-bg-success-subtler-pressed active:bg-bg-success-subtler-pressed"
				>
					0.8
				</Badge>
			</Lozenge>
			<Lozenge variant="information" className="pr-px">
				In progress
				<Badge
					variant="info"
					className="ml-1 min-w-0 bg-bg-information-subtler-pressed hover:bg-bg-information-subtler-pressed active:bg-bg-information-subtler-pressed"
				>
					0.5
				</Badge>
			</Lozenge>
			<Lozenge
				variant="danger"
				size="spacious"
				className="pr-1"
				icon={
					<Icon
						render={<ArrowDownRightIcon label="" size="small" />}
						aria-hidden
					/>
				}
			>
				Off track
				<Badge
					variant="destructive"
					className="ml-1.5 h-5 min-w-0 rounded-sm bg-bg-danger-subtler-pressed px-1.5 text-sm leading-5 hover:bg-bg-danger-subtler-pressed active:bg-bg-danger-subtler-pressed"
				>
					0.3
				</Badge>
			</Lozenge>
		</div>
	)
}

export function LozengeDemoMaxWidth() {
	return (
		<div className="flex flex-col items-start gap-3">
			<Lozenge variant="success">
				default max width with long text which truncates
			</Lozenge>
			<Lozenge maxWidth={100} variant="success">
				custom max width with long text which truncates
			</Lozenge>
		</div>
	)
}

export function LozengeDemoDropdownTrigger() {
	return (
		<LozengeDropdownTrigger variant="success">
			Success
		</LozengeDropdownTrigger>
	)
}

export function LozengeDemoDropdownTriggerAppearances() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<LozengeDropdownTrigger variant="success">Success</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="warning">Warning</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="danger">Danger</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="information">Information</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="discovery">Discovery</LozengeDropdownTrigger>
			<LozengeDropdownTrigger variant="neutral">Neutral</LozengeDropdownTrigger>
		</div>
	)
}

export function LozengeDemoUsage() {
	return (
		<div className="flex items-center gap-3">
			<span className="text-sm text-text">PROJ-123</span>
			<Lozenge variant="information">In progress</Lozenge>
		</div>
	)
}

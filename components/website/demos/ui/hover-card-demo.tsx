"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import StatusErrorIcon from "@atlaskit/icon/core/status-error";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";
import StatusWarningIcon from "@atlaskit/icon/core/status-warning";

export default function HoverCardDemo() {
	return (
		<HoverCard>
			<HoverCardTrigger render={<a aria-label="Open hover card" href="#" />}>
				@nextjs
			</HoverCardTrigger>
			<HoverCardContent>
				<div className="flex gap-3">
					<Avatar>
						<AvatarImage src="/avatar-user/01.png" alt="Next.js" />
						<AvatarFallback>NJ</AvatarFallback>
					</Avatar>
					<div className="grid gap-1">
						<h4 className="text-sm font-semibold">Next.js</h4>
						<p className="text-text-subtle text-xs">The React framework for the web.</p>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}

export function HoverCardDemoDefault() {
	return (
		<HoverCard>
			<HoverCardTrigger render={<a aria-label="Open hover card" href="#" />}>
				@nextjs
			</HoverCardTrigger>
			<HoverCardContent>
				<div className="flex gap-3">
					<Avatar>
						<AvatarImage src="/avatar-user/01.png" alt="Next.js" />
						<AvatarFallback>NJ</AvatarFallback>
					</Avatar>
					<div className="grid gap-1">
						<h4 className="text-sm font-semibold">Next.js</h4>
						<p className="text-text-subtle text-xs">@nextjs</p>
						<p className="text-sm">
							The React framework for the web. Used by some of the
							world&apos;s largest companies.
						</p>
						<p className="text-text-subtle text-xs">
							Joined December 2021
						</p>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}

export function HoverCardDemoButton() {
	return (
		<HoverCard>
			<HoverCardTrigger render={<Button variant="outline" />}>
				View details
			</HoverCardTrigger>
			<HoverCardContent>
				<div className="grid gap-1.5">
					<h4 className="text-sm font-semibold">Project Alpha</h4>
					<p className="text-text-subtle text-sm">
						A cross-team initiative to modernize the platform architecture.
						Started Q1 2025.
					</p>
					<div className="flex items-center gap-1.5 text-xs text-text-subtle">
						<span>3 members</span>
						<span>·</span>
						<span>12 tasks</span>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}

export function HoverCardDemoInlineMessage() {
	return (
		<div className="flex flex-col gap-3">
			<HoverCard>
				<HoverCardTrigger render={<a aria-label="Open hover card" href="#" />}>
					<span className="inline-flex items-center gap-1.5">
						<Icon render={<StatusSuccessIcon label="" />} label="Success" className="text-icon-success" />
						<span>Changes saved successfully</span>
					</span>
				</HoverCardTrigger>
				<HoverCardContent>
					<div className="grid gap-1">
						<h4 className="text-sm font-semibold">Auto-saved</h4>
						<p className="text-text-subtle text-sm">
							Your changes were automatically saved at 2:45 PM. No further action needed.
						</p>
					</div>
				</HoverCardContent>
			</HoverCard>
			<HoverCard>
				<HoverCardTrigger render={<a aria-label="Open hover card" href="#" />}>
					<span className="inline-flex items-center gap-1.5">
						<Icon render={<StatusWarningIcon label="" />} label="Warning" className="text-icon-warning" />
						<span>3 issues need attention</span>
					</span>
				</HoverCardTrigger>
				<HoverCardContent>
					<div className="grid gap-1">
						<h4 className="text-sm font-semibold">Pending issues</h4>
						<p className="text-text-subtle text-sm">
							There are 3 unresolved issues that may affect your deployment.
						</p>
					</div>
				</HoverCardContent>
			</HoverCard>
			<HoverCard>
				<HoverCardTrigger render={<a aria-label="Open hover card" href="#" />}>
					<span className="inline-flex items-center gap-1.5">
						<Icon render={<StatusErrorIcon label="" />} label="Error" className="text-icon-danger" />
						<span>Build failed</span>
					</span>
				</HoverCardTrigger>
				<HoverCardContent>
					<div className="grid gap-1">
						<h4 className="text-sm font-semibold">Build error</h4>
						<p className="text-text-subtle text-sm">
							The build failed due to a type error in checkout module. Check logs for details.
						</p>
					</div>
				</HoverCardContent>
			</HoverCard>
			<HoverCard>
				<HoverCardTrigger render={<a aria-label="Open hover card" href="#" />}>
					<span className="inline-flex items-center gap-1.5">
						<Icon render={<InformationCircleIcon label="" />} label="Info" className="text-icon-information" />
						<span>New permissions model</span>
					</span>
				</HoverCardTrigger>
				<HoverCardContent>
					<div className="grid gap-1">
						<h4 className="text-sm font-semibold">Updated permissions</h4>
						<p className="text-text-subtle text-sm">
							The permissions model has been updated. Review the changes to understand how access controls have changed.
						</p>
					</div>
				</HoverCardContent>
			</HoverCard>
		</div>
	);
}

export function HoverCardDemoPlacement() {
	return (
		<HoverCard>
			<HoverCardTrigger render={<a aria-label="Open hover card" href="#" />}>
				@vercel
			</HoverCardTrigger>
			<HoverCardContent side="right">
				<div className="grid gap-1">
					<h4 className="text-sm font-semibold">Vercel</h4>
					<p className="text-text-subtle text-xs">@vercel</p>
					<p className="text-sm">
						Develop. Preview. Ship. Creators of Next.js.
					</p>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}

export function HoverCardDemoSides() {
	const HOVER_CARD_SIDES = ["top", "right", "bottom", "left"] as const;

	return (
		<div className="flex flex-wrap items-center justify-center gap-2">
			{HOVER_CARD_SIDES.map((side) => (
				<HoverCard key={side}>
					<HoverCardTrigger render={<Button variant="outline" className="capitalize" />}>
						{side}
					</HoverCardTrigger>
					<HoverCardContent side={side}>
						<div className="grid gap-1">
							<h4 className="font-medium text-sm">Hover Card</h4>
							<p className="text-text-subtle text-sm">
								This hover card appears on the {side} side of the trigger.
							</p>
						</div>
					</HoverCardContent>
				</HoverCard>
			))}
		</div>
	);
}

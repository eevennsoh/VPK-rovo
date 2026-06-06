"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import TagIcon from "@atlaskit/icon/core/tag";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { AtlassianLogo, RovoColorIcon } from "@/components/ui/logo";
import { Tag, TagGroup } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

function LogoSlot({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
	return (
		<span
			className={cn(
				"inline-flex size-4 shrink-0 items-center justify-center align-middle leading-none",
				"[&_span]:!inline-flex [&_span]:!size-4 [&_span]:!items-center [&_span]:!justify-center [&_span]:!leading-none",
				"[&_svg]:!block [&_svg]:!size-4",
				className,
			)}
		>
			{children}
		</span>
	);
}

function PublicLogoMark({ src }: Readonly<{ src: string }>) {
	return (
		<LogoSlot>
			<Image src={src} alt="" aria-hidden width={16} height={16} className="block size-4 object-contain" />
		</LogoSlot>
	);
}

function ProductLogoMark({ children }: Readonly<{ children: ReactNode }>) {
	return <LogoSlot>{children}</LogoSlot>;
}

export default function TagDemo() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag>Default</Tag>
			<Tag color="blue">Blue</Tag>
			<Tag variant="rounded" color="discovery">
				Rounded
			</Tag>
			<Tag elemBefore={<Icon render={<TagIcon label="" size="small" />} aria-hidden className="size-3 [&_svg]:size-3" />}>
				Label
			</Tag>
			<Tag
				type="user"
				elemBefore={
					<Avatar size="xs">
						<AvatarImage src="/avatar-user/ali/color/asow-teamwork-blue.png" alt="Alex" />
						<AvatarFallback>AL</AvatarFallback>
					</Avatar>
				}
			>
				Alex
			</Tag>
		</div>
	);
}

export function TagDemoDefault() {
	return <Tag>Default tag</Tag>;
}

export function TagDemoRemovable() {
	const [visible, setVisible] = useState(true);
	if (!visible) return <p className="text-sm text-text-subtle">Tag removed</p>;
	return <Tag onRemove={() => setVisible(false)}>Removable</Tag>;
}

export function TagDemoFrontSlot() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag
				color="blue"
				elemBefore={
					<ProductLogoMark>
						<AtlassianLogo name="jira" label="" size="xxsmall" />
					</ProductLogoMark>
				}
			>
				Jira
			</Tag>
			<Tag
				color="purple"
				elemBefore={
					<ProductLogoMark>
						<AtlassianLogo name="confluence" label="" size="xxsmall" />
					</ProductLogoMark>
				}
			>
				Confluence
			</Tag>
			<Tag
				color="green"
				elemBefore={
					<LogoSlot>
						<RovoColorIcon width={16} height={16} className="block size-4" />
					</LogoSlot>
				}
			>
				Rovo
			</Tag>
			<Tag color="orange" elemBefore={<PublicLogoMark src="/2p/appfire.png" />}>
				Appfire
			</Tag>
			<Tag color="teal" elemBefore={<PublicLogoMark src="/2p/adaptavist.png" />}>
				Adaptavist
			</Tag>
			<Tag color="purple" elemBefore={<PublicLogoMark src="/3p/figma/16.svg" />}>
				Figma
			</Tag>
			<Tag color="green" elemBefore={<PublicLogoMark src="/3p/google-drive/16.svg" />}>
				Drive
			</Tag>
		</div>
	);
}

export function TagDemoRemovableOverlay() {
	const [tags, setTags] = useState(["Design", "Engineering", "Product marketing strategy"]);
	if (tags.length === 0) return <p className="text-sm text-text-subtle">All tags removed</p>;
	return (
		<div className="flex flex-wrap items-center gap-2">
			{tags.map((label) => (
				<Tag key={label} removeVariant="overlay" maxWidth={140} onRemove={() => setTags((prev) => prev.filter((t) => t !== label))}>
					{label}
				</Tag>
			))}
		</div>
	);
}

export function TagDemoVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag color="standard">Standard</Tag>
			<Tag color="blue">Blue</Tag>
			<Tag color="green">Green</Tag>
			<Tag color="red">Red</Tag>
			<Tag color="yellow">Yellow</Tag>
			<Tag color="discovery">Discovery</Tag>
			<Tag color="purple">Purple</Tag>
			<Tag color="teal">Teal</Tag>
			<Tag color="orange">Orange</Tag>
			<Tag color="magenta">Magenta</Tag>
			<Tag color="lime">Lime</Tag>
		</div>
	);
}

export function TagDemoRemovableVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag onRemove={() => {}}>Default</Tag>
			<Tag color="green" onRemove={() => {}}>
				Green
			</Tag>
			<Tag color="red" onRemove={() => {}}>
				Red
			</Tag>
			<Tag color="blue" onRemove={() => {}}>
				Blue
			</Tag>
			<Tag color="discovery" onRemove={() => {}}>
				Discovery
			</Tag>
		</div>
	);
}

export function TagDemoDisabled() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag disabled>Disabled</Tag>
			<Tag disabled color="blue">
				Disabled blue
			</Tag>
			<Tag disabled onRemove={() => {}}>
				Disabled removable
			</Tag>
		</div>
	);
}

export function TagDemoColors() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag color="standard">Standard</Tag>
			<Tag color="gray">Gray</Tag>
			<Tag color="green">Green</Tag>
			<Tag color="lime">Lime</Tag>
			<Tag color="blue">Blue</Tag>
			<Tag color="red">Red</Tag>
			<Tag color="discovery">Discovery</Tag>
			<Tag color="purple">Purple</Tag>
			<Tag color="magenta">Magenta</Tag>
			<Tag color="teal">Teal</Tag>
			<Tag color="orange">Orange</Tag>
			<Tag color="yellow">Yellow</Tag>
		</div>
	);
}

export function TagDemoRounded() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag variant="rounded">Rounded</Tag>
			<Tag variant="rounded" color="green">
				Rounded green
			</Tag>
			<Tag variant="rounded" onRemove={() => {}}>
				Rounded removable
			</Tag>
		</div>
	);
}

export function TagDemoTagGroup() {
	return (
		<TagGroup>
			<Tag>React</Tag>
			<Tag>TypeScript</Tag>
			<Tag>Next.js</Tag>
		</TagGroup>
	);
}

export function TagDemoTagGroupRemovable() {
	return (
		<TagGroup>
			<Tag onRemove={() => {}}>Frontend</Tag>
			<Tag onRemove={() => {}}>Backend</Tag>
			<Tag onRemove={() => {}}>DevOps</Tag>
		</TagGroup>
	);
}

export function TagDemoTagGroupVariants() {
	return (
		<TagGroup>
			<Tag>Default</Tag>
			<Tag variant="success">Success</Tag>
			<Tag variant="removed">Removed</Tag>
			<Tag variant="inprogress">In Progress</Tag>
		</TagGroup>
	);
}

export function TagDemoAvatarTags() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag
				type="user"
				onRemove={() => {}}
				elemBefore={
					<Avatar size="xs">
						<AvatarImage src="/avatar-user/olivia-yang/color/asow-service-yellow.png" alt="Mia Chen" />
						<AvatarFallback>MC</AvatarFallback>
					</Avatar>
				}
			>
				Mia Chen
			</Tag>
			<Tag
				type="other"
				isVerified
				elemBefore={
					<Avatar size="xs" shape="square">
						<AvatarImage src="/avatar-project/group.svg" alt="Atlas team" />
						<AvatarFallback>AT</AvatarFallback>
					</Avatar>
				}
			>
				Atlas team
			</Tag>
			<Tag
				type="agent"
				onRemove={() => {}}
				elemBefore={
					<Avatar size="xs" shape="hexagon">
						<AvatarImage src="/avatar-agent/dev-agents/code-planner.svg" alt="Plan agent" />
						<AvatarFallback>AI</AvatarFallback>
					</Avatar>
				}
			>
				Plan agent
			</Tag>
		</div>
	);
}

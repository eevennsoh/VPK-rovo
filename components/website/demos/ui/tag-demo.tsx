"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tag, TagGroup } from "@/components/ui/tag";

export default function TagDemo() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Tag>Default</Tag>
			<Tag color="blue">Blue</Tag>
			<Tag variant="rounded" color="discovery">
				Rounded
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

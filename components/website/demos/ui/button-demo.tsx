"use client";

import AddIcon from "@atlaskit/icon/core/add";
import EditIcon from "@atlaskit/icon/core/edit";
import SearchIcon from "@atlaskit/icon/core/search";
import { ArrowLeftCircleIcon, ArrowRightIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";

export default function ButtonDemo() {
	return (
		<div className="flex items-center gap-2">
			<Button>Primary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
		</div>
	);
}

export function ButtonDemoDefault() {
	return <Button>Default</Button>;
}

export function ButtonDemoDestructive() {
	return <Button variant="destructive">Destructive</Button>;
}

export function ButtonDemoDisabled() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button disabled>Default</Button>
			<Button variant="secondary" disabled>Secondary</Button>
			<Button variant="outline" disabled>Outline</Button>
			<Button variant="ghost" disabled>Ghost</Button>
			<Button variant="destructive" disabled>Destructive</Button>
			<Button variant="link" disabled>Link</Button>
		</div>
	);
}

export function ButtonDemoFullWidth() {
	return (
		<div className="flex w-full max-w-sm flex-col gap-2">
			<Button className="w-full">Full width default</Button>
			<Button variant="outline" className="w-full">Full width outline</Button>
			<Button variant="secondary" className="w-full">Full width secondary</Button>
		</div>
	);
}

export function ButtonDemoGhost() {
	return <Button variant="ghost">Ghost</Button>;
}

export function ButtonDemoIconLeft() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="compact">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Default
				</Button>
				<Button size="compact" variant="secondary">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Secondary
				</Button>
				<Button size="compact" variant="outline">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Outline
				</Button>
				<Button size="compact" variant="ghost">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Ghost
				</Button>
				<Button size="compact" variant="destructive">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Destructive
				</Button>
				<Button size="compact" variant="link">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button>
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Default
				</Button>
				<Button variant="secondary">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Secondary
				</Button>
				<Button variant="outline">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Outline
				</Button>
				<Button variant="ghost">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Ghost
				</Button>
				<Button variant="destructive">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Destructive
				</Button>
				<Button variant="link">
					<ArrowLeftCircleIcon data-icon="inline-start" />{" "}
					Link
				</Button>
			</div>
		</>
	);
}

export function ButtonDemoIconOnly() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center gap-2">
				<Button size="icon-compact">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-compact" variant="secondary">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-compact" variant="outline">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-compact" variant="ghost">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-compact" variant="destructive">
					<ArrowRightIcon />
				</Button>
				<Button size="icon-compact" variant="link">
					<ArrowRightIcon />
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="icon">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="secondary">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="outline">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="ghost">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="destructive">
					<ArrowRightIcon />
				</Button>
				<Button size="icon" variant="link">
					<ArrowRightIcon />
				</Button>
			</div>
		</div>
	);
}

export function ButtonDemoIconRight() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="compact">
					Default{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="compact" variant="secondary">
					Secondary{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="compact" variant="outline">
					Outline{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="compact" variant="ghost">
					Ghost{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="compact" variant="destructive">
					Destructive{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button size="compact" variant="link">
					Link{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button>
					Default{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="secondary">
					Secondary{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="outline">
					Outline{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="ghost">
					Ghost{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="destructive">
					Destructive{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
				<Button variant="link">
					Link{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
		</>
	);
}

export function ButtonDemoInvalidStates() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="compact" aria-invalid="true">
					Default
				</Button>
				<Button size="compact" variant="secondary" aria-invalid="true">
					Secondary
				</Button>
				<Button size="compact" variant="outline" aria-invalid="true">
					Outline
				</Button>
				<Button size="compact" variant="ghost" aria-invalid="true">
					Ghost
				</Button>
				<Button size="compact" variant="destructive" aria-invalid="true">
					Destructive
				</Button>
				<Button size="compact" variant="link" aria-invalid="true">
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button aria-invalid="true">Default</Button>
				<Button variant="secondary" aria-invalid="true">
					Secondary
				</Button>
				<Button variant="outline" aria-invalid="true">
					Outline
				</Button>
				<Button variant="ghost" aria-invalid="true">
					Ghost
				</Button>
				<Button variant="destructive" aria-invalid="true">
					Destructive
				</Button>
				<Button variant="link" aria-invalid="true">
					Link
				</Button>
			</div>
		</>
	);
}

export function ButtonDemoLink() {
	return <Button variant="link">Link</Button>;
}

export function ButtonDemoLoading() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button isLoading>Loading</Button>
			<Button variant="outline" isLoading>
				Loading
			</Button>
			<Button variant="secondary" isLoading>
				Loading
			</Button>
			<Button variant="warning" isLoading>
				Loading
			</Button>
			<Button variant="discovery" isLoading>
				Loading
			</Button>
		</div>
	);
}

export function ButtonDemoOutline() {
	return <Button variant="outline">Outline</Button>;
}

export function ButtonDemoSecondary() {
	return <Button variant="secondary">Secondary</Button>;
}

export function ButtonDemoSelected() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button aria-pressed="true">Default</Button>
			<Button variant="outline" aria-pressed="true">
				Outline
			</Button>
			<Button variant="ghost" aria-pressed="true">
				Ghost
			</Button>
			<Button variant="warning" aria-pressed="true">
				Warning
			</Button>
			<Button variant="discovery" aria-pressed="true">
				Discovery
			</Button>
		</div>
	);
}

export function ButtonDemoSizes() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<Button size="compact">Compact</Button>
				<Button size="default">Default</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="icon-compact" variant="outline">
					<AddIcon label="Add" />
				</Button>
				<Button size="icon" variant="outline">
					<AddIcon label="Add" />
				</Button>
			</div>
		</div>
	);
}

export function ButtonDemoUsage() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<div className="flex items-center gap-2">
				<Button variant="outline">Cancel</Button>
				<Button>
					Submit{" "}
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="destructive">Delete</Button>
				<Button size="icon">
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</div>
			<Button render={<a href="#" />} nativeButton={false}>
				Link
			</Button>
		</div>
	);
}

export function ButtonDemoVariantsAndSizes() {
	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button size="compact">Default</Button>
				<Button size="compact" variant="secondary">
					Secondary
				</Button>
				<Button size="compact" variant="outline">
					Outline
				</Button>
				<Button size="compact" variant="ghost">
					Ghost
				</Button>
				<Button size="compact" variant="destructive">
					Destructive
				</Button>
				<Button size="compact" variant="link">
					Link
				</Button>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button>Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="link">Link</Button>
			</div>
		</>
	);
}

export function ButtonDemoVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button variant="default">Default</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="warning">Warning</Button>
			<Button variant="discovery">Discovery</Button>
			<Button variant="link">Link</Button>
		</div>
	);
}

export function ButtonDemoWithIcon() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button>
				<AddIcon label="" data-icon="inline-start" />
				Add item
			</Button>
			<Button variant="outline">
				Edit
				<EditIcon label="" data-icon="inline-end" />
			</Button>
			<Button size="icon" variant="ghost">
				<SearchIcon label="Search" />
			</Button>
		</div>
	);
}

"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

export default function PopoverDemo() {
	return (
		<Popover>
			<PopoverTrigger render={<Button variant="outline" size="default" />}>
				Open popover
			</PopoverTrigger>
			<PopoverContent>
				<PopoverHeader>
					<PopoverTitle>Popover title</PopoverTitle>
					<PopoverDescription>This is a popover description.</PopoverDescription>
				</PopoverHeader>
			</PopoverContent>
		</Popover>
	);
}

export function PopoverDemoAlignments() {
	return (
		<div className="flex gap-6">
			<Popover>
				<PopoverTrigger render={<Button variant="outline" size="default" />}>
					Start
				</PopoverTrigger>
				<PopoverContent align="start" className="w-40">
					Aligned to start
				</PopoverContent>
			</Popover>
			<Popover>
				<PopoverTrigger render={<Button variant="outline" size="default" />}>
					Center
				</PopoverTrigger>
				<PopoverContent align="center" className="w-40">
					Aligned to center
				</PopoverContent>
			</Popover>
			<Popover>
				<PopoverTrigger render={<Button variant="outline" size="default" />}>
					End
				</PopoverTrigger>
				<PopoverContent align="end" className="w-40">
					Aligned to end
				</PopoverContent>
			</Popover>
		</div>
	);
}

export function PopoverDemoBasic() {
	return (
		<Popover>
			<PopoverTrigger render={<Button variant="outline" className="w-fit" />}>
				Open Popover
			</PopoverTrigger>
			<PopoverContent align="start">
				<PopoverHeader>
					<PopoverTitle>Dimensions</PopoverTitle>
					<PopoverDescription>
						Set the dimensions for the layer.
					</PopoverDescription>
				</PopoverHeader>
			</PopoverContent>
		</Popover>
	);
}

export function PopoverDemoDefault() {
	return (
		<Popover>
			<PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
			<PopoverContent>
				<div className="grid gap-2">
					<h4 className="font-medium leading-none">Dimensions</h4>
					<p className="text-muted-foreground text-sm">
						Set the dimensions for the layer.
					</p>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function PopoverDemoInDialog() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Open Dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Popover Demo</DialogTitle>
					<DialogDescription>
						Click the button below to see the popover.
					</DialogDescription>
				</DialogHeader>
				<Popover>
					<PopoverTrigger
						render={<Button variant="outline" className="w-fit" />}
					>
						Open Popover
					</PopoverTrigger>
					<PopoverContent align="start">
						<PopoverHeader>
							<PopoverTitle>Popover in Dialog</PopoverTitle>
							<PopoverDescription>
								This popover appears inside a dialog. Click the button to open
								it.
							</PopoverDescription>
						</PopoverHeader>
					</PopoverContent>
				</Popover>
			</DialogContent>
		</Dialog>
	);
}

export function PopoverDemoPlacement() {
	return (
		<Popover>
			<PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
			<PopoverContent side="top">
				<div className="grid gap-2">
					<h4 className="font-medium leading-none">Top placement</h4>
					<p className="text-muted-foreground text-sm">
						This popover appears above the trigger.
					</p>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function PopoverDemoSides() {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap gap-2">
				{(["inline-start", "left", "top"] as const).map((side) => (
					<Popover key={side}>
						<PopoverTrigger
							render={
								<Button variant="outline" className="w-fit capitalize" />
							}
						>
							{side.replace("-", " ")}
						</PopoverTrigger>
						<PopoverContent side={side} className="w-40">
							<p>Popover on {side.replace("-", " ")}</p>
						</PopoverContent>
					</Popover>
				))}
			</div>
			<div className="flex flex-wrap gap-2">
				{(["bottom", "right", "inline-end"] as const).map((side) => (
					<Popover key={side}>
						<PopoverTrigger
							render={
								<Button variant="outline" className="w-fit capitalize" />
							}
						>
							{side.replace("-", " ")}
						</PopoverTrigger>
						<PopoverContent side={side} className="w-40">
							<p>Popover on {side.replace("-", " ")}</p>
						</PopoverContent>
					</Popover>
				))}
			</div>
		</div>
	);
}

export function PopoverDemoWithForm() {
	return (
		<Popover>
			<PopoverTrigger render={<Button variant="outline" />}>
				Open Popover
			</PopoverTrigger>
			<PopoverContent className="w-64" align="start">
				<PopoverHeader>
					<PopoverTitle>Dimensions</PopoverTitle>
					<PopoverDescription>
						Set the dimensions for the layer.
					</PopoverDescription>
				</PopoverHeader>
				<FieldGroup className="gap-4">
					<Field orientation="horizontal">
						<FieldLabel htmlFor="width" className="w-1/2">
							Width
						</FieldLabel>
						<Input id="width" defaultValue="100%" />
					</Field>
					<Field orientation="horizontal">
						<FieldLabel htmlFor="height" className="w-1/2">
							Height
						</FieldLabel>
						<Input id="height" defaultValue="25px" />
					</Field>
				</FieldGroup>
			</PopoverContent>
		</Popover>
	);
}

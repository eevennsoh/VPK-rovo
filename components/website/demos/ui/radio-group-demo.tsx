"use client";

import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const radioOptionClassName = "flex h-6 items-center gap-2";
const radioDescriptionFieldClassName = "items-center! gap-2 [&>[role=radio]]:mt-0!";
const radioDescriptionControlClassName = "flex size-6 shrink-0 items-center justify-center";

export default function RadioGroupDemo() {
	return (
		<RadioGroup defaultValue="option-1">
			<div className={radioOptionClassName}>
				<RadioGroupItem value="option-1" id="r1" />
				<Label htmlFor="r1">Default</Label>
			</div>
			<div className={radioOptionClassName}>
				<RadioGroupItem value="option-2" id="r2" />
				<Label htmlFor="r2">Comfortable</Label>
			</div>
			<div className={radioOptionClassName}>
				<RadioGroupItem value="option-3" id="r3" />
				<Label htmlFor="r3">Compact</Label>
			</div>
		</RadioGroup>
	);
}

export function RadioGroupDemoBasic() {
	return (
		<RadioGroup defaultValue="comfortable">
			<Field orientation="horizontal">
				<RadioGroupItem value="default" id="r1" />
				<FieldLabel htmlFor="r1" className="font-normal">
					Default
				</FieldLabel>
			</Field>
			<Field orientation="horizontal">
				<RadioGroupItem value="comfortable" id="r2" />
				<FieldLabel htmlFor="r2" className="font-normal">
					Comfortable
				</FieldLabel>
			</Field>
			<Field orientation="horizontal">
				<RadioGroupItem value="compact" id="r3" />
				<FieldLabel htmlFor="r3" className="font-normal">
					Compact
				</FieldLabel>
			</Field>
		</RadioGroup>
	);
}

export function RadioGroupDemoDefault() {
	return (
		<RadioGroup defaultValue="default">
			<div className={radioOptionClassName}>
				<RadioGroupItem value="default" id="r1" />
				<Label htmlFor="r1">Default</Label>
			</div>
			<div className={radioOptionClassName}>
				<RadioGroupItem value="comfortable" id="r2" />
				<Label htmlFor="r2">Comfortable</Label>
			</div>
			<div className={radioOptionClassName}>
				<RadioGroupItem value="compact" id="r3" />
				<Label htmlFor="r3">Compact</Label>
			</div>
		</RadioGroup>
	);
}

export function RadioGroupDemoDisabled() {
	return (
		<RadioGroup defaultValue="option2" disabled>
			<Field orientation="horizontal">
				<RadioGroupItem value="option1" id="disabled-1" />
				<FieldLabel htmlFor="disabled-1" className="font-normal">
					Option 1
				</FieldLabel>
			</Field>
			<Field orientation="horizontal">
				<RadioGroupItem value="option2" id="disabled-2" />
				<FieldLabel htmlFor="disabled-2" className="font-normal">
					Option 2
				</FieldLabel>
			</Field>
			<Field orientation="horizontal">
				<RadioGroupItem value="option3" id="disabled-3" />
				<FieldLabel htmlFor="disabled-3" className="font-normal">
					Option 3
				</FieldLabel>
			</Field>
		</RadioGroup>
	);
}

export function RadioGroupDemoGridLayout() {
	return (
		<RadioGroup defaultValue="medium" className="grid grid-cols-2 gap-2">
			<FieldLabel htmlFor="size-small">
				<Field orientation="horizontal">
					<RadioGroupItem value="small" id="size-small" />
					<div className="font-medium">Small</div>
				</Field>
			</FieldLabel>
			<FieldLabel htmlFor="size-medium">
				<Field orientation="horizontal">
					<RadioGroupItem value="medium" id="size-medium" />
					<div className="font-medium">Medium</div>
				</Field>
			</FieldLabel>
			<FieldLabel htmlFor="size-large">
				<Field orientation="horizontal">
					<RadioGroupItem value="large" id="size-large" />
					<div className="font-medium">Large</div>
				</Field>
			</FieldLabel>
			<FieldLabel htmlFor="size-xlarge">
				<Field orientation="horizontal">
					<RadioGroupItem value="xlarge" id="size-xlarge" />
					<div className="font-medium">X-Large</div>
				</Field>
			</FieldLabel>
		</RadioGroup>
	);
}

export function RadioGroupDemoHorizontal() {
	return (
		<RadioGroup defaultValue="default" className="flex flex-row gap-4">
			<div className={radioOptionClassName}>
				<RadioGroupItem value="default" id="h1" />
				<Label htmlFor="h1">Default</Label>
			</div>
			<div className={radioOptionClassName}>
				<RadioGroupItem value="comfortable" id="h2" />
				<Label htmlFor="h2">Comfortable</Label>
			</div>
			<div className={radioOptionClassName}>
				<RadioGroupItem value="compact" id="h3" />
				<Label htmlFor="h3">Compact</Label>
			</div>
		</RadioGroup>
	);
}

export function RadioGroupDemoInvalid() {
	return (
		<FieldSet>
			<FieldLegend>Notification Preferences</FieldLegend>
			<FieldDescription>
				Choose how you want to receive notifications.
			</FieldDescription>
			<RadioGroup defaultValue="email">
				<Field orientation="horizontal" data-invalid>
					<RadioGroupItem value="email" id="invalid-email" aria-invalid />
					<FieldLabel htmlFor="invalid-email" className="font-normal">
						Email only
					</FieldLabel>
				</Field>
				<Field orientation="horizontal" data-invalid>
					<RadioGroupItem value="sms" id="invalid-sms" aria-invalid />
					<FieldLabel htmlFor="invalid-sms" className="font-normal">
						SMS only
					</FieldLabel>
				</Field>
				<Field orientation="horizontal" data-invalid>
					<RadioGroupItem value="both" id="invalid-both" aria-invalid />
					<FieldLabel htmlFor="invalid-both" className="font-normal">
						Both Email & SMS
					</FieldLabel>
				</Field>
			</RadioGroup>
		</FieldSet>
	);
}

export function RadioGroupDemoWithDescriptions() {
	return (
		<RadioGroup defaultValue="plus" className="gap-2">
			<FieldLabel htmlFor="plus-plan">
				<Field orientation="horizontal" className={radioDescriptionFieldClassName}>
					<FieldContent>
						<div className="font-medium">Plus</div>
					<FieldDescription>
							For individuals and small teams
						</FieldDescription>
					</FieldContent>
					<span className={radioDescriptionControlClassName}>
						<RadioGroupItem value="plus" id="plus-plan" />
					</span>
				</Field>
			</FieldLabel>
			<FieldLabel htmlFor="pro-plan">
				<Field orientation="horizontal" className={radioDescriptionFieldClassName}>
					<FieldContent>
						<div className="font-medium">Pro</div>
						<FieldDescription>For growing businesses</FieldDescription>
					</FieldContent>
					<span className={radioDescriptionControlClassName}>
						<RadioGroupItem value="pro" id="pro-plan" />
					</span>
				</Field>
			</FieldLabel>
			<FieldLabel htmlFor="enterprise-plan">
				<Field orientation="horizontal" className={radioDescriptionFieldClassName}>
					<FieldContent>
						<div className="font-medium">Enterprise</div>
						<FieldDescription>
							For large teams and enterprises
						</FieldDescription>
					</FieldContent>
					<span className={radioDescriptionControlClassName}>
						<RadioGroupItem value="enterprise" id="enterprise-plan" />
					</span>
				</Field>
			</FieldLabel>
		</RadioGroup>
	);
}

export function RadioGroupDemoWithFieldset() {
	return (
		<FieldSet>
			<FieldLegend>Battery Level</FieldLegend>
			<FieldDescription>
				Choose your preferred battery level.
			</FieldDescription>
			<RadioGroup defaultValue="medium">
				<Field orientation="horizontal">
					<RadioGroupItem value="high" id="battery-high" />
					<FieldLabel htmlFor="battery-high" className="font-normal">
						High
					</FieldLabel>
				</Field>
				<Field orientation="horizontal">
					<RadioGroupItem value="medium" id="battery-medium" />
					<FieldLabel htmlFor="battery-medium" className="font-normal">
						Medium
					</FieldLabel>
				</Field>
				<Field orientation="horizontal">
					<RadioGroupItem value="low" id="battery-low" />
					<FieldLabel htmlFor="battery-low" className="font-normal">
						Low
					</FieldLabel>
				</Field>
			</RadioGroup>
		</FieldSet>
	);
}

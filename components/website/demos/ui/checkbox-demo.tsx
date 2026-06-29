"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const checkboxTitleFieldClassName = "items-center! gap-2";
const checkboxTitleControlClassName = "flex size-6 shrink-0 items-center justify-center";

export default function CheckboxDemo() {
	const [checked, setChecked] = useState(true);

	return (
		<div className="flex items-center gap-2">
			<Checkbox id="demo-cb" checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
			<Label htmlFor="demo-cb">Accept terms</Label>
		</div>
	);
}

export function CheckboxDemoBasic() {
	return (
		<Field orientation="horizontal">
			<Checkbox id="terms" />
			<FieldLabel htmlFor="terms">Accept terms and conditions</FieldLabel>
		</Field>
	);
}

export function CheckboxDemoChecked() {
	return (
		<div className="flex items-center gap-2">
			<Checkbox id="checked" defaultChecked />
			<Label htmlFor="checked">Checked by default</Label>
		</div>
	);
}

export function CheckboxDemoDefault() {
	return (
		<div className="flex items-center gap-2">
			<Checkbox id="terms" />
			<Label htmlFor="terms">Accept terms and conditions</Label>
		</div>
	);
}

export function CheckboxDemoDisabledFull() {
	return (
		<Field orientation="horizontal">
			<Checkbox id="toggle" disabled />
			<FieldLabel htmlFor="toggle">Enable notifications</FieldLabel>
		</Field>
	);
}

export function CheckboxDemoDisabled() {
	return (
		<div className="flex items-center gap-2">
			<Checkbox id="disabled" disabled />
			<Label htmlFor="disabled">Disabled checkbox</Label>
		</div>
	);
}

export function CheckboxDemoGroup() {
	return (
		<Field>
			<FieldLabel>Show these items on the desktop:</FieldLabel>
			<FieldGroup data-slot="checkbox-group" className="!gap-0">
				<Field orientation="horizontal">
					<Checkbox id="finder-pref-9k2-hard-disks-ljj" />
					<FieldLabel
						htmlFor="finder-pref-9k2-hard-disks-ljj"
						className="font-normal"
					>
						Hard disks
					</FieldLabel>
				</Field>
				<Field orientation="horizontal">
					<Checkbox id="finder-pref-9k2-external-disks-1yg" />
					<FieldLabel
						htmlFor="finder-pref-9k2-external-disks-1yg"
						className="font-normal"
					>
						External disks
					</FieldLabel>
				</Field>
				<Field orientation="horizontal">
					<Checkbox id="finder-pref-9k2-cds-dvds-fzt" />
					<FieldLabel
						htmlFor="finder-pref-9k2-cds-dvds-fzt"
						className="font-normal"
					>
						CDs, DVDs, and iPods
					</FieldLabel>
				</Field>
				<Field orientation="horizontal">
					<Checkbox id="finder-pref-9k2-connected-servers-6l2" />
					<FieldLabel
						htmlFor="finder-pref-9k2-connected-servers-6l2"
						className="font-normal"
					>
						Connected servers
					</FieldLabel>
				</Field>
			</FieldGroup>
		</Field>
	);
}

export function CheckboxDemoInTable() {
	const tableData = [
		{ id: "1", name: "Sarah Chen", email: "sarah.chen@acme.com", role: "Admin" },
		{ id: "2", name: "Marc Rodriguez", email: "marcus.rodriguez@acme.com", role: "User" },
		{ id: "3", name: "Emily Watson", email: "emily.watson@acme.com", role: "User" },
	];

	const [selectedRows, setSelectedRows] = useState<Set<string>>(
		new Set(["1"])
	);

	const selectAll = selectedRows.size === tableData.length;

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedRows(new Set(tableData.map((row) => row.id)));
		} else {
			setSelectedRows(new Set());
		}
	};

	const handleSelectRow = (id: string, checked: boolean) => {
		const newSelected = new Set(selectedRows);
		if (checked) {
			newSelected.add(id);
		} else {
			newSelected.delete(id);
		}
		setSelectedRows(newSelected);
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-8">
						<Checkbox
							id="select-all"
							checked={selectAll}
							onCheckedChange={handleSelectAll}
						/>
					</TableHead>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{tableData.map((row) => (
					<TableRow
						key={row.id}
						data-state={selectedRows.has(row.id) ? "selected" : undefined}
					>
						<TableCell>
							<Checkbox
								id={`row-${row.id}`}
								checked={selectedRows.has(row.id)}
								onCheckedChange={(checked) =>
									handleSelectRow(row.id, checked === true)
								}
							/>
						</TableCell>
						<TableCell className="font-medium">{row.name}</TableCell>
						<TableCell>{row.email}</TableCell>
						<TableCell>{row.role}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export function CheckboxDemoInvalid() {
	return (
		<Field orientation="horizontal" data-invalid>
			<Checkbox id="terms-3" aria-invalid />
			<FieldLabel htmlFor="terms-3">Accept terms and conditions</FieldLabel>
		</Field>
	);
}

export function CheckboxDemoWithDescriptionFull() {
	return (
		<Field orientation="horizontal">
			<Checkbox id="terms-2" defaultChecked />
			<FieldContent>
				<FieldLabel htmlFor="terms-2">Accept terms and conditions</FieldLabel>
				<FieldDescription>
					By clicking this checkbox, you agree to the terms and conditions.
				</FieldDescription>
			</FieldContent>
		</Field>
	);
}

export function CheckboxDemoWithDescription() {
	return (
		<Field orientation="horizontal">
			<Checkbox id="notifications" />
			<FieldContent>
				<FieldLabel htmlFor="notifications" className="leading-6">Enable notifications</FieldLabel>
				<FieldDescription>
					Receive email notifications when updates are available.
				</FieldDescription>
			</FieldContent>
		</Field>
	);
}

export function CheckboxDemoWithTitle() {
	return (
		<FieldGroup className="gap-2">
			<FieldLabel htmlFor="toggle-2">
				<Field orientation="horizontal" className={checkboxTitleFieldClassName}>
					<FieldContent>
						<FieldTitle>Enable notifications</FieldTitle>
						<FieldDescription>
							You can enable or disable notifications at any time.
						</FieldDescription>
					</FieldContent>
					<span className={checkboxTitleControlClassName}>
						<Checkbox id="toggle-2" defaultChecked />
					</span>
				</Field>
			</FieldLabel>
			<FieldLabel htmlFor="toggle-4">
				<Field orientation="horizontal" data-disabled className={checkboxTitleFieldClassName}>
					<FieldContent>
						<FieldTitle>Enable notifications</FieldTitle>
						<FieldDescription>
							You can enable or disable notifications at any time.
						</FieldDescription>
					</FieldContent>
					<span className={checkboxTitleControlClassName}>
						<Checkbox id="toggle-4" disabled />
					</span>
				</Field>
			</FieldLabel>
		</FieldGroup>
	);
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import AddIcon from "@atlaskit/icon/core/add";
import type { Assignee, ColumnId, Priority, TaskLabel } from "@/lib/sprint-board-types";

const AVAILABLE_LABELS: TaskLabel[] = [
	{ text: "Frontend", color: "blue" },
	{ text: "Backend", color: "green" },
	{ text: "Design", color: "purple" },
	{ text: "Bug", color: "red" },
	{ text: "UX", color: "purple" },
	{ text: "DevOps", color: "teal" },
	{ text: "Security", color: "red" },
	{ text: "Mobile", color: "orange" },
	{ text: "Testing", color: "yellow" },
	{ text: "Analytics", color: "teal" },
];

interface CreateTaskDialogProps {
	assignees: Assignee[];
	defaultColumnId?: ColumnId;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onCreateTask: (task: {
		title: string;
		description?: string;
		assigneeId: string;
		priority: Priority;
		storyPoints?: number;
		labels: TaskLabel[];
		columnId: ColumnId;
	}) => void;
}

export function CreateTaskDialog({
	assignees,
	defaultColumnId = "todo",
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	onCreateTask,
}: CreateTaskDialogProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : internalOpen;
	const setOpen = useMemo(
		() => (isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen),
		[isControlled, controlledOnOpenChange],
	);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [assigneeId, setAssigneeId] = useState(assignees[0]?.id ?? "");
	const [priority, setPriority] = useState<Priority>("medium");
	const [storyPoints, setStoryPoints] = useState("");
	const [columnId, setColumnId] = useState<ColumnId>(defaultColumnId);
	const [selectedLabels, setSelectedLabels] = useState<TaskLabel[]>([]);

	const resetForm = useCallback(() => {
		setTitle("");
		setDescription("");
		setAssigneeId(assignees[0]?.id ?? "");
		setPriority("medium");
		setStoryPoints("");
		setColumnId(defaultColumnId);
		setSelectedLabels([]);
	}, [assignees, defaultColumnId]);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!title.trim()) return;

			const points = parseInt(storyPoints, 10);

			onCreateTask({
				title: title.trim(),
				description: description.trim() || undefined,
				assigneeId,
				priority,
				storyPoints: isNaN(points) || points < 0 ? undefined : points,
				labels: selectedLabels,
				columnId,
			});

			resetForm();
			setOpen(false);
		},
		[title, description, assigneeId, priority, storyPoints, selectedLabels, columnId, onCreateTask, resetForm, setOpen],
	);

	const toggleLabel = useCallback((label: TaskLabel) => {
		setSelectedLabels((prev) => {
			const exists = prev.some((l) => l.text === label.text);
			if (exists) {
				return prev.filter((l) => l.text !== label.text);
			}
			return [...prev, label];
		});
	}, []);

	return (
		<Dialog open={open} onOpenChange={(next) => {
			setOpen(next);
			if (!next) resetForm();
		}}>
			{!isControlled ? (
				<DialogTrigger
					id="sprint-board-create-task-trigger"
					render={<Button variant="default" size="default" className="gap-1.5" />}
				>
					<AddIcon label="" size="small" />
					Add Task
				</DialogTrigger>
			) : null}
			<DialogContent className="sm:max-w-[480px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create Task</DialogTitle>
						<DialogDescription>
							Add a new task to the sprint board.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 flex flex-col gap-4">
						{/* Title */}
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="task-title">Title</Label>
							<Input
								id="task-title"
								placeholder="Enter task title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								autoFocus
								required
							/>
						</div>

						{/* Description */}
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="task-description">Description</Label>
							<Textarea
								id="task-description"
								placeholder="Optional task description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={2}
							/>
						</div>

						{/* Row: Assignee + Priority */}
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<Label>Assignee</Label>
								<Select value={assigneeId} onValueChange={(v) => { if (v) setAssigneeId(v); }}>
									<SelectTrigger>
										<SelectValue placeholder="Select assignee" />
									</SelectTrigger>
									<SelectContent>
										{assignees.map((a) => (
											<SelectItem key={a.id} value={a.id}>
												{a.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label>Priority</Label>
								<Select value={priority} onValueChange={(v) => { if (v) setPriority(v as Priority); }}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="low">Low</SelectItem>
										<SelectItem value="medium">Medium</SelectItem>
										<SelectItem value="high">High</SelectItem>
										<SelectItem value="critical">Critical</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Row: Story Points + Column */}
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="task-points">Story Points</Label>
								<Input
									id="task-points"
									type="number"
									min={0}
									max={100}
									placeholder="e.g. 5"
									value={storyPoints}
									onChange={(e) => setStoryPoints(e.target.value)}
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label>Column</Label>
								<Select value={columnId} onValueChange={(v) => { if (v) setColumnId(v as ColumnId); }}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="todo">To Do</SelectItem>
										<SelectItem value="in-progress">In Progress</SelectItem>
										<SelectItem value="done">Done</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Labels */}
						<div className="flex flex-col gap-1.5">
							<Label>Labels</Label>
							<div className="flex flex-wrap gap-1.5">
								{AVAILABLE_LABELS.map((label) => {
									const isSelected = selectedLabels.some((l) => l.text === label.text);
									return (
										<button
											key={label.text}
											type="button"
											onClick={() => toggleLabel(label)}
											className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
												isSelected
													? "border-border-brand bg-surface-selected text-text"
													: "border-border-subtle bg-surface text-text-subtle hover:bg-bg-neutral-hovered"
											}`}
										>
											{label.text}
										</button>
									);
								})}
							</div>
						</div>
					</div>

					<DialogFooter className="mt-6">
						<Button type="button" variant="ghost" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={!title.trim()}>
							Create Task
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

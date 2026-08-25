import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";

export default function JiraKanbanExperimentalPreviewPage() {
	// A definite viewport height here is what lets the Pulse shell size itself
	// from its container instead of guessing the chrome above it. Without it the
	// document ends up a couple of dozen pixels taller than the viewport and the
	// page scroll fights the story column for the wheel.
	return (
		<div className="h-dvh">
			<ExperimentalJiraKanbanPage />
		</div>
	);
}

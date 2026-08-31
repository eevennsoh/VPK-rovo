import type {
	PointerDragBounds,
	PointerDragPosition,
} from "@/components/ui-custom/hooks/use-pointer-drag";

import type { JiraIssueAgentActivity } from "@/components/blocks/jira-issue/agent-activity";

// Kept out of `agent-activity.tsx` on purpose: that file exports components, and
// a non-component value export there defeats Fast Refresh state preservation
// (react-doctor/only-export-components).

/**
 * Live state of an in-progress chin-row session drag. Published to the
 * transfer region so it can reveal drop zones and hit-test the pointer.
 * `pointer` is in client coordinates and is `null` once the drag ends.
 */
export interface JiraIssueAgentSessionDragState {
	activities: readonly JiraIssueAgentActivity[];
	/**
	 * The gesture was aborted (`pointercancel`) rather than released. Consumers
	 * must clear any armed drop target WITHOUT committing it: an interrupted
	 * pointer is not a drop, and treating it as one silently unlinks or moves a
	 * session the user never dropped.
	 */
	cancelled: boolean;
	dragging: boolean;
	pointer: PointerDragPosition | null;
}

/**
 * Opt-in binding that turns each chin row into a draggable session handle.
 * Supplying it is what mounts the gooey wrapper and the pointer-drag bind;
 * without it the rows render exactly as before.
 */
export interface JiraIssueAgentSessionDragBinding {
	/** Clamp for the row translate, in px relative to its resting position. */
	bounds?: PointerDragBounds;
	onDragStateChange: (state: JiraIssueAgentSessionDragState) => void;
	/** Retains the row keyboard focus came from while focus moves to the drop zone. */
	onFocusedActivitiesChange: (activities: readonly JiraIssueAgentActivity[]) => void;
}

export const JIRA_ISSUE_AGENT_SESSION_DRAG_IDLE: JiraIssueAgentSessionDragState = {
	activities: [],
	cancelled: false,
	dragging: false,
	pointer: null,
};

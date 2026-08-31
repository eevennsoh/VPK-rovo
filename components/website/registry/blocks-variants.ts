import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const BLOCK_VARIANT_DEMO_ENTRIES: Record<string, ComponentType> = {
	"agent-list-demo-compact": dynamic(
		() =>
			import("../demos/blocks/agent-list-demo").then((mod) => ({
				default: mod.AgentListDemoCompact,
			})),
		{ ssr: false },
	),
	"agent-list-demo-composer": dynamic(
		() =>
			import("../demos/blocks/agent-list-demo").then((mod) => ({
				default: mod.AgentListDemoComposer,
			})),
		{ ssr: false },
	),
	"omnibar-demo-expanded": dynamic(
		() =>
			import("../demos/blocks/omnibar-demo").then((mod) => ({
				default: mod.OmnibarDemoExpanded,
			})),
		{ ssr: false },
	),
	"omnibar-demo-docked": dynamic(
		() =>
			import("../demos/blocks/omnibar-demo").then((mod) => ({
				default: mod.OmnibarDemoDocked,
			})),
		{ ssr: false },
	),
	"scrubber-demo-timeline": dynamic(
		() =>
			import("../demos/blocks/scrubber-demo").then((mod) => ({
				default: mod.ScrubberDemoTimeline,
			})),
		{ ssr: false },
	),
	"agent-session-flyout-demo-composer": dynamic(
		() =>
			import("../demos/blocks/agent-session-flyout-demo").then((mod) => ({
				default: mod.AgentSessionFlyoutDemoComposer,
			})),
		{ ssr: false },
	),
	"agent-session-flyout-demo-untracked-work": dynamic(
		() =>
			import("../demos/blocks/agent-session-flyout-demo").then((mod) => ({
				default: mod.AgentSessionFlyoutDemoUntrackedWork,
			})),
		{ ssr: false },
	),
	"agent-session-demo-multi-link": dynamic(
		() =>
			import("../demos/blocks/agent-session-demo").then((mod) => ({
				default: mod.AgentSessionDemoMultiLink,
			})),
		{ ssr: false },
	),
	"agent-session-demo-medium": dynamic(
		() =>
			import("../demos/blocks/agent-session-demo").then((mod) => ({
				default: mod.AgentSessionDemoMedium,
			})),
		{ ssr: false },
	),
	"agent-session-demo-small": dynamic(
		() =>
			import("../demos/blocks/agent-session-demo").then((mod) => ({
				default: mod.AgentSessionDemoSmall,
			})),
		{ ssr: false },
	),
	"jira-kanban-demo-standard": dynamic(
		() =>
			import("../demos/blocks/jira-kanban-demo").then((mod) => ({
				default: mod.JiraKanbanDemoStandard,
			})),
		{ ssr: false },
	),
	"jira-kanban-demo-experimental": dynamic(
		() =>
			import("../demos/blocks/jira-kanban-demo").then((mod) => ({
				default: mod.JiraKanbanDemoExperimental,
			})),
		{ ssr: false },
	),
	"jira-kanban-demo-experimental-v2": dynamic(
		() =>
			import("../demos/blocks/jira-kanban-demo").then((mod) => ({
				default: mod.JiraKanbanDemoExperimentalV2,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-standard": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoStandard,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimental,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-empty": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalEmpty,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-running": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalRunning,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v2": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV2,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v2-empty": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV2Empty,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v2-running": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV2Running,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v3": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV3,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v4": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV4,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v5": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV5,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v3-empty": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV3Empty,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v4-empty": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV4Empty,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v5-empty": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV5Empty,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v3-running": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV3Running,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v4-running": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV4Running,
			})),
		{ ssr: false },
	),
	"jira-work-item-demo-experimental-v5-running": dynamic(
		() =>
			import("../demos/blocks/jira-work-item-demo").then((mod) => ({
				default: mod.JiraWorkItemDemoExperimentalV5Running,
			})),
		{ ssr: false },
	),
	"agent-evaluation-demo-filled": dynamic(
		() =>
			import("../demos/blocks/agent-evaluation-demo").then((mod) => ({
				default: mod.AgentEvaluationDemoFilled,
			})),
		{ ssr: false },
	),
	"agent-test-demo-chat-only": dynamic(
		() =>
			import("../demos/blocks/agent-test-demo").then((mod) => ({
				default: mod.AgentTestDemoChatOnly,
			})),
		{ ssr: false },
	),
	"agent-profile-card-chat": dynamic(
		() =>
			import("../demos/blocks/agent-profile-card-demo").then((mod) => ({
				default: mod.AgentProfileCardChatExample,
			})),
		{ ssr: false },
	),
	"agent-profile-card-preview": dynamic(
		() =>
			import("../demos/blocks/agent-profile-card-demo").then((mod) => ({
				default: mod.AgentProfileCardPreviewExample,
			})),
		{ ssr: false },
	),
	"artifact-demo-code-preview": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoCodePreview,
			})),
		{ ssr: false },
	),
	"artifact-demo-image-preview": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoImagePreview,
			})),
		{ ssr: false },
	),
	"artifact-demo-streaming": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoStreaming,
			})),
		{ ssr: false },
	),
	"artifact-demo-chip": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoChip,
			})),
		{ ssr: false },
	),
	"artifact-demo-compound": dynamic(
		() =>
			import("../demos/blocks/artifact-demo").then((mod) => ({
				default: mod.ArtifactDemoCompound,
			})),
		{ ssr: false },
	),

	// Spotlight
	"spotlight-basic": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightBasicExample,
			})),
		{ ssr: false },
	),
	"spotlight-media": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightMediaExample,
			})),
		{ ssr: false },
	),
	"spotlight-tour": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightTourExample,
			})),
		{ ssr: false },
	),
	"spotlight-target": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightTargetExample,
			})),
		{ ssr: false },
	),
	"spotlight-placements": dynamic(
		() =>
			import("../demos/blocks/spotlight-demo").then((mod) => ({
				default: mod.SpotlightPlacementsExample,
			})),
		{ ssr: false },
	),

	// Editor palette
	"editor-palette-nested": dynamic(
		() =>
			import("../demos/blocks/editor-palette-demo").then((mod) => ({
				default: mod.EditorPaletteNested,
			})),
		{ ssr: false },
	),
	"editor-palette-flat": dynamic(
		() =>
			import("../demos/blocks/editor-palette-demo").then((mod) => ({
				default: mod.EditorPaletteFlat,
			})),
		{ ssr: false },
	),
	"editor-palette-search": dynamic(
		() =>
			import("../demos/blocks/editor-palette-demo").then((mod) => ({
				default: mod.EditorPaletteSearch,
			})),
		{ ssr: false },
	),

	// Agent
	"agent-demo-full": dynamic(
		() =>
			import("../demos/blocks/agent-demo").then((mod) => ({
				default: mod.AgentDemoFull,
			})),
		{ ssr: false },
	),
	"agent-demo-empty": dynamic(
		() =>
			import("../demos/blocks/agent-demo").then((mod) => ({
				default: mod.AgentDemoEmpty,
			})),
		{ ssr: false },
	),

	// Skill Config
	"skill-config-demo-full": dynamic(
		() =>
			import("../demos/blocks/skill-config-demo").then((mod) => ({
				default: mod.SkillConfigDemoFull,
			})),
		{ ssr: false },
	),
	"skill-config-demo-empty": dynamic(
		() =>
			import("../demos/blocks/skill-config-demo").then((mod) => ({
				default: mod.SkillConfigDemoEmpty,
			})),
		{ ssr: false },
	),

	// Trigger Config
	"trigger-config-demo-full": dynamic(
		() =>
			import("../demos/blocks/trigger-config-demo").then((mod) => ({
				default: mod.TriggerConfigDemoFull,
			})),
		{ ssr: false },
	),
	"trigger-config-demo-empty": dynamic(
		() =>
			import("../demos/blocks/trigger-config-demo").then((mod) => ({
				default: mod.TriggerConfigDemoEmpty,
			})),
		{ ssr: false },
	),

	// Agent Directory
	"agent-directory-demo-standard": dynamic(
		() =>
			import("../demos/blocks/agent-directory-demo").then((mod) => ({
				default: mod.AgentsDirectoryDemoStandard,
			})),
		{ ssr: false },
	),
	"agent-directory-demo-experimental": dynamic(
		() =>
			import("../demos/blocks/agent-directory-demo").then((mod) => ({
				default: mod.AgentsDirectoryDemoExperimental,
			})),
		{ ssr: false },
	),

	// Agent Card
	"agent-card-demo-expanded": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoExpanded,
			})),
		{ ssr: false },
	),
	"agent-card-demo-experimental": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoExperimental,
			})),
		{ ssr: false },
	),
	"agent-card-demo-experimental-template": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoExperimentalTemplate,
			})),
		{ ssr: false },
	),
	"agent-card-demo-experimental-profile": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoExperimentalProfile,
			})),
		{ ssr: false },
	),
	"agent-card-demo-simple": dynamic(
		() =>
			import("../demos/blocks/agent-card-demo").then((mod) => ({
				default: mod.AgentCardDemoSimple,
			})),
		{ ssr: false },
	),

	// Subagents
	"subagents-demo-empty": dynamic(
		() =>
			import("../demos/blocks/subagents-demo").then((mod) => ({
				default: mod.SubagentsDemoEmpty,
			})),
		{ ssr: false },
	),

	// Smart Link
	"smart-link-demo-rich": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoRich,
			})),
		{ ssr: false },
	),
	"smart-link-demo-article": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoArticle,
			})),
		{ ssr: false },
	),
	"smart-link-demo-team": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoTeam,
			})),
		{ ssr: false },
	),
	"smart-link-demo-goal": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoGoal,
			})),
		{ ssr: false },
	),
	"smart-link-demo-project": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoProject,
			})),
		{ ssr: false },
	),
	"smart-link-demo-loom": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoLoom,
			})),
		{ ssr: false },
	),
	"smart-link-demo-generic": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoGeneric,
			})),
		{ ssr: false },
	),
	"smart-link-demo-pull-request": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoPullRequest,
			})),
		{ ssr: false },
	),
	"smart-link-demo-card": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoCard,
			})),
		{ ssr: false },
	),
	"smart-link-demo-status": dynamic(() => import("../demos/blocks/smart-link-demo").then((mod) => ({ default: mod.SmartLinkDemoStatus })), { ssr: false }),
	"smart-link-demo-sizes": dynamic(() => import("../demos/blocks/smart-link-demo").then((mod) => ({ default: mod.SmartLinkDemoSizes })), { ssr: false }),
	"smart-link-demo-removable-overlay": dynamic(
		() =>
			import("../demos/blocks/smart-link-demo").then((mod) => ({
				default: mod.SmartLinkDemoRemovableOverlay,
			})),
		{ ssr: false },
	),

	// Emoji Picker
	"emoji-picker-demo-reaction-bar": dynamic(
		() =>
			import("../demos/blocks/emoji-picker-demo").then((mod) => ({
				default: mod.EmojiPickerDemoReactionBar,
			})),
		{ ssr: false },
	),
	"emoji-picker-demo-popover": dynamic(
		() =>
			import("../demos/blocks/emoji-picker-demo").then((mod) => ({
				default: mod.EmojiPickerDemoPopover,
			})),
		{ ssr: false },
	),
	"emoji-picker-demo-full-picker": dynamic(
		() =>
			import("../demos/blocks/emoji-picker-demo").then((mod) => ({
				default: mod.EmojiPickerDemoFullPicker,
			})),
		{ ssr: false },
	),
	"emoji-picker-demo-pills": dynamic(
		() =>
			import("../demos/blocks/emoji-picker-demo").then((mod) => ({
				default: mod.EmojiPickerDemoPills,
			})),
		{ ssr: false },
	),

	// Agent Selector
	"agent-selector-demo-standalone": dynamic(
		() =>
			import("../demos/blocks/agent-selector-demo").then((mod) => ({
				default: mod.AgentSelectorDemoStandalone,
			})),
		{ ssr: false },
	),
	"agent-selector-demo-selected-agent-actions": dynamic(
		() =>
			import("../demos/blocks/agent-selector-demo").then((mod) => ({
				default: mod.AgentSelectorDemoSelectedAgentActions,
			})),
		{ ssr: false },
	),
	"agent-selector-demo-jira": dynamic(
		() =>
			import("../demos/blocks/agent-selector-demo").then((mod) => ({
				default: mod.AgentSelectorDemoJira,
			})),
		{ ssr: false },
	),
	"skill-selector-demo-standalone": dynamic(
		() =>
			import("../demos/blocks/skill-selector-demo").then((mod) => ({
				default: mod.SkillSelectorDemoStandalone,
			})),
		{ ssr: false },
	),

	"jira-issue-demo-experimental": dynamic(() => import("../demos/blocks/jira-issue-demo").then((mod) => ({
		default: mod.JiraIssueDemoExperimental,
	})), { ssr: false }),
	"jira-issue-demo-uncaptured-work": dynamic(() => import("../demos/blocks/jira-issue-demo").then((mod) => ({
		default: mod.JiraIssueDemoUncapturedWork,
	})), { ssr: false }),
	"jira-issue-demo-subtasks-collapsed": dynamic(() => import("../demos/blocks/jira-issue-demo").then((mod) => ({
		default: mod.JiraIssueDemoSubtasksCollapsed,
	})), { ssr: false }),
	"jira-issue-demo-subtasks-expanded": dynamic(() => import("../demos/blocks/jira-issue-demo").then((mod) => ({
		default: mod.JiraIssueDemoSubtasksExpanded,
	})), { ssr: false }),
	"jira-issue-demo-parent-epic": dynamic(() => import("../demos/blocks/jira-issue-demo").then((mod) => ({
		default: mod.JiraIssueDemoParentEpic,
	})), { ssr: false }),
	"jira-issue-demo-agent-activity-states": dynamic(() => import("../demos/blocks/jira-issue-demo").then((mod) => ({
		default: mod.JiraIssueDemoAgentActivityStates,
	})), { ssr: false }),
	"jira-issue-demo-agent-activity-states-experimental": dynamic(() => import("../demos/blocks/jira-issue-demo").then((mod) => ({
		default: mod.JiraIssueDemoAgentActivityStatesExperimental,
	})), { ssr: false }),
	"jira-activity-demo-activity-card": dynamic(
		() =>
			import("../demos/blocks/jira-activity-demo").then((mod) => ({
				default: mod.JiraActivityCardDemo,
			})),
		{ ssr: false },
	),
	"jira-activity-demo-reactions": dynamic(
		() =>
			import("../demos/blocks/jira-activity-demo").then((mod) => ({
				default: mod.JiraActivityReactionsDemo,
			})),
		{ ssr: false },
	),

	// Agent Progress
	"agent-progress-demo-running": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoRunning,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-completed": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoCompleted,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-failed": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoFailed,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-collapsed": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoCollapsed,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-collapsed-running": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoCollapsedRunning,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-with-agents": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoWithAgents,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-early-progress": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoEarlyProgress,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-multiple-runs": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoMultipleRuns,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-all-states": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoAllStates,
			})),
		{ ssr: false },
	),
	"agent-progress-demo-elapsed-time": dynamic(
		() =>
			import("../demos/blocks/agent-progress-demo").then((mod) => ({
				default: mod.AgentProgressDemoElapsedTime,
			})),
		{ ssr: false },
	),

	// Task Progress
	"task-progress-demo-running": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoRunning,
			})),
		{ ssr: false },
	),
	"task-progress-demo-completed": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoCompleted,
			})),
		{ ssr: false },
	),
	"task-progress-demo-failed": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoFailed,
			})),
		{ ssr: false },
	),
	"task-progress-demo-collapsed": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoCollapsed,
			})),
		{ ssr: false },
	),
	"task-progress-demo-collapsed-running": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoCollapsedRunning,
			})),
		{ ssr: false },
	),
	"task-progress-demo-with-agents": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoWithAgents,
			})),
		{ ssr: false },
	),
	"task-progress-demo-early-progress": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoEarlyProgress,
			})),
		{ ssr: false },
	),
	"task-progress-demo-multiple-runs": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoMultipleRuns,
			})),
		{ ssr: false },
	),
	"task-progress-demo-all-states": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoAllStates,
			})),
		{ ssr: false },
	),
	"task-progress-demo-elapsed-time": dynamic(
		() =>
			import("../demos/blocks/task-progress-demo").then((mod) => ({
				default: mod.TaskProgressDemoElapsedTime,
			})),
		{ ssr: false },
	),

	// Triggers
	"triggers-demo-configured": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoConfigured,
			})),
		{ ssr: false },
	),
	"triggers-demo-empty": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoEmpty,
			})),
		{ ssr: false },
	),
	"triggers-demo-picker": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoPicker,
			})),
		{ ssr: false },
	),
	"triggers-demo-multiple": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoMultiple,
			})),
		{ ssr: false },
	),
	"triggers-demo-needs-connection": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoNeedsConnection,
			})),
		{ ssr: false },
	),
	"triggers-demo-manage": dynamic(
		() =>
			import("../demos/blocks/triggers-demo").then((mod) => ({
				default: mod.TriggersDemoManage,
			})),
		{ ssr: false },
	),

	// Question Card
	"question-card-demo-single-select": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoSingleSelect,
			})),
		{ ssr: false },
	),
	"question-card-demo-multi-select": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoMultiSelect,
			})),
		{ ssr: false },
	),
	"question-card-demo-multi-step-multi-select": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoMultiStepMultiSelect,
			})),
		{ ssr: false },
	),
	"question-card-demo-text-only": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoTextOnly,
			})),
		{ ssr: false },
	),
	"question-card-demo-mixed": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoMixed,
			})),
		{ ssr: false },
	),
	"question-card-demo-no-custom-input": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoNoCustomInput,
			})),
		{ ssr: false },
	),
	"question-card-demo-custom-placeholder": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoCustomPlaceholder,
			})),
		{ ssr: false },
	),
	"question-card-demo-pre-populated": dynamic(
		() =>
			import("../demos/blocks/question-card-demo").then((mod) => ({
				default: mod.QuestionCardDemoPrePopulated,
			})),
		{ ssr: false },
	),
	"tool-approval-demo-batch": dynamic(
		() =>
			import("../demos/blocks/tool-approval-demo").then((mod) => ({
				default: mod.ToolApprovalDemoBatch,
			})),
		{ ssr: false },
	),
	"tool-approval-demo-submitting": dynamic(
		() =>
			import("../demos/blocks/tool-approval-demo").then((mod) => ({
				default: mod.ToolApprovalDemoSubmitting,
			})),
		{ ssr: false },
	),
	"generative-card-demo-3p": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemo3p,
			})),
		{ ssr: false },
	),
	"generative-card-demo-1p": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemo1p,
			})),
		{ ssr: false },
	),
	"generative-card-demo-icon": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoIcon,
			})),
		{ ssr: false },
	),
	"generative-card-demo-artifact": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoArtifact,
			})),
		{ ssr: false },
	),
	"generative-card-demo-artifact-collapsed": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoArtifactCollapsed,
			})),
		{ ssr: false },
	),
	"generative-card-demo-animated": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoAnimatedExample,
			})),
		{ ssr: false },
	),
	"generative-card-demo-action": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoAction,
			})),
		{ ssr: false },
	),
	"generative-card-demo-trace": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoTrace,
			})),
		{ ssr: false },
	),
	"generative-card-demo-inner-glow": dynamic(
		() =>
			import("../demos/blocks/generative-card-demo").then((mod) => ({
				default: mod.GenerativeCardDemoInnerGlow,
			})),
		{ ssr: false },
	),
};

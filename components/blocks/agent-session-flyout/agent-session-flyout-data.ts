import type { JiraSidebarSessionItem } from "@/components/blocks/product-sidebar/variants/jira";
import {
	ASX_QUEUE_SESSION_SEEDS,
	createAsxQueueSidebarSessionItem,
} from "@/components/projects/jira-queue/data/queue-sessions";

export const AGENT_SESSION_FLYOUT_SESSIONS: readonly JiraSidebarSessionItem[] =
	ASX_QUEUE_SESSION_SEEDS.map(createAsxQueueSidebarSessionItem);

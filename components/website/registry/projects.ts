import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const PROJECT_DEMOS: Record<string, ComponentType> = {
	admin: dynamic(() => import("../demos/projects/admin-demo"), { ssr: false }),
	asx: dynamic(() => import("../demos/projects/asx-demo"), { ssr: false }),
	confluence: dynamic(() => import("../demos/projects/confluence-demo"), {
		ssr: false,
	}),
	html: dynamic(() => import("../demos/projects/html-demo"), { ssr: false }),
	jira: dynamic(() => import("../demos/projects/jira-demo"), { ssr: false }),
	"jira-golden-paths": dynamic(
		() => import("../demos/projects/jira-golden-paths-demo"),
		{ ssr: false },
	),
	"jira-queue": dynamic(() => import("../demos/projects/jira-queue-demo"), {
		ssr: false,
	}),
	rovo: dynamic(() => import("../demos/projects/rovo-demo"), {
		ssr: false,
	}),
	"rovo-button": dynamic(() => import("../demos/projects/rovo-button-demo"), {
		ssr: false,
	}),
	search: dynamic(() => import("../demos/projects/search-demo"), { ssr: false }),
	"sidebar-chat": dynamic(() => import("../demos/projects/sidebar-chat-demo"), {
		ssr: false,
	}),
	skills: dynamic(() => import("../demos/projects/skills-demo"), {
		ssr: false,
	}),
	studio: dynamic(() => import("../demos/projects/studio-demo"), {
		ssr: false,
	}),
};

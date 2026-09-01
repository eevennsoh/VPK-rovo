"use client";

import Page from "@/components/blocks/omnibar/page";

export default function OmnibarDemo() {
	return <Page />;
}

export function OmnibarDemoExpanded() {
	return <Page defaultState="expanded" />;
}

export function OmnibarDemoDocked() {
	return <Page defaultState="docked" />;
}

export function OmnibarDemoTimeline() {
	return <Page defaultState="expanded" timeline="x" />;
}

export function OmnibarDemoTimelineVertical() {
	return <Page defaultState="expanded" timeline="y" />;
}

"use client";

import InformationIcon from "@atlaskit/icon/core/information";

import { Icon } from "@/components/ui/icon";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";

export default function MarkerDemo() {
	return <MarkerDemoDefault />;
}

export function MarkerDemoDefault() {
	return (
		<Marker className="max-w-md">
			<MarkerIcon>
				<Icon render={<InformationIcon label="" size="small" />} label="" />
			</MarkerIcon>
			<MarkerContent>New messages since 9:41 AM</MarkerContent>
		</Marker>
	);
}

export function MarkerDemoVariants() {
	return (
		<div className="flex w-full max-w-md flex-col gap-4">
			<Marker>
				<MarkerContent>Default marker</MarkerContent>
			</Marker>
			<Marker variant="border">
				<MarkerContent>Border marker</MarkerContent>
			</Marker>
			<Marker variant="separator">
				<MarkerContent>Today</MarkerContent>
			</Marker>
		</div>
	);
}

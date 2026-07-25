"use client";

import type { ReactNode } from "react";

import {
	RovoAppSurfaceShellCore,
	type RovoAppSurfaceShellFactoryOptions,
} from "./rovo-app-surface-shell";

export function createRovoAppSurfaceShell(options: Readonly<RovoAppSurfaceShellFactoryOptions>) {
	return function RovoAppSurfaceShell({ children }: Readonly<{ children: ReactNode }>) {
		return (
			<RovoAppSurfaceShellCore
				buildThreadPath={options.buildThreadPath}
				rootPath={options.rootPath}
				product={options.product}
				SidebarComponent={options.SidebarComponent}
				useThreadList={options.useThreadList}
			>
				{children}
			</RovoAppSurfaceShellCore>
		);
	};
}

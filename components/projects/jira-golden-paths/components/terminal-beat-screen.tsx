"use client";

import { useMemo } from "react";

import { createStaticTerminalController } from "../hooks/use-terminal-demo";
import { TerminalStage } from "./terminal-stage";

// A single Local session screen that embeds the Terminal demo frozen at one beat.
// The controller is a static, non-interactive snapshot (see
// `createStaticTerminalController`) — the session card's own left/right controls
// move between beats, so the terminal itself never steps or captures keys.
export function TerminalBeatScreen({ beat }: Readonly<{ beat: number }>): React.ReactElement {
	const controller = useMemo(() => createStaticTerminalController(beat), [beat]);
	return <TerminalStage controller={controller} />;
}

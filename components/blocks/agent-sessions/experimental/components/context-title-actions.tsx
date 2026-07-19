"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import LockUnlockedIcon from "@atlaskit/icon/core/lock-unlocked";
import ShareIcon from "@atlaskit/icon/core/share";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

/**
 * Coding-agent brands shown behind the "Open" split button. The first entry is
 * the primary agent whose logo sits in front of the "Open" label; the full list
 * populates the trailing chevron's dropdown menu. Each id maps to a registered
 * `LogoThirdParty` brand (Claude/Cursor/OpenAI ship with the upstream package;
 * Gemini/Copilot are local `public/3p` fallback assets).
 */
const CODING_AGENTS: ReadonlyArray<{ name: ThirdPartyLogoName; label: string }> = [
	{ name: "claude", label: "Claude" },
	{ name: "openai", label: "OpenAI" },
	{ name: "cursor", label: "Cursor" },
	{ name: "github-copilot", label: "GitHub Copilot" },
	{ name: "google-gemini", label: "Gemini" },
];

const PRIMARY_CODING_AGENT = CODING_AGENTS[0];

/**
 * Title-row action cluster for the experimental Agent Sessions work item:
 * lock / watch / share / Open split button / more. Visual-only (no handlers) —
 * mirrors the standard ModalHeader action styling but sits beside the editable
 * title instead of in the breadcrumb row. The Open split button reuses the
 * shared ButtonGroup primitive so the main + trailing chevron read as one group;
 * its trailing chevron opens a dropdown listing the available coding agents.
 */
export function ContextTitleActions() {
	return (
		<div className="flex shrink-0 items-center gap-2">
			<Button aria-label="No restrictions" size="icon" variant="outline">
				<LockUnlockedIcon label="" />
			</Button>
			<Button className="gap-2" variant="outline">
				<EyeOpenIcon label="" />
				1
			</Button>
			<Button aria-label="Share" size="icon" variant="outline">
				<ShareIcon label="" />
			</Button>
			<ButtonGroup variant="split">
				<Button aria-label="Open" variant="outline" className="gap-0.5">
					<LogoThirdParty name={PRIMARY_CODING_AGENT.name} size="small" borderless />
					Open
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button aria-label="More open options" size="icon" variant="outline">
								<ChevronDownIcon label="" size="small" />
							</Button>
						}
					/>
					<DropdownMenuContent align="end" positionerClassName="z-[502]">
						{CODING_AGENTS.map((agent) => (
							<DropdownMenuItem
								className="gap-0.5"
								key={agent.name}
								elemBefore={<LogoThirdParty name={agent.name} size="small" borderless />}
							>
								{agent.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</ButtonGroup>
			<Button aria-label="Actions" size="icon" variant="outline">
				<ShowMoreHorizontalIcon label="" />
			</Button>
		</div>
	);
}

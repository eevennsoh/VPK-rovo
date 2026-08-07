"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useMemo, useState } from "react";

import AddIcon from "@atlaskit/icon/core/add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BitbucketLogo } from "@/components/ui/logo";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SearchIcon } from "@/components/ui/vpk-icons";
import {
	RichTextCommandMenuSearchField,
	useCommandMenuScrollMask,
} from "@/components/ui-custom/rich-text-editor";

interface RepositoryOption {
	id: string;
	name: string;
	provider: "bitbucket" | "github";
	url: string;
}

const REPOSITORIES: readonly RepositoryOption[] = [
	{ id: "symphony-explainer", name: "symphony-explainer", provider: "github", url: "https://github.com/eevensoh/symphony-explainer" },
	{ id: "proximity", name: "proximity", provider: "github", url: "https://github.com/eevensoh/proximity" },
	{ id: "vpk-rovo", name: "vpk-rovo", provider: "bitbucket", url: "https://bitbucket.org/eevensoh/vpk-rovo" },
	{ id: "vpk-rovodev", name: "vpk-rovodev", provider: "bitbucket", url: "https://bitbucket.org/eevensoh/vpk-rovodev" },
];

// Mirror AgentSelector / GreetingPromptRow: label lifts and byline reveals on
// hover/focus. Dynamic variants collapse the transition under reduced motion.
const repositoryLabelVariants: Variants = {
	idle: (instant: boolean) => ({
		transform: "translateY(8px)",
		transition: instant ? { duration: 0 } : { type: "spring", bounce: 0, visualDuration: 0.18 },
	}),
	active: (instant: boolean) => ({
		transform: "translateY(0px)",
		transition: instant ? { duration: 0 } : { type: "spring", bounce: 0.12, visualDuration: 0.24 },
	}),
};

const repositoryDescriptionVariants: Variants = {
	idle: (instant: boolean) => ({
		opacity: 0,
		transform: "translateY(4px)",
		transition: instant ? { duration: 0 } : { duration: 0.1, ease: [0.4, 0, 1, 1] },
	}),
	active: (instant: boolean) => ({
		opacity: 1,
		transform: "translateY(0px)",
		transition: instant ? { duration: 0 } : { delay: 0.02, duration: 0.16, ease: [0, 0.4, 0, 1] },
	}),
};

const REPOSITORY_COPY_CLASS =
	"flex min-h-[34px] min-w-0 flex-1 flex-col justify-start overflow-hidden text-left";
const REPOSITORY_LABEL_CLASS = "menu-row-title text-left";
const REPOSITORY_DESCRIPTION_CLASS = "menu-row-byline text-left";

function RepositoryProviderLogo({ provider }: Readonly<Pick<RepositoryOption, "provider">>) {
	return provider === "bitbucket" ? (
		<BitbucketLogo appearance="brand" label="" size="small" />
	) : (
		<GithubLogo borderless className="dark:invert [[data-color-mode=dark]_&]:invert" label="" size="small" />
	);
}

function RepositoryRow({
	name,
	onClick,
	provider,
	url,
}: Readonly<{
	name: string;
	onClick: () => void;
	provider: RepositoryOption["provider"];
	url: string;
}>) {
	// Mirror AgentSelector: drive Motion from explicit interaction state so the
	// byline reveal matches hover and keyboard focus deterministically.
	const [isInteractionActive, setIsInteractionActive] = useState(false);
	const prefersReducedMotion = useReducedMotion();
	const revealByline = isInteractionActive;
	const copyInstant = Boolean(prefersReducedMotion);

	return (
		<Button
			className="h-11 w-full justify-start gap-3 rounded-lg px-2 font-normal"
			onBlur={() => setIsInteractionActive(false)}
			onClick={onClick}
			onFocus={() => setIsInteractionActive(true)}
			onMouseEnter={() => setIsInteractionActive(true)}
			onMouseLeave={() => setIsInteractionActive(false)}
			type="button"
			variant="ghost"
		>
			<span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center leading-none [&_svg]:size-6!">
				<RepositoryProviderLogo provider={provider} />
			</span>
			<motion.span
				animate={revealByline ? "active" : "idle"}
				className={REPOSITORY_COPY_CLASS}
				custom={copyInstant}
				initial={false}
			>
				<motion.span
					className={REPOSITORY_LABEL_CLASS}
					custom={copyInstant}
					style={{ willChange: "transform" }}
					variants={repositoryLabelVariants}
				>
					{name}
				</motion.span>
				<motion.span
					className={REPOSITORY_DESCRIPTION_CLASS}
					custom={copyInstant}
					style={{ willChange: "transform, opacity" }}
					variants={repositoryDescriptionVariants}
				>
					{url}
				</motion.span>
			</motion.span>
		</Button>
	);
}

export function DevelopmentRepositoryPicker() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const { listProps, menuProps } = useCommandMenuScrollMask();
	const repositories = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return needle
			? REPOSITORIES.filter((repository) => `${repository.name} ${repository.url}`.toLowerCase().includes(needle))
			: REPOSITORIES;
	}, [query]);

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) setQuery("");
	}

	function selectRepository() {
		handleOpenChange(false);
	}

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger
				render={(
					<Button
						aria-expanded={open}
						className="w-full min-w-0 justify-start px-2 font-normal"
						type="button"
						variant="outline"
					/>
				)}
			>
				<span className="min-w-0 flex-1 truncate text-left">4 Connected repositories</span>
				<Icon aria-hidden className="shrink-0 text-icon-subtle" render={<ChevronDownIcon label="" size="small" />} />
			</PopoverTrigger>
			<PopoverContent
				aria-label="Select repository"
				align="start"
				className="w-(--anchor-width) max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
				positionerClassName="z-[502]"
			>
				<div className="rich-text-command-menu rich-text-command-menu-embedded" data-has-header="true" {...menuProps}>
					<RichTextCommandMenuSearchField
						autoFocus
						icon={<SearchIcon className="size-4 text-icon-subtle" />}
						label="Search repositories"
						onClear={() => setQuery("")}
						onEscape={() => setOpen(false)}
						onValueChange={setQuery}
						value={query}
					/>
					<div aria-labelledby="all-repositories-heading" className="rich-text-command-menu-list" role="region" {...listProps}>
						<h3 className="rich-text-command-menu-heading" id="all-repositories-heading">
							All repositories
						</h3>
						{repositories.map((repository) => (
							<RepositoryRow
								key={repository.id}
								name={repository.name}
								onClick={selectRepository}
								provider={repository.provider}
								url={repository.url}
							/>
						))}
						{repositories.length === 0 ? (
							<p className="px-2 py-4 text-center text-sm text-text-subtlest">No repositories found.</p>
						) : null}
					</div>
				</div>
				<Separator className="mx-2 my-1 data-horizontal:w-auto" />
				<div className="p-1">
					<Button className="h-8 w-full justify-start gap-3 rounded-lg px-2 font-normal" type="button" variant="ghost">
						<Icon aria-hidden className="size-6 shrink-0" render={<AddIcon label="" />} />
						Add repositories
					</Button>
					<Button className="h-8 w-full justify-start gap-3 rounded-lg px-2 font-normal" type="button" variant="ghost">
						<Icon aria-hidden className="size-6 shrink-0" render={<AddIcon label="" />} />
						Add environment
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

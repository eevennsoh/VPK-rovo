"use client";

import { Tag } from "@/components/ui/tag";
import { BrandLogoMark } from "@/components/ui/logo-mark";
import { type LogoProps } from "@/components/ui/logo";
import {
	LogoThirdParty,
	FigmaLogo,
	GithubLogo,
	SlackLogo,
	NotionLogo,
	ZoomLogo,
	SalesforceLogo,
	MiroLogo,
	AirtableLogo,
	THIRD_PARTY_LOGO_NAMES,
	THIRD_PARTY_LOGO_LABELS,
	type ThirdPartyLogoName,
} from "@/components/ui/logo-third-party";
import { thirdPartyLogoSrc } from "@/components/ui/data/logo-third-party-data";

/* ── Overview demo (default export) ──────────────────────────────── */

export default function LogoThirdPartyDemo() {
	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex flex-wrap gap-4">
				{THIRD_PARTY_LOGO_NAMES.map((name) => (
					<div
						key={name}
						className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
					>
						<LogoThirdParty name={name} size="small" />
						<span className="text-sm text-text">{THIRD_PARTY_LOGO_LABELS[name]}</span>
					</div>
				))}
			</div>
		</div>
	);
}

/* ── Demo: Icons (compact grid) ──────────────────────────────────── */

export function LogoThirdPartyDemoIcons() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			{THIRD_PARTY_LOGO_NAMES.map((name) => (
				<div key={name} className="flex flex-col items-center gap-1.5">
					<LogoThirdParty name={name} size="small" />
					<span className="text-xs text-text-subtle">{THIRD_PARTY_LOGO_LABELS[name]}</span>
				</div>
			))}
		</div>
	);
}

/* ── Demo: Sizes ─────────────────────────────────────────────────── */

const sizes: ReadonlyArray<NonNullable<LogoProps["size"]>> = [
	"xxsmall",
	"xsmall",
	"small",
	"medium",
	"large",
	"xlarge",
];

// One solid-fill mark (Figma) and one white-tile mark (Slack) so both border
// treatments are visible across the size scale.
const SIZE_SAMPLES: ReadonlyArray<{ name: ThirdPartyLogoName }> = [
	{ name: "figma" },
	{ name: "slack" },
];

export function LogoThirdPartyDemoSizes() {
	return (
		<div className="flex flex-col gap-4">
			{SIZE_SAMPLES.map((sample) => (
				<div key={sample.name} className="flex flex-wrap items-end gap-4">
					{sizes.map((size) => (
						<div key={size} className="flex flex-col items-center gap-1.5">
							<LogoThirdParty name={sample.name} size={size} />
							<span className="text-xs text-text-subtle">{size}</span>
						</div>
					))}
				</div>
			))}
		</div>
	);
}

/* ── Demo: Lockups (icon + wordmark) ─────────────────────────────── */

const lockupSamples: ReadonlyArray<ThirdPartyLogoName> = [
	"figma",
	"github",
	"slack",
	"notion",
	"zoom",
	"salesforce",
];

export function LogoThirdPartyDemoLockups() {
	return (
		<div className="flex flex-wrap items-center gap-6">
			{lockupSamples.map((name) => (
				<LogoThirdParty
					key={name}
					name={name}
					wordmark={THIRD_PARTY_LOGO_LABELS[name]}
					size="small"
				/>
			))}
		</div>
	);
}

/* ── Demo: In a Tile (picker / menu rows) ────────────────────────── */

const BRAND_TILE_SIZES = ["xsmall", "small", "medium", "large", "xlarge"] as const;

// GitHub = solid-fill (fills the tile), Slack = white-tile (borderless + tile).
const TILE_SAMPLES: ReadonlyArray<ThirdPartyLogoName> = ["github", "slack", "notion"];

export function LogoThirdPartyDemoInTile() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3">
				{TILE_SAMPLES.map((name) => (
					<div key={name} className="flex items-end gap-3">
						{BRAND_TILE_SIZES.map((size) => (
							<BrandLogoMark
								key={size}
								frame="tile"
								src={thirdPartyLogoSrc(name)}
								label={`${THIRD_PARTY_LOGO_LABELS[name]} ${size}`}
								size={size}
							/>
						))}
						<span className="self-center text-sm text-text">{THIRD_PARTY_LOGO_LABELS[name]}</span>
					</div>
				))}
			</div>
			<p className="text-xs text-text-subtle">
				Picker / suggestion-menu rows. Solid-fill marks fill the whole tile; white-tile marks swap to
				their borderless glyph inside a surface{" "}
				<code className="rounded bg-bg-neutral px-1 py-0.5">Tile</code> — driven by{" "}
				<code className="rounded bg-bg-neutral px-1 py-0.5">logo-usage.json</code>.
			</p>
		</div>
	);
}

/* ── Demo: In a Tag (inline chips) ───────────────────────────────── */

const TAG_SAMPLES: ReadonlyArray<ThirdPartyLogoName> = [
	"figma",
	"github",
	"slack",
	"notion",
	"zoom",
	"airtable",
];

export function LogoThirdPartyDemoInTag() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				{TAG_SAMPLES.map((name) => (
					<Tag
						key={name}
						elemBefore={
							<BrandLogoMark
								frame="chip"
								src={thirdPartyLogoSrc(name)}
								label={THIRD_PARTY_LOGO_LABELS[name]}
							/>
						}
					>
						{THIRD_PARTY_LOGO_LABELS[name]}
					</Tag>
				))}
			</div>
			<p className="text-xs text-text-subtle">
				Inline chips: every mark is normalized to a 16px box; white-tile marks render as a centered
				glyph, solid-fill marks fill the box.
			</p>
		</div>
	);
}

/* ── Demo: Named exports ─────────────────────────────────────────── */

export function LogoThirdPartyDemoNamedExports() {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<FigmaLogo size="small" />
			<GithubLogo size="small" />
			<SlackLogo size="small" />
			<NotionLogo size="small" />
			<ZoomLogo size="small" />
			<SalesforceLogo size="small" />
			<MiroLogo size="small" />
			<AirtableLogo size="small" />
		</div>
	);
}

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
import {
	thirdPartyLogoSrc,
	type LocalAssetThirdPartyLogoName,
} from "@/components/ui/data/logo-third-party-data";

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

// Each sample is shown in both treatments across the full size scale.
const SIZE_TREATMENTS: ReadonlyArray<{ label: string; borderless: boolean }> = [
	{ label: "Default (tile + border)", borderless: false },
	{ label: "Borderless (bare glyph)", borderless: true },
];

export function LogoThirdPartyDemoSizes() {
	return (
		<div className="flex flex-col gap-6">
			{SIZE_SAMPLES.map((sample) => (
				<div key={sample.name} className="flex flex-col gap-3">
					{SIZE_TREATMENTS.map((treatment) => (
						<div key={treatment.label} className="flex flex-col gap-2">
							<span className="text-xs font-semibold text-text-subtle">{treatment.label}</span>
							<div className="flex flex-wrap items-end gap-4">
								{sizes.map((size) => (
									<div key={size} className="flex flex-col items-center gap-1.5">
										<LogoThirdParty name={sample.name} size={size} borderless={treatment.borderless} />
										<span className="text-xs text-text-subtle">{size}</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			))}
		</div>
	);
}

/* ── Demo: Borderless ────────────────────────────────────────────── */

const borderlessSamples: ReadonlyArray<ThirdPartyLogoName> = [
	"figma",
	"slack",
	"notion",
	"github",
	"salesforce",
	"zoom",
];

export function LogoThirdPartyDemoBorderless() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<span className="text-xs font-semibold text-text-subtle">Default (tile + border)</span>
				<div className="flex flex-wrap items-center gap-4">
					{borderlessSamples.map((name) => (
						<LogoThirdParty key={name} name={name} size="large" />
					))}
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<span className="text-xs font-semibold text-text-subtle">Borderless (bare glyph)</span>
				<div className="flex flex-wrap items-center gap-4">
					{borderlessSamples.map((name) => (
						<LogoThirdParty key={name} name={name} size="large" borderless />
					))}
				</div>
			</div>
			<p className="text-xs text-text-subtle">
				The package draws every mark inside a white{" "}
				<code className="rounded bg-bg-neutral px-1 py-0.5">Tile</code> with a border. Pass{" "}
				<code className="rounded bg-bg-neutral px-1 py-0.5">borderless</code> to strip the tile
				background + border and render just the brand glyph — for placement on an existing surface,
				avatar, or row where the tile would double up.
			</p>
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

// GitHub / Slack / Notion are package-backed, so each renders inside the upstream
// `@atlassian/logo-third-party` tile (white background + hairline border). Adobe
// Sign ships its own solid-filled background, so it renders bare — no added border.
const TILE_SAMPLES: ReadonlyArray<LocalAssetThirdPartyLogoName> = ["github", "slack", "notion", "adobe-sign"];

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
				Picker / suggestion-menu rows. Most 3P marks render inside the upstream{" "}
				<code className="rounded bg-bg-neutral px-1 py-0.5">@atlassian/logo-third-party</code> tile — a
				white background with a hairline border — scaled to the tile size. Marks that ship their own
				solid-filled background (e.g. Adobe Sign) render bare, with no added border.
			</p>
		</div>
	);
}

/* ── Demo: In a Tag (inline chips) ───────────────────────────────── */

const TAG_SAMPLES: ReadonlyArray<LocalAssetThirdPartyLogoName> = [
	"figma",
	"github",
	"slack",
	"notion",
	"zoom",
	"airtable",
	// Solid-fill mark (own filled background) — fills the chip box bare.
	"adobe-sign",
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
				Inline chips: each mark renders as a bare 16px glyph (no tile or border) that fills the chip
				box, so it never doubles up borders with the surrounding Tag. Marks with their own
				solid-filled background (e.g. Adobe Sign) need no border either — they fill the box as-is.
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

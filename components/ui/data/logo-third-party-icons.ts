/**
 * Resolves VPK third-party brand ids to their `@atlassian/logo-third-party`
 * icon components.
 *
 * The package ships no root `exports` map, so static deep imports are still
 * required. Brand ids, labels, package entrypoints, package export names, and
 * local fallback ids live in `logo-third-party-data.ts`; this module only binds
 * the manifest-declared package entrypoints to their imported modules.
 */
import type { ComponentType } from "react";

import {
	THIRD_PARTY_LOGO_PACKAGE_ICON_ENTRIES,
	type ThirdPartyLogoName,
	type ThirdPartyLogoPackageEntry,
} from "@/components/ui/data/logo-third-party-data";

import * as adobe from "@atlassian/logo-third-party/dist/esm/entry-points/adobe";
import * as adobexd from "@atlassian/logo-third-party/dist/esm/entry-points/adobexd";
import * as aha from "@atlassian/logo-third-party/dist/esm/entry-points/aha";
import * as airtable from "@atlassian/logo-third-party/dist/esm/entry-points/airtable";
import * as amazon from "@atlassian/logo-third-party/dist/esm/entry-points/amazon";
import * as amazonWebServicesAws from "@atlassian/logo-third-party/dist/esm/entry-points/amazon-web-services-aws";
import * as amplitude from "@atlassian/logo-third-party/dist/esm/entry-points/amplitude";
import * as ansible from "@atlassian/logo-third-party/dist/esm/entry-points/ansible";
import * as asana from "@atlassian/logo-third-party/dist/esm/entry-points/asana";
import * as microsoftAzureDevops from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-azure-devops";
import * as box from "@atlassian/logo-third-party/dist/esm/entry-points/box";
import * as brightspot from "@atlassian/logo-third-party/dist/esm/entry-points/brightspot";
import * as canva from "@atlassian/logo-third-party/dist/esm/entry-points/canva";
import * as claude from "@atlassian/logo-third-party/dist/esm/entry-points/claude";
import * as clickup from "@atlassian/logo-third-party/dist/esm/entry-points/clickup";
import * as cloudflare from "@atlassian/logo-third-party/dist/esm/entry-points/cloudflare";
import * as codex from "@atlassian/logo-third-party/dist/esm/entry-points/codex";
import * as cursor from "@atlassian/logo-third-party/dist/esm/entry-points/cursor";
import * as daloopa from "@atlassian/logo-third-party/dist/esm/entry-points/daloopa";
import * as databricks from "@atlassian/logo-third-party/dist/esm/entry-points/databricks";
import * as datadog from "@atlassian/logo-third-party/dist/esm/entry-points/datadog";
import * as docker from "@atlassian/logo-third-party/dist/esm/entry-points/docker";
import * as documentum from "@atlassian/logo-third-party/dist/esm/entry-points/documentum";
import * as docusign from "@atlassian/logo-third-party/dist/esm/entry-points/docusign";
import * as dovetail from "@atlassian/logo-third-party/dist/esm/entry-points/dovetail";
import * as dropbox from "@atlassian/logo-third-party/dist/esm/entry-points/dropbox";
import * as dynatrace from "@atlassian/logo-third-party/dist/esm/entry-points/dynatrace";
import * as egnyte from "@atlassian/logo-third-party/dist/esm/entry-points/egnyte";
import * as evernote from "@atlassian/logo-third-party/dist/esm/entry-points/evernote";
import * as figma from "@atlassian/logo-third-party/dist/esm/entry-points/figma";
import * as fireflies from "@atlassian/logo-third-party/dist/esm/entry-points/fireflies";
import * as freshservice from "@atlassian/logo-third-party/dist/esm/entry-points/freshservice";
import * as gamma from "@atlassian/logo-third-party/dist/esm/entry-points/gamma";
import * as genericMcpServer from "@atlassian/logo-third-party/dist/esm/entry-points/generic-mcp-server";
import * as giphy from "@atlassian/logo-third-party/dist/esm/entry-points/giphy";
import * as github from "@atlassian/logo-third-party/dist/esm/entry-points/github";
import * as gitlab from "@atlassian/logo-third-party/dist/esm/entry-points/gitlab";
import * as gmail from "@atlassian/logo-third-party/dist/esm/entry-points/gmail";
import * as gong from "@atlassian/logo-third-party/dist/esm/entry-points/gong";
import * as googleCalendar from "@atlassian/logo-third-party/dist/esm/entry-points/google-calendar";
import * as googleCloudPlatform from "@atlassian/logo-third-party/dist/esm/entry-points/google-cloud-platform";
import * as googleDocs from "@atlassian/logo-third-party/dist/esm/entry-points/google-docs";
import * as googleDrive from "@atlassian/logo-third-party/dist/esm/entry-points/google-drive";
import * as googleGemini from "@atlassian/logo-third-party/dist/esm/entry-points/google-gemini";
import * as googleSheets from "@atlassian/logo-third-party/dist/esm/entry-points/google-sheets";
import * as googleSlides from "@atlassian/logo-third-party/dist/esm/entry-points/google-slides";
import * as hubspot from "@atlassian/logo-third-party/dist/esm/entry-points/hubspot";
import * as huggingFace from "@atlassian/logo-third-party/dist/esm/entry-points/hugging-face";
import * as identityNow from "@atlassian/logo-third-party/dist/esm/entry-points/identity-now";
import * as intercom from "@atlassian/logo-third-party/dist/esm/entry-points/intercom";
import * as invision from "@atlassian/logo-third-party/dist/esm/entry-points/invision";
import * as jam from "@atlassian/logo-third-party/dist/esm/entry-points/jam";
import * as jenkins from "@atlassian/logo-third-party/dist/esm/entry-points/jenkins";
import * as launchdarkly from "@atlassian/logo-third-party/dist/esm/entry-points/launchdarkly";
import * as linear from "@atlassian/logo-third-party/dist/esm/entry-points/linear";
import * as lucid from "@atlassian/logo-third-party/dist/esm/entry-points/lucid";
import * as lucidchart from "@atlassian/logo-third-party/dist/esm/entry-points/lucidchart";
import * as microsoft from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft";
import * as microsoft365 from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-365";
import * as microsoftAzure from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-azure";
import * as microsoftEntraId from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-entra-id";
import * as microsoftExcel from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-excel";
import * as microsoftOnedrive from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-onedrive";
import * as microsoftOutlook from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-outlook";
import * as microsoftPowerPoint from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-power-point";
import * as microsoftSharepoint from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-sharepoint";
import * as microsoftTeams from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-teams";
import * as microsoftWord from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-word";
import * as miro from "@atlassian/logo-third-party/dist/esm/entry-points/miro";
import * as monday from "@atlassian/logo-third-party/dist/esm/entry-points/monday";
import * as mural from "@atlassian/logo-third-party/dist/esm/entry-points/mural";
import * as neon from "@atlassian/logo-third-party/dist/esm/entry-points/neon";
import * as newRelic from "@atlassian/logo-third-party/dist/esm/entry-points/new-relic";
import * as notion from "@atlassian/logo-third-party/dist/esm/entry-points/notion";
import * as octopusDeploy from "@atlassian/logo-third-party/dist/esm/entry-points/octopus-deploy";
import * as okta from "@atlassian/logo-third-party/dist/esm/entry-points/okta";
import * as openai from "@atlassian/logo-third-party/dist/esm/entry-points/openai";
import * as oracle from "@atlassian/logo-third-party/dist/esm/entry-points/oracle";
import * as outreach from "@atlassian/logo-third-party/dist/esm/entry-points/outreach";
import * as pagerDuty from "@atlassian/logo-third-party/dist/esm/entry-points/pager-duty";
import * as paypal from "@atlassian/logo-third-party/dist/esm/entry-points/paypal";
import * as pipedrive from "@atlassian/logo-third-party/dist/esm/entry-points/pipedrive";
import * as postman from "@atlassian/logo-third-party/dist/esm/entry-points/postman";
import * as microsoftPowerBi from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-power-bi";
import * as quip from "@atlassian/logo-third-party/dist/esm/entry-points/quip";
import * as salesforce from "@atlassian/logo-third-party/dist/esm/entry-points/salesforce";
import * as sap from "@atlassian/logo-third-party/dist/esm/entry-points/sap";
import * as scriptrunner from "@atlassian/logo-third-party/dist/esm/entry-points/scriptrunner";
import * as sentry from "@atlassian/logo-third-party/dist/esm/entry-points/sentry";
import * as servicenow from "@atlassian/logo-third-party/dist/esm/entry-points/servicenow";
import * as shopify from "@atlassian/logo-third-party/dist/esm/entry-points/shopify";
import * as simpplr from "@atlassian/logo-third-party/dist/esm/entry-points/simpplr";
import * as slack from "@atlassian/logo-third-party/dist/esm/entry-points/slack";
import * as smartsheet from "@atlassian/logo-third-party/dist/esm/entry-points/smartsheet";
import * as snowflake from "@atlassian/logo-third-party/dist/esm/entry-points/snowflake";
import * as spinnaker from "@atlassian/logo-third-party/dist/esm/entry-points/spinnaker";
import * as splunk from "@atlassian/logo-third-party/dist/esm/entry-points/splunk";
import * as square from "@atlassian/logo-third-party/dist/esm/entry-points/square";
import * as stackOverflow from "@atlassian/logo-third-party/dist/esm/entry-points/stack-overflow";
import * as stripe from "@atlassian/logo-third-party/dist/esm/entry-points/stripe";
import * as stych from "@atlassian/logo-third-party/dist/esm/entry-points/stych";
import * as tableau from "@atlassian/logo-third-party/dist/esm/entry-points/tableau";
import * as tempoTimesheets from "@atlassian/logo-third-party/dist/esm/entry-points/tempo-timesheets";
import * as todoist from "@atlassian/logo-third-party/dist/esm/entry-points/todoist";
import * as twilio from "@atlassian/logo-third-party/dist/esm/entry-points/twilio";
import * as vercel from "@atlassian/logo-third-party/dist/esm/entry-points/vercel";
import * as webex from "@atlassian/logo-third-party/dist/esm/entry-points/webex";
import * as wix from "@atlassian/logo-third-party/dist/esm/entry-points/wix";
import * as workato from "@atlassian/logo-third-party/dist/esm/entry-points/workato";
import * as workday from "@atlassian/logo-third-party/dist/esm/entry-points/workday";
import * as youtube from "@atlassian/logo-third-party/dist/esm/entry-points/youtube";
import * as zapier from "@atlassian/logo-third-party/dist/esm/entry-points/zapier";
import * as zendesk from "@atlassian/logo-third-party/dist/esm/entry-points/zendesk";
import * as zeplin from "@atlassian/logo-third-party/dist/esm/entry-points/zeplin";
import * as ziprecruiter from "@atlassian/logo-third-party/dist/esm/entry-points/ziprecruiter";
import * as zoom from "@atlassian/logo-third-party/dist/esm/entry-points/zoom";

/** Tile size scale shared with `@atlaskit/tile` (matches `CUSTOM_LOGO_SIZES`). */
export type ThirdPartyLogoTileSize =
	| "xxsmall"
	| "xsmall"
	| "small"
	| "medium"
	| "large"
	| "xlarge";

export type ThirdPartyLogoIcon = ComponentType<{
	size?: ThirdPartyLogoTileSize;
	label?: string;
	testId?: string;
}>;

type ThirdPartyLogoIconModule = Readonly<Record<string, ThirdPartyLogoIcon>>;

const TILE_SIZES: ReadonlySet<string> = new Set([
	"xxsmall",
	"xsmall",
	"small",
	"medium",
	"large",
	"xlarge",
]);

/**
 * Map a VPK logo `size` (the shared named scale) to a Tile size. Numeric or
 * unknown sizes degrade to `"small"`, matching `CustomLogo`'s default.
 */
export function toThirdPartyLogoTileSize(size?: string | number): ThirdPartyLogoTileSize {
	return typeof size === "string" && TILE_SIZES.has(size)
		? (size as ThirdPartyLogoTileSize)
		: "small";
}

const THIRD_PARTY_LOGO_PACKAGE_MODULES = {
	adobe,
	adobexd,
	aha,
	airtable,
	amazon,
	"amazon-web-services-aws": amazonWebServicesAws,
	amplitude,
	ansible,
	asana,
	"microsoft-azure-devops": microsoftAzureDevops,
	box,
	brightspot,
	canva,
	claude,
	clickup,
	cloudflare,
	codex,
	cursor,
	daloopa,
	databricks,
	datadog,
	docker,
	documentum,
	docusign,
	dovetail,
	dropbox,
	dynatrace,
	egnyte,
	evernote,
	figma,
	fireflies,
	freshservice,
	gamma,
	"generic-mcp-server": genericMcpServer,
	giphy,
	github,
	gitlab,
	gmail,
	gong,
	"google-calendar": googleCalendar,
	"google-cloud-platform": googleCloudPlatform,
	"google-docs": googleDocs,
	"google-drive": googleDrive,
	"google-gemini": googleGemini,
	"google-sheets": googleSheets,
	"google-slides": googleSlides,
	hubspot,
	"hugging-face": huggingFace,
	"identity-now": identityNow,
	intercom,
	invision,
	jam,
	jenkins,
	launchdarkly,
	linear,
	lucid,
	lucidchart,
	microsoft,
	"microsoft-365": microsoft365,
	"microsoft-azure": microsoftAzure,
	"microsoft-entra-id": microsoftEntraId,
	"microsoft-excel": microsoftExcel,
	"microsoft-onedrive": microsoftOnedrive,
	"microsoft-outlook": microsoftOutlook,
	"microsoft-power-point": microsoftPowerPoint,
	"microsoft-sharepoint": microsoftSharepoint,
	"microsoft-teams": microsoftTeams,
	"microsoft-word": microsoftWord,
	miro,
	monday,
	mural,
	neon,
	"new-relic": newRelic,
	notion,
	"octopus-deploy": octopusDeploy,
	okta,
	openai,
	oracle,
	outreach,
	"pager-duty": pagerDuty,
	paypal,
	pipedrive,
	postman,
	"microsoft-power-bi": microsoftPowerBi,
	quip,
	salesforce,
	sap,
	scriptrunner,
	sentry,
	servicenow,
	shopify,
	simpplr,
	slack,
	smartsheet,
	snowflake,
	spinnaker,
	splunk,
	square,
	"stack-overflow": stackOverflow,
	stripe,
	stych,
	tableau,
	"tempo-timesheets": tempoTimesheets,
	todoist,
	twilio,
	vercel,
	webex,
	wix,
	workato,
	workday,
	youtube,
	zapier,
	zendesk,
	zeplin,
	ziprecruiter,
	zoom,
} as const satisfies Record<ThirdPartyLogoPackageEntry, ThirdPartyLogoIconModule>;

function resolvePackageIcon(entry: (typeof THIRD_PARTY_LOGO_PACKAGE_ICON_ENTRIES)[number]): ThirdPartyLogoIcon {
	const Icon = THIRD_PARTY_LOGO_PACKAGE_MODULES[entry.packageIcon.entrypoint][entry.packageIcon.exportName];
	if (!Icon) {
		throw new Error(
			`Missing @atlassian/logo-third-party icon export ${entry.packageIcon.exportName} ` +
				`from entrypoint ${entry.packageIcon.entrypoint}`,
		);
	}
	return Icon;
}

function buildThirdPartyLogoIconMap(): Partial<Record<ThirdPartyLogoName, ThirdPartyLogoIcon>> {
	return Object.fromEntries(
		THIRD_PARTY_LOGO_PACKAGE_ICON_ENTRIES.map((entry) => [entry.name, resolvePackageIcon(entry)]),
	) as Partial<Record<ThirdPartyLogoName, ThirdPartyLogoIcon>>;
}

/**
 * VPK brand id to Atlassian package icon component. Fallback-only brands are
 * omitted and handled by the local `public/3p` renderer.
 */
export const THIRD_PARTY_LOGO_ICONS = buildThirdPartyLogoIconMap();

/**
 * Look up a brand icon by raw id (e.g. `"figma"`). Returns `undefined` when the
 * brand has no upstream package asset.
 */
export function getThirdPartyLogoIconById(id: string): ThirdPartyLogoIcon | undefined {
	return (THIRD_PARTY_LOGO_ICONS as Record<string, ThirdPartyLogoIcon | undefined>)[id];
}

/**
 * Extract the `/3p/<id>/...` brand id from an asset path and resolve its package
 * icon. Returns `undefined` for non-3p paths or brands without an upstream asset.
 */
export function getThirdPartyLogoIconFromSrc(src: string): ThirdPartyLogoIcon | undefined {
	const match = /^\/3p\/([^/]+)\//.exec(src);
	return match ? getThirdPartyLogoIconById(match[1]) : undefined;
}

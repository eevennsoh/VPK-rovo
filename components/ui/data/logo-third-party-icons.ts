/**
 * Resolves VPK third-party brand ids to their `@atlassian/logo-third-party`
 * (Atlassian Platform Labs) icon components. This replaces the local
 * `public/3p/<id>` SVG assets as the source of truth for third-party brand
 * marks: the package renders each logo full-bleed inside an `@atlaskit/tile`
 * (white background, Tile border on), and is maintained + updated upstream.
 *
 * Brands without a package entry point (`adobe-sign`, `coupa`,
 * `google-chrome`, `spinnaker`) are intentionally absent from the map; callers
 * fall back to the still-present `public/3p` assets via `CustomLogo`.
 *
 * Imports target the package's deep ESM entry points directly because the
 * package ships no `exports` map — see `types/atlassian-logo-third-party.d.ts`.
 */
import type { ComponentType } from "react";

import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

import * as adobexd from "@atlassian/logo-third-party/dist/esm/entry-points/adobexd";
import * as aha from "@atlassian/logo-third-party/dist/esm/entry-points/aha";
import * as airtable from "@atlassian/logo-third-party/dist/esm/entry-points/airtable";
import * as amplitude from "@atlassian/logo-third-party/dist/esm/entry-points/amplitude";
import * as asana from "@atlassian/logo-third-party/dist/esm/entry-points/asana";
import * as microsoftAzureDevops from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-azure-devops";
import * as box from "@atlassian/logo-third-party/dist/esm/entry-points/box";
import * as brightspot from "@atlassian/logo-third-party/dist/esm/entry-points/brightspot";
import * as canva from "@atlassian/logo-third-party/dist/esm/entry-points/canva";
import * as clickup from "@atlassian/logo-third-party/dist/esm/entry-points/clickup";
import * as databricks from "@atlassian/logo-third-party/dist/esm/entry-points/databricks";
import * as datadog from "@atlassian/logo-third-party/dist/esm/entry-points/datadog";
import * as docusign from "@atlassian/logo-third-party/dist/esm/entry-points/docusign";
import * as dovetail from "@atlassian/logo-third-party/dist/esm/entry-points/dovetail";
import * as dropbox from "@atlassian/logo-third-party/dist/esm/entry-points/dropbox";
import * as egnyte from "@atlassian/logo-third-party/dist/esm/entry-points/egnyte";
import * as figma from "@atlassian/logo-third-party/dist/esm/entry-points/figma";
import * as freshservice from "@atlassian/logo-third-party/dist/esm/entry-points/freshservice";
import * as github from "@atlassian/logo-third-party/dist/esm/entry-points/github";
import * as gitlab from "@atlassian/logo-third-party/dist/esm/entry-points/gitlab";
import * as gmail from "@atlassian/logo-third-party/dist/esm/entry-points/gmail";
import * as googleCalendar from "@atlassian/logo-third-party/dist/esm/entry-points/google-calendar";
import * as googleCloudPlatform from "@atlassian/logo-third-party/dist/esm/entry-points/google-cloud-platform";
import * as googleDrive from "@atlassian/logo-third-party/dist/esm/entry-points/google-drive";
import * as hubspot from "@atlassian/logo-third-party/dist/esm/entry-points/hubspot";
import * as jenkins from "@atlassian/logo-third-party/dist/esm/entry-points/jenkins";
import * as launchdarkly from "@atlassian/logo-third-party/dist/esm/entry-points/launchdarkly";
import * as lucid from "@atlassian/logo-third-party/dist/esm/entry-points/lucid";
import * as lucidchart from "@atlassian/logo-third-party/dist/esm/entry-points/lucidchart";
import * as microsoftOnedrive from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-onedrive";
import * as microsoftOutlook from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-outlook";
import * as microsoftSharepoint from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-sharepoint";
import * as microsoftTeams from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-teams";
import * as miro from "@atlassian/logo-third-party/dist/esm/entry-points/miro";
import * as monday from "@atlassian/logo-third-party/dist/esm/entry-points/monday";
import * as mural from "@atlassian/logo-third-party/dist/esm/entry-points/mural";
import * as notion from "@atlassian/logo-third-party/dist/esm/entry-points/notion";
import * as outreach from "@atlassian/logo-third-party/dist/esm/entry-points/outreach";
import * as pagerDuty from "@atlassian/logo-third-party/dist/esm/entry-points/pager-duty";
import * as pipedrive from "@atlassian/logo-third-party/dist/esm/entry-points/pipedrive";
import * as microsoftPowerBi from "@atlassian/logo-third-party/dist/esm/entry-points/microsoft-power-bi";
import * as salesforce from "@atlassian/logo-third-party/dist/esm/entry-points/salesforce";
import * as sentry from "@atlassian/logo-third-party/dist/esm/entry-points/sentry";
import * as servicenow from "@atlassian/logo-third-party/dist/esm/entry-points/servicenow";
import * as simpplr from "@atlassian/logo-third-party/dist/esm/entry-points/simpplr";
import * as slack from "@atlassian/logo-third-party/dist/esm/entry-points/slack";
import * as smartsheet from "@atlassian/logo-third-party/dist/esm/entry-points/smartsheet";
import * as stackOverflow from "@atlassian/logo-third-party/dist/esm/entry-points/stack-overflow";
import * as stripe from "@atlassian/logo-third-party/dist/esm/entry-points/stripe";
import * as tableau from "@atlassian/logo-third-party/dist/esm/entry-points/tableau";
import * as todoist from "@atlassian/logo-third-party/dist/esm/entry-points/todoist";
import * as webex from "@atlassian/logo-third-party/dist/esm/entry-points/webex";
import * as workday from "@atlassian/logo-third-party/dist/esm/entry-points/workday";
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

/**
 * VPK brand id -> Atlassian package icon component. Keyed by `ThirdPartyLogoName`;
 * brands with no upstream asset are omitted (handled by the public/3p fallback).
 */
export const THIRD_PARTY_LOGO_ICONS: Partial<Record<ThirdPartyLogoName, ThirdPartyLogoIcon>> = {
	"adobe-xd": adobexd.AdobeXDIcon,
	"aha": aha.AhaIcon,
	"airtable": airtable.AirtableIcon,
	"amplitude": amplitude.AmplitudeIcon,
	"asana": asana.AsanaIcon,
	"azure-devops": microsoftAzureDevops.MicrosoftAzureDevOpsIcon,
	"box": box.BoxIcon,
	"brightspot": brightspot.BrightspotIcon,
	"canva": canva.CanvaIcon,
	"clickup": clickup.ClickupIcon,
	"databricks": databricks.DatabricksIcon,
	"datadog": datadog.DataDogIcon,
	"docusign": docusign.DocuSignIcon,
	"dovetail": dovetail.DovetailIcon,
	"dropbox": dropbox.DropboxIcon,
	"egnyte": egnyte.EgnyteIcon,
	"figma": figma.FigmaIcon,
	"freshservice": freshservice.FreshserviceIcon,
	"github": github.GithubIcon,
	"gitlab": gitlab.GitlabIcon,
	"gmail": gmail.GmailIcon,
	"google-calendar": googleCalendar.GoogleCalendarIcon,
	"google-cloud-platform": googleCloudPlatform.GoogleCloudPlatformIcon,
	"google-drive": googleDrive.GoogleDriveIcon,
	"hubspot": hubspot.HubspotIcon,
	"jenkins": jenkins.JenkinsIcon,
	"launchdarkly": launchdarkly.LaunchdarklyIcon,
	"lucid-co": lucid.LucidIcon,
	"lucidchart": lucidchart.LucidchartIcon,
	"microsoft-onedrive": microsoftOnedrive.MicrosoftOneDriveIcon,
	"microsoft-outlook": microsoftOutlook.MicrosoftOutlookIcon,
	"microsoft-sharepoint": microsoftSharepoint.MicrosoftSharePointIcon,
	"microsoft-teams": microsoftTeams.MicrosoftTeamsIcon,
	"miro": miro.MiroIcon,
	"monday": monday.MondayIcon,
	"mural": mural.MuralIcon,
	"notion": notion.NotionIcon,
	"outreach": outreach.OutreachIcon,
	"pagerduty": pagerDuty.PagerDutyIcon,
	"pipedrive": pipedrive.PipedriveIcon,
	"powerbi": microsoftPowerBi.MicrosoftPowerBIIcon,
	"salesforce": salesforce.SalesforceIcon,
	"sentry": sentry.SentryIcon,
	"servicenow": servicenow.ServiceNowIcon,
	"simpplr": simpplr.SimpplrIcon,
	"slack": slack.SlackIcon,
	"smartsheet": smartsheet.SmartsheetIcon,
	"stack-overflow": stackOverflow.StackOverflowIcon,
	"stripe": stripe.StripeIcon,
	"tableau": tableau.TableauIcon,
	"todoist": todoist.TodoistIcon,
	"webex": webex.WebexIcon,
	"workday": workday.WorkdayIcon,
	"zendesk": zendesk.ZendeskIcon,
	"zeplin": zeplin.ZeplinIcon,
	"ziprecruiter": ziprecruiter.ZipRecruiterIcon,
	"zoom": zoom.ZoomIcon,
};

/**
 * Look up a brand icon by raw id (e.g. `"figma"`) — the same ids used as
 * `public/3p/<id>` folder names and as `ThirdPartyLogoName` values. Returns
 * `undefined` when the brand has no upstream package asset.
 */
export function getThirdPartyLogoIconById(id: string): ThirdPartyLogoIcon | undefined {
	return (THIRD_PARTY_LOGO_ICONS as Record<string, ThirdPartyLogoIcon | undefined>)[id];
}

/**
 * Extract the `/3p/<id>/…` brand id from an asset path and resolve its package
 * icon. Returns `undefined` for non-3p paths (e.g. project avatars) or brands
 * without an upstream asset.
 */
export function getThirdPartyLogoIconFromSrc(src: string): ThirdPartyLogoIcon | undefined {
	const match = /^\/3p\/([^/]+)\//.exec(src);
	return match ? getThirdPartyLogoIconById(match[1]) : undefined;
}

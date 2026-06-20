/**
 * Resolves VPK third-party brand ids to their `@atlassian/logo-third-party`
 * (Atlassian Platform Labs) icon components — the upstream source of truth for
 * third-party brand marks, rendered full-bleed inside an `@atlaskit/tile`.
 *
 * Brands listed in `THIRD_PARTY_LOGO_LOCAL_FALLBACKS` have no package entry and
 * are intentionally absent from the map; callers fall back to `public/3p`.
 *
 * Imports target the package's deep ESM entry points directly because the
 * package ships no `exports` map — see `types/atlassian-logo-third-party.d.ts`.
 */
import type { ComponentType } from "react";

import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

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
 * fallback brands are omitted (handled by the public/3p fallback).
 */
export const THIRD_PARTY_LOGO_ICONS: Partial<Record<ThirdPartyLogoName, ThirdPartyLogoIcon>> = {
	adobe: adobe.AdobeIcon,
	"adobe-xd": adobexd.AdobeXDIcon,
	aha: aha.AhaIcon,
	airtable: airtable.AirtableIcon,
	amazon: amazon.AmazonIcon,
	"amazon-web-services-aws": amazonWebServicesAws.AmazonWebServicesAWSIcon,
	amplitude: amplitude.AmplitudeIcon,
	ansible: ansible.AnsibleIcon,
	asana: asana.AsanaIcon,
	"azure-devops": microsoftAzureDevops.MicrosoftAzureDevOpsIcon,
	box: box.BoxIcon,
	brightspot: brightspot.BrightspotIcon,
	canva: canva.CanvaIcon,
	claude: claude.ClaudeIcon,
	clickup: clickup.ClickupIcon,
	cloudflare: cloudflare.CloudflareIcon,
	cursor: cursor.CursorIcon,
	daloopa: daloopa.DaloopaIcon,
	databricks: databricks.DatabricksIcon,
	datadog: datadog.DataDogIcon,
	docker: docker.DockerIcon,
	documentum: documentum.DocumentumIcon,
	docusign: docusign.DocuSignIcon,
	dovetail: dovetail.DovetailIcon,
	dropbox: dropbox.DropboxIcon,
	dynatrace: dynatrace.DynatraceIcon,
	egnyte: egnyte.EgnyteIcon,
	evernote: evernote.EvernoteIcon,
	figma: figma.FigmaIcon,
	fireflies: fireflies.FirefliesIcon,
	freshservice: freshservice.FreshserviceIcon,
	gamma: gamma.GammaIcon,
	"generic-mcp-server": genericMcpServer.GenericMCPServerIcon,
	giphy: giphy.GiphyIcon,
	github: github.GithubIcon,
	gitlab: gitlab.GitlabIcon,
	gmail: gmail.GmailIcon,
	gong: gong.GongIcon,
	"google-calendar": googleCalendar.GoogleCalendarIcon,
	"google-cloud-platform": googleCloudPlatform.GoogleCloudPlatformIcon,
	"google-docs": googleDocs.GoogleDocsIcon,
	"google-drive": googleDrive.GoogleDriveIcon,
	"google-sheets": googleSheets.GoogleSheetsIcon,
	"google-slides": googleSlides.GoogleSlidesIcon,
	hubspot: hubspot.HubspotIcon,
	"hugging-face": huggingFace.HuggingFaceIcon,
	"identity-now": identityNow.IdentityNowIcon,
	intercom: intercom.IntercomIcon,
	invision: invision.InVisionIcon,
	jam: jam.JamIcon,
	jenkins: jenkins.JenkinsIcon,
	launchdarkly: launchdarkly.LaunchdarklyIcon,
	linear: linear.LinearIcon,
	"lucid-co": lucid.LucidIcon,
	lucidchart: lucidchart.LucidchartIcon,
	microsoft: microsoft.MicrosoftIcon,
	"microsoft-365": microsoft365.Microsoft365Icon,
	"microsoft-azure": microsoftAzure.MicrosoftAzureIcon,
	"microsoft-entra-id": microsoftEntraId.MicrosoftEntraIDIcon,
	"microsoft-excel": microsoftExcel.MicrosoftExcelIcon,
	"microsoft-onedrive": microsoftOnedrive.MicrosoftOneDriveIcon,
	"microsoft-outlook": microsoftOutlook.MicrosoftOutlookIcon,
	"microsoft-power-point": microsoftPowerPoint.MicrosoftPowerPointIcon,
	"microsoft-sharepoint": microsoftSharepoint.MicrosoftSharePointIcon,
	"microsoft-teams": microsoftTeams.MicrosoftTeamsIcon,
	"microsoft-word": microsoftWord.MicrosoftWordIcon,
	miro: miro.MiroIcon,
	monday: monday.MondayIcon,
	mural: mural.MuralIcon,
	neon: neon.NeonIcon,
	"new-relic": newRelic.NewRelicIcon,
	notion: notion.NotionIcon,
	"octopus-deploy": octopusDeploy.OctopusDeployIcon,
	okta: okta.OktaIcon,
	openai: openai.OpenAIIcon,
	oracle: oracle.OracleIcon,
	outreach: outreach.OutreachIcon,
	pagerduty: pagerDuty.PagerDutyIcon,
	paypal: paypal.PayPalIcon,
	pipedrive: pipedrive.PipedriveIcon,
	postman: postman.PostmanIcon,
	powerbi: microsoftPowerBi.MicrosoftPowerBIIcon,
	quip: quip.QuipIcon,
	salesforce: salesforce.SalesforceIcon,
	sap: sap.SAPIcon,
	scriptrunner: scriptrunner.ScriptrunnerIcon,
	sentry: sentry.SentryIcon,
	servicenow: servicenow.ServiceNowIcon,
	shopify: shopify.ShopifyIcon,
	simpplr: simpplr.SimpplrIcon,
	slack: slack.SlackIcon,
	smartsheet: smartsheet.SmartsheetIcon,
	snowflake: snowflake.SnowflakeIcon,
	splunk: splunk.SplunkIcon,
	square: square.SquareIcon,
	"stack-overflow": stackOverflow.StackOverflowIcon,
	stripe: stripe.StripeIcon,
	stych: stych.StychIcon,
	tableau: tableau.TableauIcon,
	"tempo-timesheets": tempoTimesheets.TempoTimesheetsIcon,
	todoist: todoist.TodoistIcon,
	twilio: twilio.TwilioIcon,
	vercel: vercel.VercelIcon,
	webex: webex.WebexIcon,
	wix: wix.WixIcon,
	workato: workato.WorkatoIcon,
	workday: workday.WorkdayIcon,
	youtube: youtube.YoutubeIcon,
	zapier: zapier.ZapierIcon,
	zendesk: zendesk.ZendeskIcon,
	zeplin: zeplin.ZeplinIcon,
	ziprecruiter: ziprecruiter.ZipRecruiterIcon,
	zoom: zoom.ZoomIcon,
};

/**
 * Look up a brand icon by raw id (e.g. `"figma"`). Returns `undefined` when the
 * brand has no upstream package asset.
 */
export function getThirdPartyLogoIconById(id: string): ThirdPartyLogoIcon | undefined {
	return (THIRD_PARTY_LOGO_ICONS as Record<string, ThirdPartyLogoIcon | undefined>)[id];
}

/**
 * Extract the `/3p/<id>/…` brand id from an asset path and resolve its package
 * icon. Returns `undefined` for non-3p paths or brands without an upstream asset.
 */
export function getThirdPartyLogoIconFromSrc(src: string): ThirdPartyLogoIcon | undefined {
	const match = /^\/3p\/([^/]+)\//.exec(src);
	return match ? getThirdPartyLogoIconById(match[1]) : undefined;
}

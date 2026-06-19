/**
 * Static catalog for the third-party (3P) brand logos shipped under
 * `public/3p/<id>/`. Mirrors the Atlassian `platform-labs/logo-third-party`
 * package's named-brand surface, but backed by the local SVG assets and the
 * centralized usage metadata (`logo-usage.json`) instead of bundled artwork.
 *
 * `THIRD_PARTY_LOGO_NAMES` MUST stay in sync with the `public/3p` folders —
 * `logo-third-party.test.js` reads the directory and fails if they drift.
 */

/** Every brand id with assets under `public/3p/<id>/`. Keep alphabetized. */
export const THIRD_PARTY_LOGO_NAMES = [
	"adobe-sign",
	"adobe-xd",
	"aha",
	"airtable",
	"amplitude",
	"asana",
	"azure-devops",
	"box",
	"brightspot",
	"canva",
	"clickup",
	"coupa",
	"databricks",
	"datadog",
	"docusign",
	"dovetail",
	"dropbox",
	"egnyte",
	"figma",
	"freshservice",
	"github",
	"gitlab",
	"gmail",
	"google-calendar",
	"google-chrome",
	"google-cloud-platform",
	"google-drive",
	"hubspot",
	"jenkins",
	"launchdarkly",
	"lucid-co",
	"lucidchart",
	"microsoft-onedrive",
	"microsoft-outlook",
	"microsoft-sharepoint",
	"microsoft-teams",
	"miro",
	"monday",
	"mural",
	"notion",
	"outreach",
	"pagerduty",
	"pipedrive",
	"powerbi",
	"salesforce",
	"sentry",
	"servicenow",
	"simpplr",
	"slack",
	"smartsheet",
	"spinnaker",
	"stack-overflow",
	"stripe",
	"tableau",
	"todoist",
	"webex",
	"workday",
	"zendesk",
	"zeplin",
	"ziprecruiter",
	"zoom",
] as const;

export type ThirdPartyLogoName = (typeof THIRD_PARTY_LOGO_NAMES)[number];

/**
 * Human-readable brand names. Used for accessible labels and demo captions.
 * Casing follows each vendor's own brand styling (e.g. GitHub, HubSpot).
 */
export const THIRD_PARTY_LOGO_LABELS: Readonly<Record<ThirdPartyLogoName, string>> = {
	"adobe-sign": "Adobe Sign",
	"adobe-xd": "Adobe XD",
	aha: "Aha!",
	airtable: "Airtable",
	amplitude: "Amplitude",
	asana: "Asana",
	"azure-devops": "Azure DevOps",
	box: "Box",
	brightspot: "Brightspot",
	canva: "Canva",
	clickup: "ClickUp",
	coupa: "Coupa",
	databricks: "Databricks",
	datadog: "Datadog",
	docusign: "DocuSign",
	dovetail: "Dovetail",
	dropbox: "Dropbox",
	egnyte: "Egnyte",
	figma: "Figma",
	freshservice: "Freshservice",
	github: "GitHub",
	gitlab: "GitLab",
	gmail: "Gmail",
	"google-calendar": "Google Calendar",
	"google-chrome": "Google Chrome",
	"google-cloud-platform": "Google Cloud Platform",
	"google-drive": "Google Drive",
	hubspot: "HubSpot",
	jenkins: "Jenkins",
	launchdarkly: "LaunchDarkly",
	"lucid-co": "Lucid",
	lucidchart: "Lucidchart",
	"microsoft-onedrive": "Microsoft OneDrive",
	"microsoft-outlook": "Microsoft Outlook",
	"microsoft-sharepoint": "Microsoft SharePoint",
	"microsoft-teams": "Microsoft Teams",
	miro: "Miro",
	monday: "monday.com",
	mural: "Mural",
	notion: "Notion",
	outreach: "Outreach",
	pagerduty: "PagerDuty",
	pipedrive: "Pipedrive",
	powerbi: "Power BI",
	salesforce: "Salesforce",
	sentry: "Sentry",
	servicenow: "ServiceNow",
	simpplr: "Simpplr",
	slack: "Slack",
	smartsheet: "Smartsheet",
	spinnaker: "Spinnaker",
	"stack-overflow": "Stack Overflow",
	stripe: "Stripe",
	tableau: "Tableau",
	todoist: "Todoist",
	webex: "Webex",
	workday: "Workday",
	zendesk: "Zendesk",
	zeplin: "Zeplin",
	ziprecruiter: "ZipRecruiter",
	zoom: "Zoom",
};

/**
 * The brand asset path consumed by `CustomLogo`. We always reference the `24`
 * variant: `CustomLogo` resolves the final src + border treatment from
 * `logo-usage.json` (white-tile marks swap to their `16-borderless.svg` sibling,
 * so the `24` size is never fetched for those — which is why brands that only
 * ship a borderless file still resolve correctly).
 */
export function thirdPartyLogoSrc(name: ThirdPartyLogoName): string {
	return `/3p/${name}/24.svg`;
}

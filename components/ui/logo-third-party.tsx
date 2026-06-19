"use client";

// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates the generated per-brand logo components alongside the base wrapper.

import { CustomLogo, type CustomLogoProps } from "@/components/ui/logo";
import {
	THIRD_PARTY_LOGO_LABELS,
	THIRD_PARTY_LOGO_NAMES,
	thirdPartyLogoSrc,
	type ThirdPartyLogoName,
} from "@/components/ui/data/logo-third-party-data";

export { THIRD_PARTY_LOGO_NAMES, THIRD_PARTY_LOGO_LABELS };
export type { ThirdPartyLogoName };

export interface LogoThirdPartyProps extends Omit<CustomLogoProps, "src" | "svg"> {
	/** Third-party brand id (matches a folder under `public/3p/`). */
	name: ThirdPartyLogoName;
}

/**
 * Renders a third-party brand logo from the local `public/3p/<name>/` assets.
 * Border treatment and the white-tile borderless-variant swap are resolved
 * automatically by `CustomLogo` from `logo-usage.json` — callers never wire
 * borders per brand. The accessible label defaults to the brand's display name.
 */
export function LogoThirdParty({ name, label, ...props }: Readonly<LogoThirdPartyProps>) {
	return (
		<CustomLogo
			src={thirdPartyLogoSrc(name)}
			label={label ?? THIRD_PARTY_LOGO_LABELS[name]}
			{...props}
		/>
	);
}

/* -- Named brand exports ----------------------------------------- */

function createThirdPartyLogo(name: ThirdPartyLogoName) {
	return function LogoComponent(props: Readonly<Omit<LogoThirdPartyProps, "name">>) {
		return <LogoThirdParty name={name} {...props} />;
	};
}

export const AdobeSignLogo = createThirdPartyLogo("adobe-sign");
export const AdobeXdLogo = createThirdPartyLogo("adobe-xd");
export const AhaLogo = createThirdPartyLogo("aha");
export const AirtableLogo = createThirdPartyLogo("airtable");
export const AmplitudeLogo = createThirdPartyLogo("amplitude");
export const AsanaLogo = createThirdPartyLogo("asana");
export const AzureDevopsLogo = createThirdPartyLogo("azure-devops");
export const BoxLogo = createThirdPartyLogo("box");
export const BrightspotLogo = createThirdPartyLogo("brightspot");
export const CanvaLogo = createThirdPartyLogo("canva");
export const ClickupLogo = createThirdPartyLogo("clickup");
export const CoupaLogo = createThirdPartyLogo("coupa");
export const DatabricksLogo = createThirdPartyLogo("databricks");
export const DatadogLogo = createThirdPartyLogo("datadog");
export const DocusignLogo = createThirdPartyLogo("docusign");
export const DovetailLogo = createThirdPartyLogo("dovetail");
export const DropboxLogo = createThirdPartyLogo("dropbox");
export const EgnyteLogo = createThirdPartyLogo("egnyte");
export const FigmaLogo = createThirdPartyLogo("figma");
export const FreshserviceLogo = createThirdPartyLogo("freshservice");
export const GithubLogo = createThirdPartyLogo("github");
export const GitlabLogo = createThirdPartyLogo("gitlab");
export const GmailLogo = createThirdPartyLogo("gmail");
export const GoogleCalendarLogo = createThirdPartyLogo("google-calendar");
export const GoogleChromeLogo = createThirdPartyLogo("google-chrome");
export const GoogleCloudPlatformLogo = createThirdPartyLogo("google-cloud-platform");
export const GoogleDriveLogo = createThirdPartyLogo("google-drive");
export const HubspotLogo = createThirdPartyLogo("hubspot");
export const JenkinsLogo = createThirdPartyLogo("jenkins");
export const LaunchdarklyLogo = createThirdPartyLogo("launchdarkly");
export const LucidCoLogo = createThirdPartyLogo("lucid-co");
export const LucidchartLogo = createThirdPartyLogo("lucidchart");
export const MicrosoftOnedriveLogo = createThirdPartyLogo("microsoft-onedrive");
export const MicrosoftOutlookLogo = createThirdPartyLogo("microsoft-outlook");
export const MicrosoftSharepointLogo = createThirdPartyLogo("microsoft-sharepoint");
export const MicrosoftTeamsLogo = createThirdPartyLogo("microsoft-teams");
export const MiroLogo = createThirdPartyLogo("miro");
export const MondayLogo = createThirdPartyLogo("monday");
export const MuralLogo = createThirdPartyLogo("mural");
export const NotionLogo = createThirdPartyLogo("notion");
export const OutreachLogo = createThirdPartyLogo("outreach");
export const PagerdutyLogo = createThirdPartyLogo("pagerduty");
export const PipedriveLogo = createThirdPartyLogo("pipedrive");
export const PowerbiLogo = createThirdPartyLogo("powerbi");
export const SalesforceLogo = createThirdPartyLogo("salesforce");
export const SentryLogo = createThirdPartyLogo("sentry");
export const ServicenowLogo = createThirdPartyLogo("servicenow");
export const SimpplrLogo = createThirdPartyLogo("simpplr");
export const SlackLogo = createThirdPartyLogo("slack");
export const SmartsheetLogo = createThirdPartyLogo("smartsheet");
export const SpinnakerLogo = createThirdPartyLogo("spinnaker");
export const StackOverflowLogo = createThirdPartyLogo("stack-overflow");
export const StripeLogo = createThirdPartyLogo("stripe");
export const TableauLogo = createThirdPartyLogo("tableau");
export const TodoistLogo = createThirdPartyLogo("todoist");
export const WebexLogo = createThirdPartyLogo("webex");
export const WorkdayLogo = createThirdPartyLogo("workday");
export const ZendeskLogo = createThirdPartyLogo("zendesk");
export const ZeplinLogo = createThirdPartyLogo("zeplin");
export const ZiprecruiterLogo = createThirdPartyLogo("ziprecruiter");
export const ZoomLogo = createThirdPartyLogo("zoom");

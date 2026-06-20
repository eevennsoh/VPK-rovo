"use client";

// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates the generated per-brand logo components alongside the base wrapper.

import { CUSTOM_LOGO_SIZES } from "@/components/ui/data/logo-data";
import {
	isLocalAssetThirdPartyLogoName,
	THIRD_PARTY_LOGO_LABELS,
	THIRD_PARTY_LOGO_NAMES,
	thirdPartyLogoSrc,
	type ThirdPartyLogoName,
} from "@/components/ui/data/logo-third-party-data";
import {
	THIRD_PARTY_LOGO_ICONS,
	toThirdPartyLogoTileSize,
} from "@/components/ui/data/logo-third-party-icons";
import { CustomLogo, type CustomLogoProps } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export { THIRD_PARTY_LOGO_NAMES, THIRD_PARTY_LOGO_LABELS };
export type { ThirdPartyLogoName };

export interface LogoThirdPartyProps extends Omit<CustomLogoProps, "src" | "svg"> {
	/** Third-party brand id (matches a folder under `public/3p/`). */
	name: ThirdPartyLogoName;
}

/**
 * Renders a third-party brand logo from the upstream `@atlassian/logo-third-party`
 * package (Atlassian Platform Labs), which draws each mark full-bleed inside an
 * `@atlaskit/tile` (white background, Tile border on) and is maintained upstream.
 *
 * Brands not yet published to the package (`adobe-sign`, `coupa`,
 * `google-chrome`, `spinnaker`) fall back to the local `public/3p/<name>/`
 * assets via `CustomLogo`. The accessible label defaults to the brand's display
 * name; an optional `wordmark` renders beside the mark as an inline lockup.
 */
export function LogoThirdParty({
	name,
	label,
	size,
	wordmark,
	className,
}: Readonly<LogoThirdPartyProps>) {
	const accessibleLabel = label ?? THIRD_PARTY_LOGO_LABELS[name];
	const Icon = THIRD_PARTY_LOGO_ICONS[name];

	if (!Icon) {
		// No package icon → only the local-asset (public/3p) fallback brands reach
		// here. The guard narrows `name` to a brand that has a `public/3p` folder.
		return isLocalAssetThirdPartyLogoName(name) ? (
			<CustomLogo
				className={className}
				label={accessibleLabel}
				size={size}
				src={thirdPartyLogoSrc(name)}
				wordmark={wordmark}
			/>
		) : null;
	}

	// The package tile already encapsulates the accessible label and sizing.
	const icon = <Icon label={wordmark ? "" : accessibleLabel} size={toThirdPartyLogoTileSize(size)} />;
	if (!wordmark && !className) {
		return icon;
	}

	// Lockup (icon + wordmark) or custom className — mirror CustomLogo's layout.
	const px = CUSTOM_LOGO_SIZES[toThirdPartyLogoTileSize(size)] ?? CUSTOM_LOGO_SIZES.small;
	return (
		<span aria-label={accessibleLabel} className={cn("inline-flex items-center gap-1", className)} role="img">
			{icon}
			{wordmark ? (
				<span className="font-semibold leading-none text-text" style={{ fontSize: Math.max(12, px * 0.6) }}>
					{wordmark}
				</span>
			) : null}
		</span>
	);
}

/* -- Named brand exports ----------------------------------------- */

function createThirdPartyLogo(name: ThirdPartyLogoName) {
	return function LogoComponent(props: Readonly<Omit<LogoThirdPartyProps, "name">>) {
		return <LogoThirdParty name={name} {...props} />;
	};
}

export const AdobeLogo = createThirdPartyLogo("adobe");
export const AdobeSignLogo = createThirdPartyLogo("adobe-sign");
export const AdobeXdLogo = createThirdPartyLogo("adobe-xd");
export const AhaLogo = createThirdPartyLogo("aha");
export const AirtableLogo = createThirdPartyLogo("airtable");
export const AmazonLogo = createThirdPartyLogo("amazon");
export const AmazonWebServicesAwsLogo = createThirdPartyLogo("amazon-web-services-aws");
export const AmplitudeLogo = createThirdPartyLogo("amplitude");
export const AnsibleLogo = createThirdPartyLogo("ansible");
export const AsanaLogo = createThirdPartyLogo("asana");
export const AzureDevopsLogo = createThirdPartyLogo("azure-devops");
export const BoxLogo = createThirdPartyLogo("box");
export const BrightspotLogo = createThirdPartyLogo("brightspot");
export const CanvaLogo = createThirdPartyLogo("canva");
export const ClaudeLogo = createThirdPartyLogo("claude");
export const ClickupLogo = createThirdPartyLogo("clickup");
export const CloudflareLogo = createThirdPartyLogo("cloudflare");
export const CoupaLogo = createThirdPartyLogo("coupa");
export const CursorLogo = createThirdPartyLogo("cursor");
export const DaloopaLogo = createThirdPartyLogo("daloopa");
export const DatabricksLogo = createThirdPartyLogo("databricks");
export const DatadogLogo = createThirdPartyLogo("datadog");
export const DockerLogo = createThirdPartyLogo("docker");
export const DocumentumLogo = createThirdPartyLogo("documentum");
export const DocusignLogo = createThirdPartyLogo("docusign");
export const DovetailLogo = createThirdPartyLogo("dovetail");
export const DropboxLogo = createThirdPartyLogo("dropbox");
export const DynatraceLogo = createThirdPartyLogo("dynatrace");
export const EgnyteLogo = createThirdPartyLogo("egnyte");
export const EvernoteLogo = createThirdPartyLogo("evernote");
export const FigmaLogo = createThirdPartyLogo("figma");
export const FirefliesLogo = createThirdPartyLogo("fireflies");
export const FreshserviceLogo = createThirdPartyLogo("freshservice");
export const GammaLogo = createThirdPartyLogo("gamma");
export const GenericMcpServerLogo = createThirdPartyLogo("generic-mcp-server");
export const GiphyLogo = createThirdPartyLogo("giphy");
export const GithubLogo = createThirdPartyLogo("github");
export const GitlabLogo = createThirdPartyLogo("gitlab");
export const GmailLogo = createThirdPartyLogo("gmail");
export const GongLogo = createThirdPartyLogo("gong");
export const GoogleCalendarLogo = createThirdPartyLogo("google-calendar");
export const GoogleChromeLogo = createThirdPartyLogo("google-chrome");
export const GoogleCloudPlatformLogo = createThirdPartyLogo("google-cloud-platform");
export const GoogleDocsLogo = createThirdPartyLogo("google-docs");
export const GoogleDriveLogo = createThirdPartyLogo("google-drive");
export const GoogleSheetsLogo = createThirdPartyLogo("google-sheets");
export const GoogleSlidesLogo = createThirdPartyLogo("google-slides");
export const HubspotLogo = createThirdPartyLogo("hubspot");
export const HuggingFaceLogo = createThirdPartyLogo("hugging-face");
export const IdentityNowLogo = createThirdPartyLogo("identity-now");
export const IntercomLogo = createThirdPartyLogo("intercom");
export const InvisionLogo = createThirdPartyLogo("invision");
export const JamLogo = createThirdPartyLogo("jam");
export const JenkinsLogo = createThirdPartyLogo("jenkins");
export const LaunchdarklyLogo = createThirdPartyLogo("launchdarkly");
export const LinearLogo = createThirdPartyLogo("linear");
export const LucidCoLogo = createThirdPartyLogo("lucid-co");
export const LucidchartLogo = createThirdPartyLogo("lucidchart");
export const MicrosoftLogo = createThirdPartyLogo("microsoft");
export const Microsoft365Logo = createThirdPartyLogo("microsoft-365");
export const MicrosoftAzureLogo = createThirdPartyLogo("microsoft-azure");
export const MicrosoftEntraIdLogo = createThirdPartyLogo("microsoft-entra-id");
export const MicrosoftExcelLogo = createThirdPartyLogo("microsoft-excel");
export const MicrosoftOnedriveLogo = createThirdPartyLogo("microsoft-onedrive");
export const MicrosoftOutlookLogo = createThirdPartyLogo("microsoft-outlook");
export const MicrosoftPowerPointLogo = createThirdPartyLogo("microsoft-power-point");
export const MicrosoftSharepointLogo = createThirdPartyLogo("microsoft-sharepoint");
export const MicrosoftTeamsLogo = createThirdPartyLogo("microsoft-teams");
export const MicrosoftWordLogo = createThirdPartyLogo("microsoft-word");
export const MiroLogo = createThirdPartyLogo("miro");
export const MondayLogo = createThirdPartyLogo("monday");
export const MuralLogo = createThirdPartyLogo("mural");
export const NeonLogo = createThirdPartyLogo("neon");
export const NewRelicLogo = createThirdPartyLogo("new-relic");
export const NotionLogo = createThirdPartyLogo("notion");
export const OctopusDeployLogo = createThirdPartyLogo("octopus-deploy");
export const OktaLogo = createThirdPartyLogo("okta");
export const OpenaiLogo = createThirdPartyLogo("openai");
export const OracleLogo = createThirdPartyLogo("oracle");
export const OutreachLogo = createThirdPartyLogo("outreach");
export const PagerdutyLogo = createThirdPartyLogo("pagerduty");
export const PaypalLogo = createThirdPartyLogo("paypal");
export const PipedriveLogo = createThirdPartyLogo("pipedrive");
export const PostmanLogo = createThirdPartyLogo("postman");
export const PowerbiLogo = createThirdPartyLogo("powerbi");
export const QuipLogo = createThirdPartyLogo("quip");
export const SalesforceLogo = createThirdPartyLogo("salesforce");
export const SapLogo = createThirdPartyLogo("sap");
export const ScriptrunnerLogo = createThirdPartyLogo("scriptrunner");
export const SentryLogo = createThirdPartyLogo("sentry");
export const ServicenowLogo = createThirdPartyLogo("servicenow");
export const ShopifyLogo = createThirdPartyLogo("shopify");
export const SimpplrLogo = createThirdPartyLogo("simpplr");
export const SlackLogo = createThirdPartyLogo("slack");
export const SmartsheetLogo = createThirdPartyLogo("smartsheet");
export const SnowflakeLogo = createThirdPartyLogo("snowflake");
export const SpinnakerLogo = createThirdPartyLogo("spinnaker");
export const SplunkLogo = createThirdPartyLogo("splunk");
export const SquareLogo = createThirdPartyLogo("square");
export const StackOverflowLogo = createThirdPartyLogo("stack-overflow");
export const StripeLogo = createThirdPartyLogo("stripe");
export const StychLogo = createThirdPartyLogo("stych");
export const TableauLogo = createThirdPartyLogo("tableau");
export const TempoTimesheetsLogo = createThirdPartyLogo("tempo-timesheets");
export const TodoistLogo = createThirdPartyLogo("todoist");
export const TwilioLogo = createThirdPartyLogo("twilio");
export const VercelLogo = createThirdPartyLogo("vercel");
export const WebexLogo = createThirdPartyLogo("webex");
export const WixLogo = createThirdPartyLogo("wix");
export const WorkatoLogo = createThirdPartyLogo("workato");
export const WorkdayLogo = createThirdPartyLogo("workday");
export const YoutubeLogo = createThirdPartyLogo("youtube");
export const ZapierLogo = createThirdPartyLogo("zapier");
export const ZendeskLogo = createThirdPartyLogo("zendesk");
export const ZeplinLogo = createThirdPartyLogo("zeplin");
export const ZiprecruiterLogo = createThirdPartyLogo("ziprecruiter");
export const ZoomLogo = createThirdPartyLogo("zoom");

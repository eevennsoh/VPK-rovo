"use client";

// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates the generated per-brand logo components alongside the base wrapper.

import { CUSTOM_LOGO_SIZES } from "@/components/ui/data/logo-data";
import {
	isLocalFallbackThirdPartyLogoName,
	THIRD_PARTY_LOGO_LABELS,
	THIRD_PARTY_LOGO_NAMES,
	thirdPartyLogoSrc,
	type ThirdPartyLogoName,
} from "@/components/ui/data/logo-third-party-data";
import {
	THIRD_PARTY_LOGO_ICONS,
	toThirdPartyLogoTileSize,
} from "@/components/ui/data/logo-third-party-icons";
import { CustomLogo, type CustomLogoProps, type LogoSize } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export { THIRD_PARTY_LOGO_NAMES, THIRD_PARTY_LOGO_LABELS };
export type { ThirdPartyLogoName };

export interface LogoThirdPartyProps extends Omit<CustomLogoProps, "src" | "svg" | "size"> {
	/** Third-party brand id from `THIRD_PARTY_LOGO_NAMES`. */
	name: ThirdPartyLogoName;
	/** Tile/logo size shared with `components/ui/tile`, including `xxsmall` (16x16). */
	size?: LogoSize;
	/**
	 * Render the bare brand glyph without the upstream package's white tile +
	 * 1px border. The package always wraps each mark in `<Tile hasBorder
	 * backgroundColor="white">` and exposes no prop to disable it, so we suppress
	 * the Tile chrome with `!important` overrides (its `@compiled` CSS is
	 * unlayered and beats layered Tailwind utilities). The glyph SVG is
	 * transparent-backed, so only the colored mark remains. Defaults to off.
	 */
	borderless?: boolean;
}

/**
 * Suppress the upstream `@atlaskit/tile` chrome (white `background-color:#fff` +
 * `border-width:1px`) wrapping a package mark, leaving only the transparent-backed
 * glyph. ADS `@compiled` styles are unlayered, so `!` (important) is required to win.
 */
const BORDERLESS_TILE_OVERRIDE = "[&>span]:bg-transparent! [&>span]:border-0!";

/**
 * Renders a third-party brand logo from the upstream `@atlassian/logo-third-party`
 * package (Atlassian Platform Labs), which draws each mark full-bleed inside an
 * `@atlaskit/tile` (white background, Tile border on) and is maintained upstream.
 *
 * Manifest-declared local fallback brands render from `public/3p/<name>/`
 * assets via `CustomLogo`. The accessible label defaults to the brand's display
 * name; an optional `wordmark` renders beside the mark as an inline lockup.
 */
export function LogoThirdParty({
	name,
	label,
	size,
	wordmark,
	className,
	borderless = false,
}: Readonly<LogoThirdPartyProps>) {
	const accessibleLabel = label ?? THIRD_PARTY_LOGO_LABELS[name];
	const Icon = THIRD_PARTY_LOGO_ICONS[name];

	if (!Icon) {
		// No package icon: only manifest-declared local fallback brands render
		// from `public/3p`. `borderless` targets the package Tile chrome, so it
		// has no effect on the CustomLogo fallback.
		return isLocalFallbackThirdPartyLogoName(name) ? (
			<CustomLogo
				className={className}
				label={accessibleLabel}
				size={size}
				src={thirdPartyLogoSrc(name)}
				wordmark={wordmark}
			/>
		) : null;
	}

	// The package tile already encapsulates the accessible label and sizing. When
	// `borderless`, wrap it so the Tile's white background + border are stripped.
	const resolvedSize = toThirdPartyLogoTileSize(size);
	const rawIcon = <Icon label={wordmark ? "" : accessibleLabel} size={resolvedSize} />;
	const icon = borderless ? (
		<span className={cn("inline-flex", BORDERLESS_TILE_OVERRIDE)}>{rawIcon}</span>
	) : (
		rawIcon
	);
	if (!wordmark && !className) {
		return icon;
	}

	// Lockup (icon + wordmark) or custom className — mirror CustomLogo's layout.
	const px = CUSTOM_LOGO_SIZES[resolvedSize] ?? CUSTOM_LOGO_SIZES.small;
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

/* -- Named compatibility exports --------------------------------- */

export function AdobeLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="adobe" {...props} />; }
export function AdobeSignLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="adobe-sign" {...props} />; }
export function AdobeXdLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="adobe-xd" {...props} />; }
export function AhaLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="aha" {...props} />; }
export function AirtableLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="airtable" {...props} />; }
export function AmazonLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="amazon" {...props} />; }
export function AmazonWebServicesAwsLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="amazon-web-services-aws" {...props} />; }
export function AmplitudeLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="amplitude" {...props} />; }
export function AnsibleLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="ansible" {...props} />; }
export function AsanaLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="asana" {...props} />; }
export function AzureDevopsLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="azure-devops" {...props} />; }
export function BoxLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="box" {...props} />; }
export function BrightspotLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="brightspot" {...props} />; }
export function CanvaLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="canva" {...props} />; }
export function ClaudeLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="claude" {...props} />; }
export function ClickupLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="clickup" {...props} />; }
export function CloudflareLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="cloudflare" {...props} />; }
export function CoupaLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="coupa" {...props} />; }
export function CursorLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="cursor" {...props} />; }
export function DaloopaLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="daloopa" {...props} />; }
export function DatabricksLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="databricks" {...props} />; }
export function DatadogLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="datadog" {...props} />; }
export function DockerLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="docker" {...props} />; }
export function DocumentumLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="documentum" {...props} />; }
export function DocusignLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="docusign" {...props} />; }
export function DovetailLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="dovetail" {...props} />; }
export function DropboxLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="dropbox" {...props} />; }
export function DynatraceLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="dynatrace" {...props} />; }
export function EgnyteLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="egnyte" {...props} />; }
export function EvernoteLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="evernote" {...props} />; }
export function FigmaLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="figma" {...props} />; }
export function FirefliesLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="fireflies" {...props} />; }
export function FreshserviceLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="freshservice" {...props} />; }
export function GammaLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="gamma" {...props} />; }
export function GenericMcpServerLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="generic-mcp-server" {...props} />; }
export function GiphyLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="giphy" {...props} />; }
export function GithubLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="github" {...props} />; }
export function GitlabLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="gitlab" {...props} />; }
export function GmailLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="gmail" {...props} />; }
export function GongLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="gong" {...props} />; }
export function GoogleCalendarLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="google-calendar" {...props} />; }
export function GoogleChromeLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="google-chrome" {...props} />; }
export function GoogleCloudPlatformLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="google-cloud-platform" {...props} />; }
export function GoogleDocsLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="google-docs" {...props} />; }
export function GoogleDriveLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="google-drive" {...props} />; }
export function GoogleSheetsLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="google-sheets" {...props} />; }
export function GoogleSlidesLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="google-slides" {...props} />; }
export function HubspotLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="hubspot" {...props} />; }
export function HuggingFaceLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="hugging-face" {...props} />; }
export function IdentityNowLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="identity-now" {...props} />; }
export function IntercomLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="intercom" {...props} />; }
export function InvisionLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="invision" {...props} />; }
export function JamLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="jam" {...props} />; }
export function JenkinsLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="jenkins" {...props} />; }
export function LaunchdarklyLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="launchdarkly" {...props} />; }
export function LinearLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="linear" {...props} />; }
export function LucidCoLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="lucid-co" {...props} />; }
export function LucidchartLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="lucidchart" {...props} />; }
export function MicrosoftLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft" {...props} />; }
export function Microsoft365Logo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-365" {...props} />; }
export function MicrosoftAzureLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-azure" {...props} />; }
export function MicrosoftEntraIdLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-entra-id" {...props} />; }
export function MicrosoftExcelLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-excel" {...props} />; }
export function MicrosoftOnedriveLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-onedrive" {...props} />; }
export function MicrosoftOutlookLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-outlook" {...props} />; }
export function MicrosoftPowerPointLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-power-point" {...props} />; }
export function MicrosoftSharepointLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-sharepoint" {...props} />; }
export function MicrosoftTeamsLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-teams" {...props} />; }
export function MicrosoftWordLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="microsoft-word" {...props} />; }
export function MiroLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="miro" {...props} />; }
export function MondayLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="monday" {...props} />; }
export function MuralLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="mural" {...props} />; }
export function NeonLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="neon" {...props} />; }
export function NewRelicLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="new-relic" {...props} />; }
export function NotionLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="notion" {...props} />; }
export function OctopusDeployLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="octopus-deploy" {...props} />; }
export function OktaLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="okta" {...props} />; }
export function OpenaiLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="openai" {...props} />; }
export function OracleLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="oracle" {...props} />; }
export function OutreachLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="outreach" {...props} />; }
export function PagerdutyLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="pagerduty" {...props} />; }
export function PaypalLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="paypal" {...props} />; }
export function PipedriveLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="pipedrive" {...props} />; }
export function PostmanLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="postman" {...props} />; }
export function PowerbiLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="powerbi" {...props} />; }
export function QuipLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="quip" {...props} />; }
export function SalesforceLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="salesforce" {...props} />; }
export function SapLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="sap" {...props} />; }
export function ScriptrunnerLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="scriptrunner" {...props} />; }
export function SentryLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="sentry" {...props} />; }
export function ServicenowLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="servicenow" {...props} />; }
export function ShopifyLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="shopify" {...props} />; }
export function SimpplrLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="simpplr" {...props} />; }
export function SlackLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="slack" {...props} />; }
export function SmartsheetLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="smartsheet" {...props} />; }
export function SnowflakeLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="snowflake" {...props} />; }
export function SpinnakerLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="spinnaker" {...props} />; }
export function SplunkLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="splunk" {...props} />; }
export function SquareLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="square" {...props} />; }
export function StackOverflowLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="stack-overflow" {...props} />; }
export function StripeLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="stripe" {...props} />; }
export function StychLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="stych" {...props} />; }
export function TableauLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="tableau" {...props} />; }
export function TempoTimesheetsLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="tempo-timesheets" {...props} />; }
export function TodoistLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="todoist" {...props} />; }
export function TwilioLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="twilio" {...props} />; }
export function VercelLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="vercel" {...props} />; }
export function WebexLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="webex" {...props} />; }
export function WixLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="wix" {...props} />; }
export function WorkatoLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="workato" {...props} />; }
export function WorkdayLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="workday" {...props} />; }
export function YoutubeLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="youtube" {...props} />; }
export function ZapierLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="zapier" {...props} />; }
export function ZendeskLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="zendesk" {...props} />; }
export function ZeplinLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="zeplin" {...props} />; }
export function ZiprecruiterLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="ziprecruiter" {...props} />; }
export function ZoomLogo(props: Readonly<Omit<LogoThirdPartyProps, "name">>) { return <LogoThirdParty name="zoom" {...props} />; }

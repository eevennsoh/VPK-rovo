import type { ComponentType } from "react";
import {
	AdminIcon as AtlaskitAdminIcon,
	AdminLogo as AtlaskitAdminLogo,
	AlignIcon as AtlaskitAlignIcon,
	AlignLogo as AtlaskitAlignLogo,
	AnalyticsIcon as AtlaskitAnalyticsIcon,
	AnalyticsLogo as AtlaskitAnalyticsLogo,
	AssetsIcon as AtlaskitAssetsIcon,
	AssetsLogo as AtlaskitAssetsLogo,
	AtlassianAdministrationIcon as AtlaskitAtlassianAdministrationIcon,
	AtlassianAdministrationLogo as AtlaskitAtlassianAdministrationLogo,
	AtlassianAnalyticsIcon as AtlaskitAtlassianAnalyticsIcon,
	AtlassianAnalyticsLogo as AtlaskitAtlassianAnalyticsLogo,
	AtlassianIcon as AtlaskitAtlassianIcon,
	AtlassianLogo as AtlaskitAtlassianLogo,
	BambooIcon as AtlaskitBambooIcon,
	BambooLogo as AtlaskitBambooLogo,
	BitbucketDataCenterIcon as AtlaskitBitbucketDataCenterIcon,
	BitbucketDataCenterLogo as AtlaskitBitbucketDataCenterLogo,
	BitbucketIcon as AtlaskitBitbucketIcon,
	BitbucketLogo as AtlaskitBitbucketLogo,
	ChatIcon as AtlaskitChatIcon,
	ChatLogo as AtlaskitChatLogo,
	CompassIcon as AtlaskitCompassIcon,
	CompassLogo as AtlaskitCompassLogo,
	ConfluenceDataCenterIcon as AtlaskitConfluenceDataCenterIcon,
	ConfluenceDataCenterLogo as AtlaskitConfluenceDataCenterLogo,
	ConfluenceIcon as AtlaskitConfluenceIcon,
	ConfluenceLogo as AtlaskitConfluenceLogo,
	CrowdIcon as AtlaskitCrowdIcon,
	CrowdLogo as AtlaskitCrowdLogo,
	CustomerServiceManagementIcon as AtlaskitCustomerServiceManagementIcon,
	CustomerServiceManagementLogo as AtlaskitCustomerServiceManagementLogo,
	DxIcon as AtlaskitDxIcon,
	FeedbackIcon as AtlaskitFeedbackIcon,
	FeedbackLogo as AtlaskitFeedbackLogo,
	FocusIcon as AtlaskitFocusIcon,
	FocusLogo as AtlaskitFocusLogo,
	GoalsIcon as AtlaskitGoalsIcon,
	GoalsLogo as AtlaskitGoalsLogo,
	GuardIcon as AtlaskitGuardIcon,
	GuardLogo as AtlaskitGuardLogo,
	HomeIcon as AtlaskitHomeIcon,
	HomeLogo as AtlaskitHomeLogo,
	HubIcon as AtlaskitHubIcon,
	HubLogo as AtlaskitHubLogo,
	JiraAlignIcon as AtlaskitJiraAlignIcon,
	JiraAlignLogo as AtlaskitJiraAlignLogo,
	JiraDataCenterIcon as AtlaskitJiraDataCenterIcon,
	JiraDataCenterLogo as AtlaskitJiraDataCenterLogo,
	JiraIcon as AtlaskitJiraIcon,
	JiraLogo as AtlaskitJiraLogo,
	JiraProductDiscoveryIcon as AtlaskitJiraProductDiscoveryIcon,
	JiraProductDiscoveryLogo as AtlaskitJiraProductDiscoveryLogo,
	JiraServiceManagementDataCenterIcon as AtlaskitJiraServiceManagementDataCenterIcon,
	JiraServiceManagementDataCenterLogo as AtlaskitJiraServiceManagementDataCenterLogo,
	JiraServiceManagementIcon as AtlaskitJiraServiceManagementIcon,
	JiraServiceManagementLogo as AtlaskitJiraServiceManagementLogo,
	LoomAttributionIcon as AtlaskitLoomAttributionIcon,
	LoomAttributionLogo as AtlaskitLoomAttributionLogo,
	LoomIcon as AtlaskitLoomIcon,
	LoomLogo as AtlaskitLoomLogo,
	OpsgenieIcon as AtlaskitOpsgenieIcon,
	OpsgenieLogo as AtlaskitOpsgenieLogo,
	ProjectsIcon as AtlaskitProjectsIcon,
	ProjectsLogo as AtlaskitProjectsLogo,
	RovoDevAgentIcon as AtlaskitRovoDevAgentIcon,
	RovoDevAgentLogo as AtlaskitRovoDevAgentLogo,
	RovoDevIcon as AtlaskitRovoDevIcon,
	RovoDevLogo as AtlaskitRovoDevLogo,
	RovoIcon as AtlaskitRovoIcon,
	RovoLogo as AtlaskitRovoLogo,
	SearchIcon as AtlaskitSearchIcon,
	SearchLogo as AtlaskitSearchLogo,
	StatuspageIcon as AtlaskitStatuspageIcon,
	StatuspageLogo as AtlaskitStatuspageLogo,
	StudioIcon as AtlaskitStudioIcon,
	StudioLogo as AtlaskitStudioLogo,
	TalentIcon as AtlaskitTalentIcon,
	TalentLogo as AtlaskitTalentLogo,
	TeamsIcon as AtlaskitTeamsIcon,
	TeamsLogo as AtlaskitTeamsLogo,
	TrelloIcon as AtlaskitTrelloIcon,
	TrelloLogo as AtlaskitTrelloLogo,
	type LogoProps as AtlaskitLogoProps,
} from "@atlaskit/logo";

export type AtlassianLogoName =
	| "admin"
	| "align"
	| "analytics"
	| "assets"
	| "atlassian"
	| "atlassian-administration"
	| "atlassian-analytics"
	| "bamboo"
	| "bitbucket"
	| "bitbucket-data-center"
	| "chat"
	| "compass"
	| "confluence"
	| "confluence-data-center"
	| "crowd"
	| "customer-service-management"
	| "dx"
	| "feedback"
	| "focus"
	| "goals"
	| "guard"
	| "home"
	| "hub"
	| "jira"
	| "jira-align"
	| "jira-data-center"
	| "jira-product-discovery"
	| "jira-service-management"
	| "jira-service-management-data-center"
	| "loom"
	| "loom-attribution"
	| "opsgenie"
	| "projects"
	| "rovo"
	| "rovo-dev"
	| "rovo-dev-agent"
	| "search"
	| "statuspage"
	| "studio"
	| "talent"
	| "teams"
	| "trello";

type AtlassianLogoComponentProps = AtlaskitLogoProps & {
	shouldUseHexLogo?: boolean;
};

export const LOGO_ICON_COMPONENTS: Record<AtlassianLogoName, ComponentType<AtlassianLogoComponentProps>> = {
	admin: AtlaskitAdminIcon,
	align: AtlaskitAlignIcon,
	analytics: AtlaskitAnalyticsIcon,
	assets: AtlaskitAssetsIcon,
	atlassian: AtlaskitAtlassianIcon,
	"atlassian-administration": AtlaskitAtlassianAdministrationIcon,
	"atlassian-analytics": AtlaskitAtlassianAnalyticsIcon,
	bamboo: AtlaskitBambooIcon,
	bitbucket: AtlaskitBitbucketIcon,
	"bitbucket-data-center": AtlaskitBitbucketDataCenterIcon,
	chat: AtlaskitChatIcon,
	compass: AtlaskitCompassIcon,
	confluence: AtlaskitConfluenceIcon,
	"confluence-data-center": AtlaskitConfluenceDataCenterIcon,
	crowd: AtlaskitCrowdIcon,
	"customer-service-management": AtlaskitCustomerServiceManagementIcon,
	dx: AtlaskitDxIcon,
	feedback: AtlaskitFeedbackIcon,
	focus: AtlaskitFocusIcon,
	goals: AtlaskitGoalsIcon,
	guard: AtlaskitGuardIcon,
	home: AtlaskitHomeIcon,
	hub: AtlaskitHubIcon,
	jira: AtlaskitJiraIcon,
	"jira-align": AtlaskitJiraAlignIcon,
	"jira-data-center": AtlaskitJiraDataCenterIcon,
	"jira-product-discovery": AtlaskitJiraProductDiscoveryIcon,
	"jira-service-management": AtlaskitJiraServiceManagementIcon,
	"jira-service-management-data-center": AtlaskitJiraServiceManagementDataCenterIcon,
	loom: AtlaskitLoomIcon,
	"loom-attribution": AtlaskitLoomAttributionIcon,
	opsgenie: AtlaskitOpsgenieIcon,
	projects: AtlaskitProjectsIcon,
	rovo: AtlaskitRovoIcon,
	"rovo-dev": AtlaskitRovoDevIcon,
	"rovo-dev-agent": AtlaskitRovoDevAgentIcon,
	search: AtlaskitSearchIcon,
	statuspage: AtlaskitStatuspageIcon,
	studio: AtlaskitStudioIcon,
	talent: AtlaskitTalentIcon,
	teams: AtlaskitTeamsIcon,
	trello: AtlaskitTrelloIcon,
};

export const LOGO_LOCKUP_COMPONENTS: Record<AtlassianLogoName, ComponentType<AtlassianLogoComponentProps>> = {
	admin: AtlaskitAdminLogo,
	align: AtlaskitAlignLogo,
	analytics: AtlaskitAnalyticsLogo,
	assets: AtlaskitAssetsLogo,
	atlassian: AtlaskitAtlassianLogo,
	"atlassian-administration": AtlaskitAtlassianAdministrationLogo,
	"atlassian-analytics": AtlaskitAtlassianAnalyticsLogo,
	bamboo: AtlaskitBambooLogo,
	bitbucket: AtlaskitBitbucketLogo,
	"bitbucket-data-center": AtlaskitBitbucketDataCenterLogo,
	chat: AtlaskitChatLogo,
	compass: AtlaskitCompassLogo,
	confluence: AtlaskitConfluenceLogo,
	"confluence-data-center": AtlaskitConfluenceDataCenterLogo,
	crowd: AtlaskitCrowdLogo,
	"customer-service-management": AtlaskitCustomerServiceManagementLogo,
	// Dx ships an icon glyph only — no wordmark lockup exists, so reuse the icon.
	dx: AtlaskitDxIcon,
	feedback: AtlaskitFeedbackLogo,
	focus: AtlaskitFocusLogo,
	goals: AtlaskitGoalsLogo,
	guard: AtlaskitGuardLogo,
	home: AtlaskitHomeLogo,
	hub: AtlaskitHubLogo,
	jira: AtlaskitJiraLogo,
	"jira-align": AtlaskitJiraAlignLogo,
	"jira-data-center": AtlaskitJiraDataCenterLogo,
	"jira-product-discovery": AtlaskitJiraProductDiscoveryLogo,
	"jira-service-management": AtlaskitJiraServiceManagementLogo,
	"jira-service-management-data-center": AtlaskitJiraServiceManagementDataCenterLogo,
	loom: AtlaskitLoomLogo,
	"loom-attribution": AtlaskitLoomAttributionLogo,
	opsgenie: AtlaskitOpsgenieLogo,
	projects: AtlaskitProjectsLogo,
	rovo: AtlaskitRovoLogo,
	"rovo-dev": AtlaskitRovoDevLogo,
	"rovo-dev-agent": AtlaskitRovoDevAgentLogo,
	search: AtlaskitSearchLogo,
	statuspage: AtlaskitStatuspageLogo,
	studio: AtlaskitStudioLogo,
	talent: AtlaskitTalentLogo,
	teams: AtlaskitTeamsLogo,
	trello: AtlaskitTrelloLogo,
};

export const CUSTOM_LOGO_SIZES: Record<string, number> = {
	xxsmall: 16,
	xsmall: 20,
	small: 24,
	medium: 32,
	large: 40,
	xlarge: 48,
};

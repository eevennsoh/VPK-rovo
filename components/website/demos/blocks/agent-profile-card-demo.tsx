import { AgentProfileCard } from "@/components/blocks/agent-profile-card";

export default function AgentProfileCardDemo(): React.ReactElement {
	return (
		<div className="flex w-full flex-wrap items-start justify-center gap-6 p-6">
			{/* First-party company — Atlassian glyph on the blue company badge, verified. */}
			<AgentProfileCard
				attributionKind="company"
				avatarSrc="/avatar-agent/teamwork-agents/blocker-checker.svg"
				description="Proactively assists by automatically suggesting subtasks when you start adding one and providing comment summaries."
				name="Task Improver"
				partnerName="Atlassian"
			/>

			{/* Third-party company — partner app logo tile on the company badge, verified. */}
			<AgentProfileCard
				attributionKind="company"
				avatarSrc="/avatar-agent/product-agents/feedback-analyzer.svg"
				description="Turns product feedback into Figma-ready briefs and keeps design specs in sync with the latest research."
				name="Design Researcher"
				partnerLogoSrc="/3p/figma/24.svg"
				partnerName="Figma"
			/>

			{/* Person — round headshot badge, unverified. */}
			<AgentProfileCard
				attributionKind="person"
				avatarSrc="/avatar-agent/dev-agents/code-planner.svg"
				description="Summarizes async standups, flags blockers, and drafts the daily digest for your squad."
				name="Standup Summarizer"
				partnerLogoSrc="/avatar-human/andrea-wilson.png"
				partnerName="Andrea Wilson"
				verified={false}
			/>

			{/* Team — square project tile badge, unverified. */}
			<AgentProfileCard
				attributionKind="team"
				avatarSrc="/avatar-agent/service-agents/service-triage.svg"
				description="Triages incoming incidents, pages the on-call owner, and assembles the response timeline."
				name="Incident Responder"
				partnerLogoSrc="/avatar-project/rocket.svg"
				partnerName="Platform Team"
				verified={false}
			/>
		</div>
	);
}

/** Chat variant — the default footer with the AI input affordance for talking to the agent. */
export function AgentProfileCardChatExample(): React.ReactElement {
	return (
		<div className="flex w-full justify-center p-6">
			<AgentProfileCard onInputAction={() => {}} onVoiceInput={() => {}} variant="chat" />
		</div>
	);
}

/** Preview variant — the footer swaps to a single "View agent" call-to-action button. */
export function AgentProfileCardPreviewExample(): React.ReactElement {
	return (
		<div className="flex w-full justify-center p-6">
			<AgentProfileCard onPreviewAction={() => {}} variant="preview" />
		</div>
	);
}

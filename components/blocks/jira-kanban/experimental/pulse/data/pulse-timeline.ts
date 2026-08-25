import type {
	PulseContribution,
	PulseLooseWork,
	PulseMember,
	PulseSnapshot,
	PulseTimeline,
	PulseWorkItem,
} from "../types";

/**
 * Pulse fixture — one sprint week of the `PAY` Payments SDK v2 migration.
 *
 * Monday 17 August through Friday 21 August 2026. Seven snapshots, each a real
 * decision point rather than a status update. Timestamps are deliberately
 * uneven so the scrubber's proportional tick spacing reads as elapsed time.
 *
 * All date and time strings are pre-formatted here on purpose: formatting at
 * render time drifts between server and client.
 */

/* ------------------------------------------------------------------ */
/* Avatars — every path verified against `public/`.                     */
/* ------------------------------------------------------------------ */

const AVATAR = {
	maya: "/avatar-user/chloe-lee/color/asow-dev-lime.png",
	jordan: "/avatar-user/issac-varghese/color/asow-dev-lime.png",
	priya: "/avatar-user/ting-chen/color/asow-teamwork-blue.png",
	diego: "/avatar-user/dev-rana/color/asow-product-purple.png",
	reviewAgent: "/avatar-agent/dev-agents/code-reviewer.svg",
	testAgent: "/avatar-agent/dev-agents/unit-test-creator.svg",
	releaseAgent: "/avatar-agent/dev-agents/deployment-summarizer.svg",
} as const;

/* ------------------------------------------------------------------ */
/* Members — four humans across four time zones, three agents.          */
/* ------------------------------------------------------------------ */

const MEMBERS: readonly PulseMember[] = [
	{ id: "maya", name: "Maya Ferreira", role: "Staff engineer", kind: "human", avatarSrc: AVATAR.maya, timezone: "Sydney" },
	{ id: "jordan", name: "Jordan Okafor", role: "Senior engineer", kind: "human", avatarSrc: AVATAR.jordan, timezone: "Austin" },
	{ id: "priya", name: "Priya Raman", role: "Engineering manager", kind: "human", avatarSrc: AVATAR.priya, timezone: "London" },
	{ id: "diego", name: "Diego Santos", role: "Product designer", kind: "human", avatarSrc: AVATAR.diego, timezone: "Lisbon" },
	{ id: "review-agent", name: "Review Agent", role: "Reviews every pull request", kind: "agent", avatarSrc: AVATAR.reviewAgent },
	{ id: "test-agent", name: "Test Author Agent", role: "Writes and repairs tests", kind: "agent", avatarSrc: AVATAR.testAgent },
	{ id: "release-agent", name: "Release Captain Agent", role: "Owns the flag and the rollout", kind: "agent", avatarSrc: AVATAR.releaseAgent },
];

/* ------------------------------------------------------------------ */
/* Work items — the part of the week that made it onto the board.       */
/* Titles must wrap to two real lines at the Pulse rail's 320px card    */
/* width. Keep meaning; do not force wrap with <br>.                    */
/* ------------------------------------------------------------------ */

const WORK_ITEMS: readonly PulseWorkItem[] = [
	{
		key: "PAY-101",
		summary: "Inventory every v1 call site across services and name an owner for each",
		tags: [{ text: "discovery", color: "purple" }],
		priority: "medium",
		status: "Done",
		memberIds: ["maya", "jordan", "priya"],
		assigneeId: "jordan",
		assigneeAvatarSrc: AVATAR.jordan,
		assigneeName: "Jordan Okafor",
	},
	{
		key: "PAY-102",
		summary: "Spike: can LegacyGatewayAdapter be deleted outright instead of ported?",
		tags: [{ text: "spike", color: "teal" }, { text: "sdk", color: "blue" }],
		priority: "major",
		status: "Done",
		memberIds: ["maya", "review-agent"],
		assigneeId: "maya",
		assigneeAvatarSrc: AVATAR.maya,
		assigneeName: "Maya Ferreira",
	},
	{
		key: "PAY-104",
		summary: "Port createPaymentIntent from the adapter onto the v2 client",
		tags: [{ text: "checkout-web", color: "blue" }],
		priority: "major",
		status: "Done",
		memberIds: ["jordan", "review-agent"],
		assigneeId: "jordan",
		assigneeAvatarSrc: AVATAR.jordan,
		assigneeName: "Jordan Okafor",
	},
	{
		key: "PAY-105",
		summary: "Port confirmPaymentIntent and the full 3-D Secure challenge flow",
		tags: [{ text: "checkout-web", color: "blue" }, { text: "3ds", color: "orange" }],
		priority: "major",
		status: "In progress",
		memberIds: ["jordan", "maya", "test-agent"],
		assigneeId: "jordan",
		assigneeAvatarSrc: AVATAR.jordan,
		assigneeName: "Jordan Okafor",
	},
	{
		key: "PAY-107",
		summary: "Move retry and backoff out of the adapter and into payments-api",
		tags: [{ text: "payments-api", color: "lime" }],
		priority: "major",
		status: "In review",
		memberIds: ["maya", "review-agent"],
		assigneeId: "maya",
		assigneeAvatarSrc: AVATAR.maya,
		assigneeName: "Maya Ferreira",
	},
	{
		key: "PAY-109",
		summary: "Regenerate typed webhook payloads from the published v2 OpenAPI spec",
		tags: [{ text: "codegen", color: "gray" }],
		priority: "medium",
		status: "Done",
		memberIds: ["test-agent", "maya"],
		assigneeId: "test-agent",
		assigneeAvatarSrc: AVATAR.testAgent,
		assigneeName: "Test Author Agent",
	},
	{
		key: "PAY-112",
		summary: "sandbox-eu rejects v2 idempotency keys that run longer than 64 characters",
		tags: [{ text: "regression", color: "red" }, { text: "3ds", color: "orange" }],
		priority: "major",
		status: "Blocked",
		memberIds: ["jordan", "priya", "review-agent"],
		assigneeId: "jordan",
		assigneeAvatarSrc: AVATAR.jordan,
		assigneeName: "Jordan Okafor",
	},
	{
		key: "PAY-113",
		summary: "Write contract tests covering the 3-D Secure challenge path",
		tags: [{ text: "tests", color: "green" }, { text: "3ds", color: "orange" }],
		priority: "medium",
		status: "Done",
		memberIds: ["test-agent", "review-agent"],
		assigneeId: "test-agent",
		assigneeAvatarSrc: AVATAR.testAgent,
		assigneeName: "Test Author Agent",
	},
	{
		key: "PAY-115",
		summary: "Migrate ledger-sync reconciliation over to v2 settlement events",
		tags: [{ text: "ledger-sync", color: "magenta" }],
		priority: "medium",
		status: "In progress",
		memberIds: ["maya", "release-agent"],
		assigneeId: "maya",
		assigneeAvatarSrc: AVATAR.maya,
		assigneeName: "Maya Ferreira",
	},
	{
		key: "PAY-118",
		summary: "Design and build the saved wallet UI for v2 payment methods",
		tags: [{ text: "design", color: "purple" }, { text: "descoped", color: "gray" }],
		priority: "minor",
		status: "Cut",
		memberIds: ["diego", "priya"],
		assigneeId: "diego",
		assigneeAvatarSrc: AVATAR.diego,
		assigneeName: "Diego Santos",
	},
	{
		key: "PAY-119",
		summary: "Run a full rollback rehearsal against payments-api staging",
		tags: [{ text: "release", color: "yellow" }],
		priority: "major",
		status: "Done",
		memberIds: ["priya", "release-agent", "maya"],
		assigneeId: "release-agent",
		assigneeAvatarSrc: AVATAR.releaseAgent,
		assigneeName: "Release Captain Agent",
	},
	{
		key: "PAY-121",
		summary: "payments_sdk_v2_rollout: targeting rules plus a per-account kill switch",
		tags: [{ text: "release", color: "yellow" }, { text: "flag", color: "teal" }],
		priority: "major",
		status: "In review",
		memberIds: ["release-agent", "priya"],
		assigneeId: "release-agent",
		assigneeAvatarSrc: AVATAR.releaseAgent,
		assigneeName: "Release Captain Agent",
	},
	{
		key: "PAY-123",
		summary: "Map the v1 error taxonomy onto all eleven v2 decline reasons",
		tags: [{ text: "content", color: "purple" }],
		priority: "medium",
		status: "In progress",
		memberIds: ["diego", "jordan"],
		assigneeId: "diego",
		assigneeAvatarSrc: AVATAR.diego,
		assigneeName: "Diego Santos",
	},
	{
		key: "PAY-126",
		summary: "Delete LegacyGatewayAdapter and the 4,180 lines sitting behind it",
		tags: [{ text: "sdk", color: "blue" }, { text: "cleanup", color: "green" }],
		priority: "major",
		status: "In review",
		memberIds: ["maya", "review-agent"],
		assigneeId: "maya",
		assigneeAvatarSrc: AVATAR.maya,
		assigneeName: "Maya Ferreira",
	},
	{
		key: "PAY-128",
		summary: "Write the SDK version at settlement time rather than at intent time",
		tags: [{ text: "ledger-sync", color: "magenta" }],
		priority: "medium",
		status: "To do",
		memberIds: ["release-agent", "maya"],
		assigneeId: "release-agent",
		assigneeAvatarSrc: AVATAR.releaseAgent,
		assigneeName: "Release Captain Agent",
	},
	{
		key: "PAY-130",
		summary: "Localise the eleven v2 decline strings into all nine languages",
		tags: [{ text: "content", color: "purple" }, { text: "blocker", color: "red" }],
		priority: "major",
		status: "To do",
		memberIds: ["diego", "priya"],
		assigneeId: "diego",
		assigneeAvatarSrc: AVATAR.diego,
		assigneeName: "Diego Santos",
	},
];

/* ------------------------------------------------------------------ */
/* Uncaptured work — real output that never became a work item.         */
/* ------------------------------------------------------------------ */

/**
 * Titles must wrap to two visible lines at the 300px uncaptured card
 * (276px after `p-3`). Lengthen copy naturally; do not pad with empty
 * min-height, `<br>`, or zero-width fillers.
 */
const LOOSE_WORK: readonly PulseLooseWork[] = [
	{
		id: "lw-scope-thread",
		title: "The adapter keep-or-delete argument still lives in Slack",
		source: "Slack",
		sourceTitle: "#payments-migration",
		detail: "The decision itself is not written down",
		memberIds: ["priya", "maya", "jordan"],
	},
	{
		id: "lw-adapter-branch",
		title: "Proof branch deleting the whole adapter, still unlinked",
		source: "GitHub",
		sourceTitle: "PR #1847",
		detail: "PR #1847 · 41 files, 4,180 deletions · no linked work item",
		memberIds: ["maya"],
	},
	{
		id: "lw-loom-spike",
		title: "Walkthrough of what the spike actually found, shared in a DM",
		source: "Loom",
		sourceTitle: "Spike walkthrough",
		detail: "9 min · shared in a DM, never attached to the epic",
		memberIds: ["maya"],
	},
	{
		id: "lw-sandbox-triage",
		title: "Root cause of the sandbox 401s still sits in the thread",
		source: "Slack",
		sourceTitle: "Sandbox 401 thread",
		detail: "Found in thread at 10:52 · PAY-112 still reads “investigating”",
		memberIds: ["jordan", "review-agent"],
	},
	{
		id: "lw-oncall-note",
		title: "On-call handover note on key truncation, in a personal space",
		source: "Confluence",
		sourceTitle: "On-call handover note",
		detail: "Written at 03:10 Tuesday · sits in a personal space",
		memberIds: ["jordan"],
	},
	{
		id: "lw-night-prs",
		title: "Six agent pull requests merged overnight, none of them linked",
		source: "GitHub",
		sourceTitle: "PRs #1862–#1867",
		detail: "#1862–#1867 · all green, none linked to a work item",
		memberIds: ["review-agent", "test-agent", "release-agent"],
	},
	{
		id: "lw-flag-edits",
		title: "Kill switch built straight in LaunchDarkly, with no Jira record",
		source: "LaunchDarkly",
		sourceTitle: "Kill switch targeting rules",
		detail: "3 targeting rules changed at 01:14 · no change record in Jira",
		memberIds: ["release-agent"],
	},
	{
		id: "lw-figma-parked",
		title: "Wallet frames marked “parked, needs card artwork” in a comment",
		source: "Figma",
		sourceTitle: "Wallet frames comment",
		detail: "The reason we cut it lives in a comment thread",
		memberIds: ["diego"],
	},
	{
		id: "lw-copy-doc",
		title: "Eleven decline strings, already read by legal, still unattached",
		source: "Google Docs",
		sourceTitle: "Decline strings document",
		detail: "Approved copy with no work item and no localisation ticket",
		memberIds: ["diego", "priya"],
	},
	{
		id: "lw-rehearsal-draft",
		title: "Rollback rehearsal run log, still a draft on Confluence",
		source: "Confluence",
		sourceTitle: "Rollback rehearsal log",
		detail: "Draft page, four minutes eleven seconds recorded · not linked to the epic",
		memberIds: ["priya", "release-agent"],
	},
	{
		id: "lw-killswitch-loom",
		title: "How to flip the kill switch at 3am, recorded for the pager",
		source: "Loom",
		sourceTitle: "Kill switch walkthrough",
		detail: "6 min recorded at 22:00 Sydney · only the two reviewers have the link",
		memberIds: ["maya"],
	},
	{
		id: "lw-p95-screenshot",
		title: "v2 is 42 ms faster at p95, and the graph lives only in Slack",
		source: "Slack",
		sourceTitle: "#payments-migration",
		detail: "A screenshot in #payments-migration · changes the rollout argument, lives nowhere",
		memberIds: ["maya"],
	},
];

/* ------------------------------------------------------------------ */
/* Snapshots — the decision points, oldest first.                       */
/* ------------------------------------------------------------------ */

const S1_CONTRIBUTIONS: readonly PulseContribution[] = [
	{
		memberId: "maya", workItemKeys: ["PAY-101", "PAY-102"], artifactIds: ["a1-inventory", "a1-thread"], looseWorkIds: ["lw-scope-thread"],
		summary: "Brought the call-site inventory in over the weekend and argued the delete case on Monday morning. Took the adapter lane on the condition that PAY-102 proves the case before anyone ports a single call site.",
	},
	{
		memberId: "jordan", workItemKeys: ["PAY-101", "PAY-104"], artifactIds: ["a1-inventory"], looseWorkIds: ["lw-scope-thread"],
		summary: "Read the inventory back and pushed the count from 47 to 61 by including the two test harnesses everyone forgets. Owns checkout-web for the week.",
	},
	{
		memberId: "priya", workItemKeys: ["PAY-101", "PAY-121"], artifactIds: ["a1-scope", "a1-lanes", "a1-thread"], looseWorkIds: ["lw-scope-thread"],
		summary: "Ran the scope call, cut the backlog to fourteen items, and made the one decision that shapes the week. Has not written that decision anywhere a new joiner would find it.",
	},
	{
		memberId: "diego", workItemKeys: ["PAY-118"], artifactIds: ["a1-scope"], looseWorkIds: [],
		summary: "Asked what happens to saved cards under v2 and got an answer nobody liked. Parked the question until the payment-method shape is real rather than designing against a guess.",
	},
	{
		memberId: "review-agent", workItemKeys: ["PAY-102", "PAY-104"], artifactIds: ["a1-lanes"], looseWorkIds: [],
		summary: "Scoped to the epic rather than a lane, so every pull request gets the same reviewer whether a human or an agent opened it. No reviews yet: nothing has been pushed.",
	},
	{
		memberId: "test-agent", workItemKeys: ["PAY-113", "PAY-109"], artifactIds: ["a1-lanes"], looseWorkIds: [],
		summary: "Claimed the 3-D Secure contract tests and spent the window auditing the v1 fixtures. Reports 38 recorded challenge responses still usable and 12 too stale to trust.",
	},
	{
		memberId: "release-agent", workItemKeys: ["PAY-121"], artifactIds: ["a1-lanes"], looseWorkIds: [],
		summary: "Created payments_sdk_v2_rollout in an off state with no targeting rules, and flagged that the kill switch does not exist yet and will be needed before the first port lands.",
	},
];

const S2_CONTRIBUTIONS: readonly PulseContribution[] = [
	{
		memberId: "maya", workItemKeys: ["PAY-102", "PAY-107", "PAY-126"], artifactIds: ["a2-spike-pr", "a2-loom", "a2-findings"], looseWorkIds: ["lw-adapter-branch", "lw-loom-spike"],
		summary: "Closed the spike in nine hours with a yes and one asterisk. Proved the delete by pushing it: 41 files, all deletions, checkout-web compiling against v2 with the challenge handler stubbed.",
	},
	{
		memberId: "jordan", workItemKeys: ["PAY-104", "PAY-105"], artifactIds: ["a2-callsites"], looseWorkIds: [],
		summary: "Eighteen of 61 call sites converted. The mechanical ones took twenty minutes; use-payment-intent.ts took the rest of the day because the hook was retrying on top of the adapter's retry.",
	},
	{
		memberId: "review-agent", workItemKeys: ["PAY-102", "PAY-104"], artifactIds: ["a2-review", "a2-callsites"], looseWorkIds: [],
		summary: "Reviewed both pull requests inside four minutes of each push. Approved the spike branch as a proof, not a merge candidate. Left one unresolved comment on #1851: idempotency key length is not bounded and the upstream limit is unknown.",
	},
	{
		memberId: "test-agent", workItemKeys: ["PAY-109", "PAY-113"], artifactIds: ["a2-findings"], looseWorkIds: [],
		summary: "Regenerated the webhook payload types from the v2 OpenAPI spec and found four fields that changed nullability without a version bump. Filed them as review notes rather than guessing at intent.",
	},
];

const S3_CONTRIBUTIONS: readonly PulseContribution[] = [
	{
		memberId: "jordan", workItemKeys: ["PAY-105", "PAY-112"], artifactIds: ["a3-sentry", "a3-triage", "a3-handover"], looseWorkIds: ["lw-sandbox-triage", "lw-oncall-note"],
		summary: "Found the failure at 10:20 and the cause by 10:52: merchant-scoped keys are 73 characters and sandbox-eu truncates at 64 instead of erroring. Wrote the handover note at 03:10 and it is still sitting in his personal space.",
	},
	{
		memberId: "priya", workItemKeys: ["PAY-112", "PAY-105"], artifactIds: ["a3-triage"], looseWorkIds: ["lw-sandbox-triage"],
		summary: "Moved PAY-112 to blocked rather than letting it look like progress, and asked payments platform for the retention window on sandbox keys. Nothing downstream moves until that answer arrives.",
	},
	{
		memberId: "maya", workItemKeys: ["PAY-107"], artifactIds: ["a3-handover"], looseWorkIds: [],
		summary: "Woke up to the thread and pointed out the version that matters: if a truncated key is ever replayed against a live account, someone gets charged twice. Reshaped PAY-107 to reject over-length keys loudly instead of trimming them.",
	},
	{
		memberId: "review-agent", workItemKeys: ["PAY-112", "PAY-104"], artifactIds: ["a3-review", "a3-sentry"], looseWorkIds: ["lw-sandbox-triage"],
		summary: "Had already flagged this. The comment on #1851 reading “length not bounded, upstream limit unknown” predates the sandbox failure by nineteen hours and was waved through on green local tests.",
	},
];

const S4_CONTRIBUTIONS: readonly PulseContribution[] = [
	{
		memberId: "review-agent", workItemKeys: ["PAY-105", "PAY-107", "PAY-113"], artifactIds: ["a4-prs", "a4-rejects"], looseWorkIds: ["lw-night-prs"],
		summary: "Reviewed all six pull requests, approved four, returned two. One for an error swallowed in the challenge retry path, one because the idempotency fix trimmed over-length keys rather than rejecting them, which is the failure mode Maya named on Tuesday.",
	},
	{
		memberId: "test-agent", workItemKeys: ["PAY-113", "PAY-109"], artifactIds: ["a4-tests", "a4-prs"], looseWorkIds: ["lw-night-prs"],
		summary: "Wrote the 3-D Secure contract suite that PAY-113 has been carrying since March: 214 assertions against recorded fixtures, plus a harness that replays the challenge webhook so the tests never touch the sandbox.",
	},
	{
		memberId: "release-agent", workItemKeys: ["PAY-121", "PAY-115"], artifactIds: ["a4-killswitch", "a4-recap"], looseWorkIds: ["lw-flag-edits", "lw-night-prs"],
		summary: "Read the truncation risk out of PAY-112 and built the per-account kill switch before anything else, so the flag can be pulled for one merchant instead of all of them. That is not what the item asked for.",
	},
];

const S5_CONTRIBUTIONS: readonly PulseContribution[] = [
	{
		memberId: "diego", workItemKeys: ["PAY-118", "PAY-123", "PAY-130"], artifactIds: ["a5-figma", "a5-copy", "a5-review-notes"], looseWorkIds: ["lw-figma-parked", "lw-copy-doc"],
		summary: "Walked the wallet flow, made the case for cutting it himself, and spent the afternoon on the part that survives: eleven decline reasons mapped to copy that tells the customer what to do next.",
	},
	{
		memberId: "priya", workItemKeys: ["PAY-118", "PAY-115", "PAY-130"], artifactIds: ["a5-review-notes"], looseWorkIds: ["lw-copy-doc"],
		summary: "Treated the cut as a scope change rather than a failure, pulled PAY-115 forward to fill the empty lane, and has not yet created the localisation item that the approved copy now needs.",
	},
	{
		memberId: "maya", workItemKeys: ["PAY-115", "PAY-126"], artifactIds: ["a5-latency"], looseWorkIds: [],
		summary: "Measured the saved-card round trip on the staging fixture set at 180 to 240 ms, which is what ended the wallet argument. Said plainly that ledger-sync is not ready for settlement events and took PAY-115 anyway.",
	},
	{
		memberId: "test-agent", workItemKeys: ["PAY-123", "PAY-113"], artifactIds: ["a5-copy"], looseWorkIds: [],
		summary: "Generated assertion coverage for all eleven decline codes against the v2 error taxonomy and reported three that no fixture currently exercises: expired_card_network, issuer_unavailable and risk_hold.",
	},
];

const S6_CONTRIBUTIONS: readonly PulseContribution[] = [
	{
		memberId: "priya", workItemKeys: ["PAY-119", "PAY-121"], artifactIds: ["a6-rehearsal", "a6-plan"], looseWorkIds: ["lw-rehearsal-draft"],
		summary: "Ran the rehearsal properly instead of on paper: 200 synthetic payments, flag pulled mid-flight, ledger reconciled. Her run log is a draft page nobody has linked to the epic.",
	},
	{
		memberId: "maya", workItemKeys: ["PAY-115", "PAY-128", "PAY-126"], artifactIds: ["a6-loom", "a6-ledger"], looseWorkIds: ["lw-killswitch-loom"],
		summary: "Caught the settlement-record problem during reconciliation and recorded a six minute walkthrough of the kill switch at 22:00 Sydney time for whoever ends up holding the pager.",
	},
	{
		memberId: "release-agent", workItemKeys: ["PAY-121", "PAY-128", "PAY-119"], artifactIds: ["a6-flag", "a6-ledger", "a6-plan"], looseWorkIds: ["lw-rehearsal-draft"],
		summary: "Drove the flag through the rehearsal and proposed the fix for the poisoned version field: write the SDK version at settlement time rather than intent time. Estimated at 88 lines and filed as PAY-128.",
	},
	{
		memberId: "jordan", workItemKeys: ["PAY-105", "PAY-112"], artifactIds: ["a6-rehearsal"], looseWorkIds: [],
		summary: "Watched the two in-flight challenge payments complete on v1 after the flag went off, which was the case he was most worried about. PAY-112 is still blocked on the platform team.",
	},
];

const S7_CONTRIBUTIONS: readonly PulseContribution[] = [
	{
		memberId: "maya", workItemKeys: ["PAY-126", "PAY-107", "PAY-115"], artifactIds: ["a7-adapter", "a7-p95"], looseWorkIds: ["lw-p95-screenshot"],
		summary: "Merged the deletion. LegacyGatewayAdapter is gone and retry now lives in payments-api where it can be reasoned about. Also posted the p95 comparison to chat on Wednesday and never mentioned it again.",
	},
	{
		memberId: "jordan", workItemKeys: ["PAY-105", "PAY-112", "PAY-123"], artifactIds: ["a7-readiness"], looseWorkIds: [],
		summary: "Finished the last of the 61 call sites and re-ran the full checkout suite green. Will not sign PAY-112 off until the platform team confirms how long sandbox keys are retained.",
	},
	{
		memberId: "priya", workItemKeys: ["PAY-128", "PAY-130", "PAY-121"], artifactIds: ["a7-readiness", "a7-targeting"], looseWorkIds: ["lw-copy-doc"],
		summary: "Wrote the readiness checklist and gave the honest read to her director: Monday is possible, Wednesday is likely. Has not approved the English-only targeting rule that would make Monday real.",
	},
	{
		memberId: "diego", workItemKeys: ["PAY-130", "PAY-123"], artifactIds: ["a7-l10n"], looseWorkIds: ["lw-copy-doc"],
		summary: "Handed the eleven decline strings to localisation on Friday afternoon, which puts them back on Wednesday at the earliest. The English copy is final and legal have signed it.",
	},
	{
		memberId: "review-agent", workItemKeys: ["PAY-126", "PAY-107"], artifactIds: ["a7-adapter"], looseWorkIds: [],
		summary: "Approved the adapter deletion after re-running the diff against the call-site inventory and confirming all 61 sites are accounted for. Flagged two dead exports left behind in packages/payments-sdk.",
	},
	{
		memberId: "test-agent", workItemKeys: ["PAY-113", "PAY-105"], artifactIds: ["a7-readiness"], looseWorkIds: [],
		summary: "Reports the suite at 214 contract assertions and 96 percent branch coverage on the challenge path, with the three unexercised decline codes still unexercised because no fixture exists to record them.",
	},
	{
		memberId: "release-agent", workItemKeys: ["PAY-121", "PAY-128"], artifactIds: ["a7-targeting"], looseWorkIds: [],
		summary: "Staged the first rollout rule: one percent of traffic, one account, English-only locale, kill switch armed. The rule is written and unapproved, and will not fire until a human presses it.",
	},
];

const SNAPSHOTS: readonly PulseSnapshot[] = [
	{
		id: "s1-kickoff",
		timestamp: "2026-08-17T08:12:00Z",
		dateLabel: "Mon 17 Aug",
		timeLabel: "08:12",
		chapterLabel: "Kickoff",
		rangeLabel: "Fri 17:00 – Mon 08:12",
		title: "We agreed to delete the adapter, not wrap it",
		paragraphs: [
			"Priya opened the week with the scope she and Maya settled on Friday: fourteen items, one epic, no parallel track. The argument that actually mattered was whether to keep LegacyGatewayAdapter as a compatibility shim for the duration of the migration. Keeping it is cheaper for two weeks and more expensive forever, because the v1 adapter still owns retry semantics for 3-D Secure, and every v2 call would have to route back through it to get them. The room chose removal, on the condition that PAY-102 proves it is possible before anyone ports a call site. Lanes went out at 08:12. Maya took the adapter and the retry logic. Jordan took checkout-web and the 61 call sites the inventory turned up, which is fourteen more than the estimate everyone had been quoting since June. Review Agent was pointed at the epic rather than a lane, so every pull request gets the same reviewer regardless of who or what opened it. Test Author Agent picked up the 3-D Secure contract tests. Release Captain Agent took the flag and immediately noted that there is no kill switch yet. The part that is not in Jira: a 38-message thread in #payments-migration where the decision was actually made, including the two objections that were answered and the one that was not. Priya summarised it in a sentence and moved on, which is how a decision becomes folklore. It is showing here so somebody attaches it to PAY-101 before Thursday, when whoever missed the call starts asking why.",
		],
		artifacts: [
			{ id: "a1-scope", title: "Payments SDK v2 — migration scope", source: "Confluence page", owner: "Priya Raman", iconName: "page", tileVariant: "blueSubtle" },
			{ id: "a1-inventory", title: "Call-site inventory across four services", source: "GitHub · #1839 merged", owner: "Maya Ferreira · +312 lines", logoName: "github" },
			{ id: "a1-thread", title: "#payments-migration — keep or delete the adapter", source: "Chat summary", owner: "38 messages", iconName: "ai-chat", tileVariant: "purpleSubtle" },
			{ id: "a1-lanes", title: "Lane assignments, humans and agents", source: "Confluence page", owner: "Priya Raman", iconName: "page", tileVariant: "tealSubtle" },
		],
		workItemKeys: ["PAY-101", "PAY-102", "PAY-104", "PAY-121"],
		looseWorkIds: ["lw-scope-thread"],
		attention: [
			{ id: "s1-sig-decision", tone: "decision", workItemKey: "PAY-101", title: "Delete the adapter rather than shim it", detail: "Agreed verbally, recorded nowhere durable. The reasoning lives in a chat thread that will scroll out of reach by Wednesday." },
			{ id: "s1-sig-flag", tone: "attention", workItemKey: "PAY-121", title: "No kill switch on payments_sdk_v2_rollout", detail: "The flag exists and is off. There is no way to disable it for a single account, which the first port will need." },
		],
		nextActions: [
			{ id: "s1-act-decision", label: "Write the adapter decision onto PAY-101", rationale: "The thread has the reasoning and the two objections. Nothing on the board does.", actionLabel: "Capture decision", workItemKey: "PAY-101" },
			{ id: "s1-act-killswitch", label: "Ask Release Captain Agent to build the kill switch first", rationale: "It is a prerequisite for the first merged port, not a rollout-week task.", actionLabel: "Assign agent", workItemKey: "PAY-121" },
		],
		stats: [
			{ id: "s1-stat-items", label: "Items in scope", value: "14" },
			{ id: "s1-stat-sites", label: "Call sites to port", value: "61" },
			{ id: "s1-stat-lanes", label: "Lanes assigned", value: "5" },
			{ id: "s1-stat-uncaptured", label: "Uncaptured", value: "1" },
		],
		memberIds: ["maya", "jordan", "priya", "diego", "review-agent", "test-agent", "release-agent"],
		contributions: S1_CONTRIBUTIONS,
	},
	{
		id: "s2-spike",
		timestamp: "2026-08-17T17:55:00Z",
		dateLabel: "Mon 17 Aug",
		timeLabel: "17:55",
		chapterLabel: "The spike",
		rangeLabel: "Mon 08:12 – Mon 17:55",
		title: "The adapter can go, with one asterisk",
		paragraphs: [
			"Maya closed PAY-102 nine hours after picking it up. The v2 client exposes the same idempotency guarantees the adapter was faking on top of v1, so LegacyGatewayAdapter can be deleted rather than ported: 4,180 lines, 61 call sites, one deprecation path instead of two. The asterisk is 3-D Secure. The adapter's retry loop backs off on a challenge_pending state that v2 replaced with a webhook, and nothing in payments-api listens for that webhook yet. She pushed the proof as a branch rather than a work item, which is honest about what it is. Forty-one files, almost all deletions, and checkout-web compiles against v2 with the adapter gone provided the challenge handler is stubbed. That stub is now PAY-107, and it is the only interesting thing left between this migration and a boring week. Jordan started at 07:00 in Austin and has 18 of the 61 call sites converted. The mechanical ones took twenty minutes each. The ones inside use-payment-intent.ts took the rest of the day, because the hook had grown its own retry on top of the adapter's retry and unwinding the two meant reading git blame back to 2022. Review Agent turned both pull requests around inside four minutes and left one comment on Jordan's that nobody has answered.",
		],
		artifacts: [
			{ id: "a2-spike-pr", title: "Delete LegacyGatewayAdapter (proof branch)", source: "GitHub · #1847 open", owner: "Maya Ferreira · −4,180 lines", logoName: "github" },
			{ id: "a2-loom", title: "Adapter spike walkthrough", source: "Loom recording · 9 min", owner: "Maya Ferreira", iconName: "video", tileVariant: "magentaSubtle" },
			{ id: "a2-findings", title: "PAY-102 — what the spike found", source: "Confluence page", owner: "Maya Ferreira", iconName: "page", tileVariant: "blueSubtle" },
			{ id: "a2-callsites", title: "checkout-web: port the first 18 call sites", source: "GitHub · #1851 open", owner: "Jordan Okafor · one comment unanswered", logoName: "github" },
			{ id: "a2-review", title: "Review notes on #1851", source: "Agent review", owner: "Review Agent", avatarSrc: AVATAR.reviewAgent },
		],
		workItemKeys: ["PAY-102", "PAY-104", "PAY-105", "PAY-107", "PAY-109", "PAY-126"],
		looseWorkIds: ["lw-adapter-branch", "lw-loom-spike"],
		attention: [
			{ id: "s2-sig-webhook", tone: "risk", workItemKey: "PAY-107", title: "Nothing listens for the challenge webhook", detail: "v2 replaced challenge_pending with a webhook. payments-api has no handler, so every 3-D Secure payment stalls the moment the adapter is removed." },
			{ id: "s2-sig-unlinked", tone: "attention", workItemKey: "PAY-102", title: "The proof of the whole week is an unlinked branch", detail: "PR #1847 carries the spike result. The work item it proves says only “investigate”." },
		],
		nextActions: [
			{ id: "s2-act-link", label: "Link PR #1847 and the Loom to PAY-102", rationale: "The evidence for the delete decision is currently two links in a DM.", actionLabel: "Link evidence", workItemKey: "PAY-102" },
			{ id: "s2-act-handler", label: "Promote the challenge webhook handler to a blocker on PAY-107", rationale: "It gates every remaining 3-D Secure call site, not just the stub.", actionLabel: "Set blocker", workItemKey: "PAY-107" },
		],
		stats: [
			{ id: "s2-stat-lines", label: "Lines the delete removes", value: "4,180" },
			{ id: "s2-stat-ported", label: "Call sites ported", value: "18 / 61" },
			{ id: "s2-stat-review", label: "Median review turnaround", value: "4 min" },
			{ id: "s2-stat-uncaptured", label: "Uncaptured", value: "2" },
		],
		memberIds: ["maya", "jordan", "review-agent", "test-agent"],
		contributions: S2_CONTRIBUTIONS,
	},
	{
		id: "s3-regression",
		timestamp: "2026-08-18T11:05:00Z",
		dateLabel: "Tue 18 Aug",
		timeLabel: "11:05",
		chapterLabel: "Regression",
		rangeLabel: "Mon 17:55 – Tue 11:05",
		title: "Idempotency keys are bouncing in sandbox-eu",
		paragraphs: [
			"Jordan's ported call sites pass locally and fail in sandbox-eu. Every confirmPaymentIntent comes back 401 invalid_idempotency_scope. The v1 adapter prefixed keys with the merchant id; v2 expects them scoped to the account and rejects anything over 64 characters. Merchant ids are UUIDs, so the concatenated key is 73 characters, and the sandbox truncates rather than errors. That is why unit tests never saw it and why 1,204 events piled up in Sentry before anyone looked. It is a two-line fix and a much larger question. Nobody knows how many keys are already in flight in the long format, and replaying a truncated key against a live account is the kind of thing that charges a customer twice. Priya moved PAY-112 to blocked rather than let it look like progress, and asked payments platform for the retention window on sandbox keys. Until that answer lands, PAY-105 does not move and neither does the flag. Review Agent had the shape of this nineteen hours earlier. Its comment on #1851 reads “key length not bounded, upstream limit unknown”, and Jordan resolved it because the local tests were green. The comment is still on the pull request. Maya, reading the thread from Sydney at 21:00, made the one change that matters: PAY-107 now rejects over-length keys loudly instead of trimming them, because a loud failure in staging is worth more than a quiet one in production.",
		],
		artifacts: [
			{ id: "a3-sentry", title: "invalid_idempotency_scope — 1,204 events, sandbox-eu", source: "Sentry issue", owner: "payments-api", logoName: "sentry" },
			{ id: "a3-triage", title: "#payments-oncall — sandbox 401 triage", source: "Chat summary", owner: "Root cause at 10:52", iconName: "ai-chat", tileVariant: "purpleSubtle" },
			{ id: "a3-review", title: "“Key length not bounded, upstream limit unknown”", source: "Agent review · resolved by mistake", owner: "Review Agent", avatarSrc: AVATAR.reviewAgent },
			{ id: "a3-handover", title: "On-call handover, Tuesday 03:10", source: "Confluence page", owner: "Jordan Okafor", iconName: "page", tileVariant: "blueSubtle" },
		],
		workItemKeys: ["PAY-104", "PAY-105", "PAY-107", "PAY-112"],
		looseWorkIds: ["lw-sandbox-triage", "lw-oncall-note"],
		attention: [
			{ id: "s3-sig-replay", tone: "risk", workItemKey: "PAY-112", title: "Truncated keys could be replayed against live accounts", detail: "Two distinct payments can collapse onto the same 64-character key. Nobody yet knows how long the platform retains them, so the blast radius is unknown." },
			{ id: "s3-sig-ignored", tone: "attention", workItemKey: "PAY-104", title: "An agent review comment was resolved without an answer", detail: "Review Agent named this failure nineteen hours before the sandbox did. Green local tests were treated as the stronger signal." },
		],
		nextActions: [
			{ id: "s3-act-retention", label: "Chase payments platform on the sandbox key retention window", rationale: "PAY-112 and PAY-105 are both waiting on a single number.", actionLabel: "Escalate", workItemKey: "PAY-112" },
			{ id: "s3-act-sync", label: "Sync the triage thread onto PAY-112", rationale: "The root cause has been known since 10:52. The work item still reads “investigating”.", actionLabel: "Sync summary", workItemKey: "PAY-112" },
			{ id: "s3-act-tests", label: "Have Test Author Agent add a key-length boundary case", rationale: "The suite passes at 73 characters today, which is the whole problem.", actionLabel: "Assign agent", workItemKey: "PAY-113" },
		],
		stats: [
			{ id: "s3-stat-events", label: "Sandbox errors", value: "1,204" },
			{ id: "s3-stat-blocked", label: "Items blocked", value: "2" },
			{ id: "s3-stat-ttd", label: "Time to root cause", value: "32 min" },
			{ id: "s3-stat-uncaptured", label: "Uncaptured", value: "2" },
		],
		memberIds: ["jordan", "priya", "maya", "review-agent"],
		contributions: S3_CONTRIBUTIONS,
	},
	{
		id: "s4-night-shift",
		timestamp: "2026-08-19T02:30:00Z",
		dateLabel: "Wed 19 Aug",
		timeLabel: "02:30",
		chapterLabel: "Night shift",
		rangeLabel: "Tue 11:05 – Wed 02:30",
		title: "Six pull requests while everyone slept",
		paragraphs: [
			"Sydney was asleep, Austin was asleep, London was asleep. Between 22:40 and 02:30 the three agents merged six pull requests. Test Author Agent wrote the 3-D Secure contract suite that PAY-113 has been carrying since March: 214 assertions against recorded fixtures, plus a harness that replays the challenge webhook so the tests never need the sandbox that has been failing all day. Review Agent approved four and sent two back, one for an error swallowed inside the challenge retry, and one because the idempotency fix trimmed over-length keys instead of rejecting them. Release Captain Agent wrote the least code and did the most useful thing. It read the truncation risk out of PAY-112, decided the kill switch was now urgent rather than scheduled, and built it: payments_sdk_v2_rollout can be pulled for a single account instead of globally. That is not what the item asked for. It is what the item needed, and it happened at 01:14 without anyone to ask. None of the six pull requests are linked to a work item. The board still shows PAY-113 in To do and PAY-107 unassigned, so a Wednesday stand-up would have reported no movement on either while the tests that unblock the week sat merged on main. This is the exact gap Pulse exists to close, and it is worth noticing that it opened in four hours with nobody doing anything wrong.",
		],
		artifacts: [
			{ id: "a4-tests", title: "3-D Secure contract suite — 214 assertions", source: "GitHub · #1863 merged", owner: "Test Author Agent", logoName: "github" },
			{ id: "a4-prs", title: "Five more merges, 22:40 – 02:30", source: "GitHub · #1862, #1864 – #1867 merged", owner: "Review Agent approved four", logoName: "github" },
			{ id: "a4-killswitch", title: "Per-account kill switch on payments_sdk_v2_rollout", source: "LaunchDarkly change", owner: "Release Captain Agent", logoName: "launchdarkly" },
			{ id: "a4-rejects", title: "Two pull requests returned, with reasons", source: "Agent review", owner: "Review Agent", avatarSrc: AVATAR.reviewAgent },
			{ id: "a4-recap", title: "Night-shift recap for the morning", source: "Agent summary", owner: "Release Captain Agent", avatarSrc: AVATAR.releaseAgent },
		],
		workItemKeys: ["PAY-105", "PAY-107", "PAY-109", "PAY-113", "PAY-121"],
		looseWorkIds: ["lw-night-prs", "lw-flag-edits"],
		attention: [
			{ id: "s4-sig-unlinked", tone: "attention", workItemKey: "PAY-113", title: "Six merges, zero linked work items", detail: "The board says nothing moved overnight. Main says the contract suite landed and the kill switch exists." },
			{ id: "s4-sig-flag", tone: "risk", workItemKey: "PAY-121", title: "Flag rules changed with no change record", detail: "Three targeting rules were edited directly in LaunchDarkly at 01:14. The rollout item does not reflect them, so the plan on the page and the plan in production have already diverged." },
		],
		nextActions: [
			{ id: "s4-act-bulk", label: "Bulk-link #1862 – #1867 to PAY-105 and PAY-113", rationale: "Six merges are invisible on the board. Two work items are wrong as a result.", actionLabel: "Link pull requests" },
			{ id: "s4-act-flagdiff", label: "Attach the LaunchDarkly rule diff to PAY-121", rationale: "The kill switch is real. The only record of how it is configured is in the vendor's audit log.", actionLabel: "Attach diff", workItemKey: "PAY-121" },
			{ id: "s4-act-close", label: "Move PAY-113 to done", rationale: "The suite is merged, reviewed and green. It has been in To do for five months.", actionLabel: "Move to done", workItemKey: "PAY-113" },
		],
		stats: [
			{ id: "s4-stat-prs", label: "Pull requests merged", value: "6" },
			{ id: "s4-stat-tests", label: "Assertions added", value: "214" },
			{ id: "s4-stat-hours", label: "Human hours", value: "0" },
			{ id: "s4-stat-window", label: "Window", value: "3h 50m" },
		],
		memberIds: ["review-agent", "test-agent", "release-agent"],
		contributions: S4_CONTRIBUTIONS,
	},
	{
		id: "s5-design-review",
		timestamp: "2026-08-19T15:20:00Z",
		dateLabel: "Wed 19 Aug",
		timeLabel: "15:20",
		chapterLabel: "Design review",
		rangeLabel: "Wed 02:30 – Wed 15:20",
		title: "We cut the wallet UI",
		paragraphs: [
			"Diego walked the saved-card flow at 15:20 and the room cut it, with Diego making the case himself. The v2 payment-method object does not carry the card artwork metadata the design depends on, and getting it means a second round trip per saved card at checkout time. Measured against the staging fixture set, that is 180 to 240 ms added to a screen the team spent all of last quarter making faster. PAY-118 moves to the next epic with the artwork requirement written on it, rather than shipping a slower version of something customers already like. What survives is the copy. The v2 error taxonomy is finer-grained than v1 — eleven decline reasons where the old client collapsed everything into three — and Diego mapped all eleven onto language that tells the customer what they can actually do next. Legal have read them and signed. That work currently lives in a Google Doc with no work item attached, which is a problem for eleven strings that need to ship in nine languages. Priya treated the cut as a scope change rather than a failure and pulled PAY-115 forward to fill the empty lane. Maya said, on the call, that ledger-sync is not ready for settlement events and took the item anyway, on the grounds that an idle lane on a Wednesday is how a Friday goes wrong. Test Author Agent came back an hour later with the awkward detail: three of the eleven decline codes have no fixture that exercises them.",
		],
		artifacts: [
			{ id: "a5-figma", title: "Wallet — saved payment methods, v2", source: "Figma file · frames parked", owner: "Diego Santos", logoName: "figma" },
			{ id: "a5-copy", title: "Eleven decline reasons, customer-facing copy", source: "Google Doc · approved by legal", owner: "Diego Santos", logoName: "google-docs" },
			{ id: "a5-latency", title: "Saved-card round trip on staging fixtures", source: "Confluence page", owner: "Maya Ferreira", iconName: "page", tileVariant: "blueSubtle" },
			{ id: "a5-review-notes", title: "#design-review — why the wallet is out", source: "Chat summary", owner: "Priya Raman", iconName: "ai-chat", tileVariant: "purpleSubtle" },
		],
		workItemKeys: ["PAY-115", "PAY-118", "PAY-123", "PAY-130"],
		looseWorkIds: ["lw-figma-parked", "lw-copy-doc"],
		attention: [
			{ id: "s5-sig-cut", tone: "decision", workItemKey: "PAY-118", title: "Wallet UI cut on a 180–240 ms round-trip cost", detail: "Deferred to the next epic with the card-artwork requirement attached. The reasoning is in a Figma comment thread, not on the item." },
			{ id: "s5-sig-copy", tone: "attention", workItemKey: "PAY-130", title: "Approved copy with no localisation item", detail: "Eleven strings, nine languages, a five-day queue, and it is Wednesday. No work item exists yet." },
		],
		nextActions: [
			{ id: "s5-act-record", label: "Record the wallet cut on PAY-118", rationale: "A cut without a written reason gets re-litigated in the next planning session.", actionLabel: "Record decision", workItemKey: "PAY-118" },
			{ id: "s5-act-l10n", label: "Open the localisation item and attach the approved doc", rationale: "The queue is five working days. Starting Thursday means the strings land after the ship date.", actionLabel: "Create item", workItemKey: "PAY-130" },
			{ id: "s5-act-fixtures", label: "Ask Test Author Agent to record the three missing decline fixtures", rationale: "expired_card_network, issuer_unavailable and risk_hold are untested in both v1 and v2.", actionLabel: "Assign agent", workItemKey: "PAY-123" },
		],
		stats: [
			{ id: "s5-stat-cut", label: "Items cut", value: "1" },
			{ id: "s5-stat-latency", label: "Round-trip cost avoided", value: "180–240 ms" },
			{ id: "s5-stat-strings", label: "Decline strings approved", value: "11" },
			{ id: "s5-stat-uncaptured", label: "Uncaptured", value: "2" },
		],
		memberIds: ["diego", "priya", "maya", "test-agent"],
		contributions: S5_CONTRIBUTIONS,
	},
	{
		id: "s6-rehearsal",
		timestamp: "2026-08-20T09:45:00Z",
		dateLabel: "Thu 20 Aug",
		timeLabel: "09:45",
		chapterLabel: "Rehearsal",
		rangeLabel: "Wed 15:20 – Thu 09:45",
		title: "The rollback took four minutes",
		paragraphs: [
			"They rehearsed it properly on staging rather than on paper. Flag on, 200 synthetic payments through the v2 path, flag pulled mid-flight, then reconcile. Four minutes and eleven seconds from the decision to flip to a clean ledger. Two payments were inside the 3-D Secure challenge window when the flag went off and both completed on v1 as intended, which was the case Jordan had been quietly worried about since Tuesday. The rehearsal found one real problem. ledger-sync writes the SDK version into the settlement record at intent time, so a rollback leaves rows stamped v2 against payments that actually settled on v1. Harmless for reconciliation, poisonous for the finance export, which groups by that field and would have quietly misreported a week of revenue. Release Captain Agent proposed writing the version at settlement time instead. That is PAY-128, it is 88 lines, and it should have been obvious a month ago. The rollout plan now lives in three places: Priya's draft run log, the LaunchDarkly targeting rules Release Captain edited directly on Wednesday morning, and a six minute Loom Maya recorded at 22:00 Sydney time explaining the kill switch to whoever ends up holding the pager. Three places is two too many for a document you might need at three in the morning.",
		],
		artifacts: [
			{ id: "a6-rehearsal", title: "Rollback rehearsal — run log", source: "Confluence page · draft", owner: "Priya Raman", iconName: "page", tileVariant: "blueSubtle" },
			{ id: "a6-flag", title: "payments_sdk_v2_rollout targeting rules", source: "LaunchDarkly change", owner: "Release Captain Agent", logoName: "launchdarkly" },
			{ id: "a6-loom", title: "How to flip the kill switch at 3am", source: "Loom recording · 6 min", owner: "Maya Ferreira", iconName: "video", tileVariant: "magentaSubtle" },
			{ id: "a6-ledger", title: "ledger-sync: stamp SDK version at settlement", source: "GitHub · #1881 open", owner: "Release Captain Agent · 88 lines", logoName: "github" },
			{ id: "a6-plan", title: "Rollout plan, third revision", source: "Agent summary", owner: "Release Captain Agent", avatarSrc: AVATAR.releaseAgent },
		],
		workItemKeys: ["PAY-115", "PAY-119", "PAY-121", "PAY-126", "PAY-128"],
		looseWorkIds: ["lw-rehearsal-draft", "lw-killswitch-loom"],
		attention: [
			{ id: "s6-sig-ledger", tone: "risk", workItemKey: "PAY-128", title: "Rollback poisons the finance export", detail: "Settlement rows keep a v2 stamp after a rollback. The export groups by that field and would misreport the week without anyone noticing." },
			{ id: "s6-sig-plan", tone: "attention", workItemKey: "PAY-119", title: "The rollout plan exists in three unlinked places", detail: "A draft page, a vendor console and a Loom in a DM. None of them is reachable from the epic at three in the morning." },
			{ id: "s6-sig-rehearsal", tone: "shipped", workItemKey: "PAY-119", title: "Rollback verified end to end", detail: "200 synthetic payments, clean ledger in 4m 11s, both in-flight challenges completed on v1." },
		],
		nextActions: [
			{ id: "s6-act-publish", label: "Publish the run log and link it to PAY-119", rationale: "It is the only written evidence the rollback works, and it is a draft.", actionLabel: "Publish page", workItemKey: "PAY-119" },
			{ id: "s6-act-ledger", label: "Merge PAY-128 before the flag goes above zero percent", rationale: "88 lines now, or a corrupted finance export and a manual reconciliation later.", actionLabel: "Prioritise", workItemKey: "PAY-128" },
		],
		stats: [
			{ id: "s6-stat-rollback", label: "Rollback to clean ledger", value: "4m 11s" },
			{ id: "s6-stat-payments", label: "Synthetic payments", value: "200" },
			{ id: "s6-stat-inflight", label: "In-flight challenges recovered", value: "2 / 2" },
			{ id: "s6-stat-uncaptured", label: "Uncaptured", value: "2" },
		],
		memberIds: ["priya", "maya", "release-agent", "jordan"],
		contributions: S6_CONTRIBUTIONS,
	},
	{
		id: "s7-ship-readiness",
		timestamp: "2026-08-21T17:30:00Z",
		dateLabel: "Fri 21 Aug",
		timeLabel: "17:30",
		chapterLabel: "Ship readiness",
		rangeLabel: "Thu 09:45 – Fri 17:30",
		title: "Two blockers between here and Monday",
		paragraphs: [
			"Sixty-one call sites ported, the adapter deleted, 4,180 lines gone from packages/payments-sdk, retry living in payments-api where it can be reasoned about, and a flag with per-account targeting and an armed kill switch. What is left is two things. PAY-112 still needs payments platform to confirm the sandbox key retention window, because without it nobody will sign off on replaying keys against live accounts. And PAY-130, the eleven decline strings, entered localisation this afternoon, which is a five working day queue starting Monday. The honest read is that Monday is possible and Wednesday is likely. The rollout starts at one percent of traffic on a single English-only account, which does not need the translated strings at all, so the first slice can go while the rest of the copy lands. Release Captain Agent has already written that targeting rule. Nobody has approved it, and it will not fire until a human presses it, which is the correct shape for a Friday evening. One thing is unresolved and not on the board in any form. Maya measured p95 on the v2 path at 42 ms faster than v1 and posted the graph in chat on Wednesday afternoon. If that holds under real traffic it changes the rollout argument from migrate carefully to migrate quickly, and it is currently a screenshot in a thread that four people have already scrolled past.",
		],
		artifacts: [
			{ id: "a7-adapter", title: "Delete LegacyGatewayAdapter", source: "GitHub · #1847 merged", owner: "Maya Ferreira · −4,180 lines", logoName: "github" },
			{ id: "a7-readiness", title: "Ship readiness checklist", source: "Confluence page", owner: "Priya Raman", iconName: "page", tileVariant: "blueSubtle" },
			{ id: "a7-p95", title: "v2 latency comparison, staging", source: "Chat summary · never filed", owner: "Maya Ferreira", iconName: "ai-chat", tileVariant: "purpleSubtle" },
			{ id: "a7-targeting", title: "One percent, one account, English only", source: "LaunchDarkly change · unapproved", owner: "Release Captain Agent", logoName: "launchdarkly" },
			{ id: "a7-l10n", title: "Decline strings handed to localisation", source: "Google Doc", owner: "Diego Santos", logoName: "google-docs" },
		],
		workItemKeys: ["PAY-105", "PAY-107", "PAY-112", "PAY-121", "PAY-123", "PAY-126", "PAY-128", "PAY-130"],
		looseWorkIds: ["lw-p95-screenshot", "lw-copy-doc"],
		attention: [
			{ id: "s7-sig-keys", tone: "risk", workItemKey: "PAY-112", title: "Still waiting on the sandbox key retention window", detail: "Four days open with payments platform. Without the number, replaying keys against live accounts stays unsigned and the rollout stays at zero." },
			{ id: "s7-sig-l10n", tone: "attention", workItemKey: "PAY-130", title: "Localisation started on a Friday", detail: "Eleven strings, nine languages, five working days. The English-only first slice is the only path that does not wait for them." },
			{ id: "s7-sig-shipped", tone: "shipped", workItemKey: "PAY-126", title: "LegacyGatewayAdapter is gone", detail: "4,180 lines removed, all 61 call sites accounted for, two dead exports flagged for follow-up." },
		],
		nextActions: [
			{ id: "s7-act-approve", label: "Approve the one percent English-only targeting rule", rationale: "It unblocks Monday without waiting on translations, and it is already written and staged.", actionLabel: "Approve rule", workItemKey: "PAY-121" },
			{ id: "s7-act-escalate", label: "Escalate PAY-112 to the payments platform on-call", rationale: "Four days on a single number. The polite channel has not worked.", actionLabel: "Page on-call", workItemKey: "PAY-112" },
			{ id: "s7-act-p95", label: "File the p95 comparison against PAY-126", rationale: "A 42 ms improvement is the strongest argument for moving faster and it is invisible to everyone outside one chat thread.", actionLabel: "Attach result", workItemKey: "PAY-126" },
		],
		stats: [
			{ id: "s7-stat-ported", label: "Call sites ported", value: "61 / 61" },
			{ id: "s7-stat-removed", label: "Lines removed", value: "4,180" },
			{ id: "s7-stat-blockers", label: "Blockers left", value: "2" },
			{ id: "s7-stat-p95", label: "p95 vs v1", value: "−42 ms" },
		],
		memberIds: ["maya", "jordan", "priya", "diego", "review-agent", "test-agent", "release-agent"],
		contributions: S7_CONTRIBUTIONS,
	},
];

/**
 * The epic line. It is page-level context rather than snapshot context, so it
 * is rendered once beside the Board | Pulse tabs and never again above the
 * display headline — two stacked all-caps eyebrows read as one blurry block,
 * and the outer one never changes.
 */
export const PULSE_PROJECT_LABEL = "PAY · Payments SDK v2 migration";

export const PULSE_TIMELINE: PulseTimeline = {
	projectLabel: PULSE_PROJECT_LABEL,
	members: MEMBERS,
	workItems: WORK_ITEMS,
	looseWork: LOOSE_WORK,
	snapshots: SNAPSHOTS,
};

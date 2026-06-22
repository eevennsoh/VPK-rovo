const {
	clipText,
	getNonEmptyString,
} = require("./shared-utils");

const SECTION_LABELS = new Map([
	["buyer priorities:", "buyerPriorities"],
	["evaluation criteria:", "evaluationCriteria"],
	["win themes:", "winThemes"],
	["known risks:", "knownRisks"],
	["next actions:", "nextActions"],
	["response team needs:", "responseTeam"],
	["child work items:", "childItems"],
	["attachments:", "attachments"],
	["recent activity:", "recentActivity"],
]);

function stripTrailingPunctuation(value) {
	return String(value ?? "").replace(/[.!?]+$/u, "").trim();
}

function sentence(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return "";
	}

	return /[.!?]$/u.test(text) ? text : `${text}.`;
}

function uniqueStrings(items) {
	return Array.from(new Set(
		(Array.isArray(items) ? items : [])
			.map((item) => getNonEmptyString(item))
			.filter(Boolean),
	));
}

function formatSeries(items, {
	empty,
	limit = 5,
} = {}) {
	const values = Array.isArray(items)
		? items.map((item) => getNonEmptyString(item)).filter(Boolean)
		: [];
	if (values.length === 0) {
		return empty || "No evidence supplied in the Work Item context.";
	}

	const clipped = values.slice(0, limit).map(stripTrailingPunctuation);
	const suffix = values.length > clipped.length
		? `; plus ${values.length - clipped.length} more`
		: "";
	return `${clipped.join("; ")}${suffix}.`;
}

function titleCaseStatus(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return "";
	}

	if (/^todo$/iu.test(text)) return "To do";
	if (/^inprogress$/iu.test(text)) return "In progress";
	return text
		.split(/[\s_-]+/u)
		.map((part) => part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : "")
		.join(" ");
}

function extractRolePerson(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return {
			name: null,
			role: null,
		};
	}

	const match = text.match(/^(.+?)\s+\(([^)]+)\)$/u);
	return {
		name: getNonEmptyString(match?.[1]) || text,
		role: getNonEmptyString(match?.[2]),
	};
}

function parseContextFieldSections(activeWorkItemContext) {
	const fields = {};
	const sections = {
		attachments: [],
		buyerPriorities: [],
		childItems: [],
		evaluationCriteria: [],
		knownRisks: [],
		nextActions: [],
		recentActivity: [],
		responseTeam: [],
		winThemes: [],
	};
	let activeSection = null;

	const lines = activeWorkItemContext.replace(/\r\n?/gu, "\n").split("\n");
	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		const trimmed = line.trim();
		if (
			!trimmed ||
			trimmed === "[Active Jira Work Item Context]" ||
			trimmed === "[End Active Jira Work Item Context]"
		) {
			continue;
		}

		const sectionName = SECTION_LABELS.get(trimmed.toLowerCase());
		if (sectionName) {
			activeSection = sectionName;
			continue;
		}

		if (activeSection && /^\s*-\s+/u.test(line)) {
			sections[activeSection].push(line.replace(/^\s*-\s+/u, "").trim());
			continue;
		}

		activeSection = null;
		const fieldMatch = trimmed.match(/^([^:]+):\s*(.+)$/u);
		if (!fieldMatch) {
			continue;
		}

		fields[fieldMatch[1].trim().toLowerCase()] = fieldMatch[2].trim();
	}

	return {
		fields,
		sections,
	};
}

function parseChildItem(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const match = text.match(/^([A-Z][A-Z0-9]+-\d+):\s+(.+?)\s+\(([^,]+),\s*([^,]+),\s*owner:\s*([^)]+)\)$/iu);
	if (!match) {
		return {
			key: null,
			owner: null,
			priority: null,
			status: null,
			summary: text,
		};
	}

	return {
		key: match[1],
		owner: match[5],
		priority: titleCaseStatus(match[4]),
		status: titleCaseStatus(match[3]),
		summary: match[2],
	};
}

function parseAttachment(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const match = text.match(/^(.+?)\s+\(([^)]+)\)$/u);
	return {
		date: getNonEmptyString(match?.[2]),
		name: getNonEmptyString(match?.[1]) || text,
	};
}

function parseActivity(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const match = text.match(/^(.+?):\s+(.+?)(?:\s+\(([^)]+)\))?\s+-\s+(.+)$/u);
	if (!match) {
		return {
			author: null,
			content: text,
			role: null,
			timestamp: null,
		};
	}

	return {
		author: match[2],
		content: match[4],
		role: getNonEmptyString(match[3]),
		timestamp: match[1],
	};
}

function parseTeamMember(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const match = text.match(/^([^:]+):\s+(.+?)\s+-\s+(.+)$/u);
	if (!match) {
		return {
			need: text,
			owner: null,
			role: null,
		};
	}

	return {
		need: match[3],
		owner: match[2],
		role: match[1],
	};
}

function formatReportingPeriod(startDate, dueDate) {
	const start = getNonEmptyString(startDate);
	const due = getNonEmptyString(dueDate);
	if (!start && !due) {
		return "Timeline gap";
	}
	if (!start) {
		return `Due ${due}`;
	}
	if (!due) {
		return `Started ${start}`;
	}

	const startMatch = start.match(/^(.+?),\s*(\d{4})$/u);
	const dueMatch = due.match(/^(.+?),\s*(\d{4})$/u);
	if (startMatch && dueMatch && startMatch[2] === dueMatch[2]) {
		return `${startMatch[1]} to ${dueMatch[1]}, ${dueMatch[2]}`;
	}

	return `${start} to ${due}`;
}

function collectInformationGaps({
	fields,
	sections,
}) {
	const gaps = [];
	if (!fields["due date"] && !fields["response due date"]) {
		gaps.push("Due date or response deadline is not specified in the Work Item context.");
	}
	if (!fields.assignee) {
		gaps.push("Assignee is not specified in the Work Item context.");
	}
	if (!fields.reporter) {
		gaps.push("Reporter is not specified in the Work Item context.");
	}
	if (sections.attachments.length === 0) {
		gaps.push("Attachment metadata is not available in the Work Item context.");
	}
	if (sections.recentActivity.length === 0) {
		gaps.push("Recent activity is not available in the Work Item context.");
	}

	const joinedContext = [
		...Object.values(fields),
		...Object.values(sections).flat(),
	].join("\n").toLowerCase();
	if (/\brfp\b/u.test(joinedContext) && !/bid\/no-bid decision date|bid no bid decision date/u.test(joinedContext)) {
		gaps.push("Bid/no-bid decision date and approval owner are not specified in the Work Item context.");
	}
	if (/\brfp\b/u.test(joinedContext) && !/budget qualified|qualified budget|budget qualification/u.test(joinedContext)) {
		gaps.push("Client budget qualification is not confirmed in the Work Item context.");
	}
	if (/\brfp\b/u.test(joinedContext) && !/stakeholder relationship|executive sponsor|champion/u.test(joinedContext)) {
		gaps.push("Stakeholder relationship strength is not confirmed in the Work Item context.");
	}
	if (/data residency/u.test(joinedContext) && !/data residency region/u.test(joinedContext)) {
		gaps.push("Required data residency region is not recorded in the Work Item context.");
	}
	if (/reference customers?/u.test(joinedContext) && !/selected reference|reference customer selected/u.test(joinedContext)) {
		gaps.push("Reference customers for the competitor-displacement narrative are not listed.");
	}

	return Array.from(new Set(gaps));
}

function buildFallbackReportFields(activeWorkItemContext) {
	const { fields, sections } = parseContextFieldSections(activeWorkItemContext);
	const childItems = sections.childItems.map(parseChildItem).filter(Boolean);
	const attachments = sections.attachments.map(parseAttachment).filter(Boolean);
	const recentActivity = sections.recentActivity.map(parseActivity).filter(Boolean);
	const responseTeam = sections.responseTeam.map(parseTeamMember).filter(Boolean);
	const assignee = extractRolePerson(fields.assignee);
	const reporter = extractRolePerson(fields.reporter);
	const key = getNonEmptyString(fields.key);
	const title = getNonEmptyString(fields.title) || (key ? `${key} Work Item Report` : "Work Item Report");
	const docTitle = key ? `${key} · ${title}` : title;
	const parent = getNonEmptyString(fields.parent);
	const customer = getNonEmptyString(fields.customer);
	const status = getNonEmptyString(fields.status);
	const priority = getNonEmptyString(fields.priority);
	const knownRisks = sections.knownRisks;
	const nextActions = sections.nextActions;
	const completedChildItems = childItems.filter((item) => /\bdone\b/iu.test(item.status || ""));
	const inProgressChildItems = childItems.filter((item) => /\bin progress\b/iu.test(item.status || ""));
	const todoChildItems = childItems.filter((item) => /\bto do\b/iu.test(item.status || ""));
	const confidence = knownRisks.length >= 3 || todoChildItems.length > 0 ? "Medium" : "High";
	const informationGaps = collectInformationGaps({ fields, sections });
	const activitySummary = recentActivity.map((activity) => {
		const author = [activity.author, activity.role ? `(${activity.role})` : null].filter(Boolean).join(" ");
		return author
			? `${author}: ${activity.content}`
			: activity.content;
	});
	const completedSummary = [
		...completedChildItems.map((item) => `${item.key || "Child item"} is done: ${item.summary}`),
		...inProgressChildItems.map((item) => `${item.key || "Child item"} is in progress with ${item.owner || "an owner not listed"}: ${item.summary}`),
	];
	const blockerSummary = [
		...knownRisks,
		...todoChildItems.map((item) => `${item.key || "Child item"} remains to do with ${item.owner || "an owner not listed"}: ${item.summary}`),
	];
	const attachmentsSummary = attachments.map((attachment) =>
		attachment.date ? `${attachment.name} (${attachment.date})` : attachment.name,
	);
	const teamSummary = responseTeam.map((member) =>
		[member.role, member.owner, member.need].filter(Boolean).join(": "),
	);

	return {
		artifactTitle: title,
		author: assignee.name || reporter.name || "Unassigned owner",
		blockerCount: String(knownRisks.length || todoChildItems.length || 0),
		blockersText: formatSeries(blockerSummary, {
			empty: "No blockers were supplied in the Work Item context.",
			limit: 6,
		}),
		confidence,
		confidenceText: sentence([
			`${confidence} confidence`,
			status ? `status is ${status}` : null,
			priority ? `priority is ${priority}` : null,
			knownRisks.length > 0 ? `${knownRisks.length} risk${knownRisks.length === 1 ? "" : "s"} need active management` : null,
			fields["due date"] ? `deadline is ${fields["due date"]}` : null,
		].filter(Boolean).join("; ")),
		date: getNonEmptyString(fields["start date"]) || getNonEmptyString(fields["due date"]) || new Date().toISOString().slice(0, 10),
		description: clipText(fields.description, 150) || `Status report for ${docTitle}.`,
		docTitle,
		executiveSummary: sentence(fields.description || `${docTitle} is being tracked as a Jira Work Item report.`),
		informationGaps,
		keywords: [
			key,
			customer,
			status,
			"Jira Work Item",
			"status report",
		].filter(Boolean).slice(0, 5).join(", "),
		milestonesText: sentence([
			fields["response due date"] || fields["due date"]
				? `Target date: ${fields["response due date"] || fields["due date"]}`
				: null,
			teamSummary.length > 0 ? `Ownership: ${formatSeries(teamSummary, { limit: 4 })}` : null,
			informationGaps.length > 0 ? `Resolve information gaps: ${formatSeries(informationGaps, { limit: 3 })}` : null,
		].filter(Boolean).join(" ")),
		nextWindowText: formatSeries(nextActions, {
			empty: "Next actions are not specified in the Work Item context.",
			limit: 6,
		}),
		progressText: sentence([
			completedSummary.length > 0
				? formatSeries(completedSummary, { limit: 5 })
				: "No completed child Work Items are listed",
			attachmentsSummary.length > 0
				? `Evidence files available: ${formatSeries(attachmentsSummary, { limit: 4 })}`
				: "Attachment evidence is not listed",
		].join(" ")),
		reportingPeriod: formatReportingPeriod(fields["start date"], fields["due date"] || fields["response due date"]),
		routeHint: key ? `${key} · active work item context` : "active work item context",
		summary: sentence([
			customer ? `${customer} report` : "Work Item report",
			key ? key : null,
			status ? `status: ${status}` : null,
			fields["due date"] ? `due ${fields["due date"]}` : null,
		].filter(Boolean).join(" · ")),
		teamOrContext: parent || customer || "Jira Work Item",
		whatChangedText: formatSeries([
			status ? `${key || "The Work Item"} is in ${status}` : null,
			fields["procurement stage"] ? `Procurement stage: ${fields["procurement stage"]}` : null,
			...activitySummary.slice(0, 3),
		].filter(Boolean), {
			limit: 5,
		}),
	};
}

function isRfpQualificationContext(activeWorkItemContext) {
	const { fields, sections } = parseContextFieldSections(activeWorkItemContext);
	const key = getNonEmptyString(fields.key);
	const joinedContext = [
		...Object.values(fields),
		...Object.values(sections).flat(),
	].join("\n");

	return /^RFP-\d+$/iu.test(key || "") || /\brfp\b/iu.test(joinedContext);
}

function resolveWorkItemReportKind(activeWorkItemContext) {
	return isRfpQualificationContext(activeWorkItemContext)
		? "rfp-qualification-daci"
		: "status-report";
}

function findTeamMember(responseTeam, matcher) {
	return responseTeam.find((member) => {
		const text = [member.role, member.owner, member.need].filter(Boolean).join(" ").toLowerCase();
		return matcher.test(text);
	}) ?? null;
}

function buildFallbackDaciReportFields(activeWorkItemContext) {
	const { fields, sections } = parseContextFieldSections(activeWorkItemContext);
	const childItems = sections.childItems.map(parseChildItem).filter(Boolean);
	const attachments = sections.attachments.map(parseAttachment).filter(Boolean);
	const recentActivity = sections.recentActivity.map(parseActivity).filter(Boolean);
	const responseTeam = sections.responseTeam.map(parseTeamMember).filter(Boolean);
	const assignee = extractRolePerson(fields.assignee);
	const reporter = extractRolePerson(fields.reporter);
	const key = getNonEmptyString(fields.key);
	const customer = getNonEmptyString(fields.customer) || "the client";
	const title = getNonEmptyString(fields.title) || (key ? `${key} RFP qualification` : "RFP qualification");
	const dueDate = getNonEmptyString(fields["response due date"]) || getNonEmptyString(fields["due date"]);
	const dealSize = getNonEmptyString(fields["deal size"]) || getNonEmptyString(fields["seat count"]);
	const knownRisks = sections.knownRisks;
	const buyerPriorities = sections.buyerPriorities;
	const evaluationCriteria = sections.evaluationCriteria;
	const winThemes = sections.winThemes;
	const nextActions = sections.nextActions;
	const informationGaps = collectInformationGaps({ fields, sections });
	const legalApprover = findTeamMember(responseTeam, /\b(legal|security)\b/u);
	const dealDeskApprover = findTeamMember(responseTeam, /\bdeal\s+desk\b/u);
	const driverName = assignee.name || findTeamMember(responseTeam, /\bproposal\b/u)?.owner || "Proposal owner not specified";
	const approverNames = uniqueStrings([
		dealDeskApprover?.owner,
		legalApprover?.owner,
	]);
	const contributorNames = uniqueStrings([
		reporter.name,
		...responseTeam
			.filter((member) => !approverNames.includes(member.owner || "") && member.owner !== driverName)
			.map((member) => member.owner),
	]);
	const inProgressChildItems = childItems.filter((item) => /\bin progress\b/iu.test(item.status || ""));
	const todoChildItems = childItems.filter((item) => /\bto do\b/iu.test(item.status || ""));
	const relationshipEvidence = uniqueStrings([
		reporter.name ? `${reporter.name} is the account contact in the Work Item context` : null,
		assignee.name ? `${assignee.name} is driving proposal coordination` : null,
		...recentActivity.slice(0, 2).map((activity) => activity.content),
	]);
	const openGapItems = uniqueStrings([
		...informationGaps,
		...todoChildItems.map((item) => `${item.key || "Child item"} remains to do: ${item.summary}`),
		...inProgressChildItems.map((item) => `${item.key || "Child item"} is still in progress: ${item.summary}`),
	]);

	return {
		artifactTitle: `${customer} RFP qualification DACI`,
		author: assignee.name || reporter.name || "Unassigned owner",
		budgetText: dealSize
			? `${customer} scale is recorded as ${dealSize}; budget qualification still needs explicit owner confirmation before a full response commitment.`
			: `${customer} budget is not confirmed in the Work Item context; treat budget as a qualification gate before committing response capacity.`,
		calloutText: `Recommendation: respond only if ${customer} confirms budget, stakeholder access, and review owners for legal, security, pricing, and product commitments.`,
		campaignFitText: formatSeries([
			...buyerPriorities.slice(0, 2),
			...evaluationCriteria.slice(0, 2),
		], {
			empty: `${customer} campaign fit needs confirmation against enterprise service-management priorities.`,
			limit: 4,
		}),
		competitiveAdvantages: uniqueStrings(winThemes).length > 0
			? uniqueStrings(winThemes)
			: [
					"Atlassian System of Work can connect service, software, knowledge, and business teams.",
					"Rovo and Teamwork Graph can make RFP evidence reusable and contextual.",
				],
		contributorsText: contributorNames.length > 0
			? `Contributors: ${contributorNames.join(", ")}.`
			: "Contributors: sales engineering, product, legal, security, deal desk, and partner owners need assignment.",
		date: getNonEmptyString(fields["start date"]) || dueDate || new Date().toISOString().slice(0, 10),
		decisionRisks: uniqueStrings(knownRisks).length > 0
			? uniqueStrings(knownRisks)
			: ["Legal, security, pricing, product, and partner commitments still need review."],
		description: clipText(`${customer} RFP qualification DACI covering recommendation, roles, budget, relationship, campaign fit, advantages, risks, and open gaps.`, 150),
		docTitle: `${customer} RFP qualification DACI`,
		driverText: `Driver: ${driverName}.`,
		eyebrow: "RFP Qualification / DACI",
		footerLeft: "Internal qualification draft",
		footerRight: key ? `${key} · ${customer}` : customer,
		headline: `${customer} RFP qualification DACI`,
		includeAtlassianLogo: false,
		informedText: "Informed: response leadership, support, partner teams, and executive stakeholders after the bid/no-bid decision is recorded.",
		keywords: uniqueStrings([
			key,
			customer,
			"RFP qualification",
			"DACI",
			"bid recommendation",
		]).slice(0, 5).join(", "),
		metricPairs: [
			{ label: "client", value: customer },
			{ label: "decision", value: "Qualify" },
			{ label: "due", value: dueDate || "Gap" },
			{ label: "open gaps", value: String(openGapItems.length || 1) },
		],
		openGaps: openGapItems.length > 0 ? openGapItems : ["No open gaps were supplied in the Work Item context."],
		approverText: approverNames.length > 0
			? `Approver: ${approverNames.join(" and ")}.`
			: "Approver: deal desk plus legal/security approver not fully confirmed.",
		recommendationText: `Provisional recommendation: respond to ${customer} if the team confirms budget, stakeholder access, and review ownership for high-risk commitments before final drafting.`,
		relationshipText: formatSeries(relationshipEvidence, {
			empty: `${customer} stakeholder relationship strength is not documented; confirm champion and executive sponsor access.`,
			limit: 4,
		}),
		roadmap: [
			{ head: "Qualify", body: "Confirm budget, stakeholder access, and mandatory deal-breaker requirements before committing the full response team." },
			{ head: "Own", body: `Lock Driver, Approver, Contributors, and Informed stakeholders so risky ${customer} answers have named decision owners.` },
			{ head: "Respond", body: "Draft only after open gaps have owners and the bid/no-bid recommendation is recorded." },
		],
		statusText: fields.status ? `${fields.status} · ${fields.priority || "Priority unknown"}` : "Qualification draft",
		subtitle: `${key || "RFP"} · should we respond to this RFP?`,
		title,
		nextActions,
		attachments,
	};
}

module.exports = {
	buildFallbackDaciReportFields,
	buildFallbackReportFields,
	formatSeries,
	parseContextFieldSections,
	resolveWorkItemReportKind,
	sentence,
	uniqueStrings,
};

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {
	extractActiveWorkItemContext,
} = require("../../lib/work-item-report-intent");
const {
	createRepoAgentSkillHarness,
} = require("./agent-skill-harness");
const {
	getNonEmptyString,
	isObjectRecord,
} = require("./shared-utils");
const {
	buildFallbackDaciReportFields,
	buildFallbackReportFields,
	formatSeries,
	parseContextFieldSections,
	resolveWorkItemReportKind,
	sentence,
	uniqueStrings,
} = require("./work-item-vpk-html-report-fields");

const VPK_HTML_SKILL_NAME = "vpk-html";
const STATUS_REPORT_TEMPLATE_PATH = "assets/templates/status-report.html";
const DACI_ONE_PAGER_TEMPLATE_PATH = "assets/templates/one-pager.html";

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/gu, "&amp;")
		.replace(/</gu, "&lt;")
		.replace(/>/gu, "&gt;")
		.replace(/"/gu, "&quot;")
		.replace(/'/gu, "&#39;");
}

function formatListItemsHtml(items, {
	empty,
	limit = 6,
} = {}) {
	const values = uniqueStrings(items).slice(0, limit);
	const listItems = values.length > 0 ? values : [empty || "No evidence supplied in the Work Item context."];
	return listItems.map((item) => `<li>${escapeHtml(sentence(item))}</li>`).join("\n");
}

function parseJsonObjectFromText(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const stripped = text
		.replace(/^```(?:json)?\s*/iu, "")
		.replace(/\s*```$/u, "")
		.trim();
	const candidate = stripped.startsWith("{")
		? stripped
		: stripped.match(/\{[\s\S]*\}/u)?.[0];
	if (!candidate) {
		return null;
	}

	try {
		const parsed = JSON.parse(candidate);
		return isObjectRecord(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function pickDistilledString(distilledFields, key) {
	const value = distilledFields?.[key];
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function mergeDistilledReportFields(fallbackFields, distilledFields) {
	if (!isObjectRecord(distilledFields)) {
		return fallbackFields;
	}

	const overridableKeys = [
		"blockersText",
		"confidenceText",
		"executiveSummary",
		"milestonesText",
		"nextWindowText",
		"progressText",
		"summary",
		"whatChangedText",
	];
	const merged = {
		...fallbackFields,
	};

	for (const key of overridableKeys) {
		const value = pickDistilledString(distilledFields, key);
		if (value) {
			merged[key] = value;
		}
	}

	if (Array.isArray(distilledFields.informationGaps)) {
		const nextGaps = distilledFields.informationGaps
			.map((gap) => getNonEmptyString(gap))
			.filter(Boolean);
		if (nextGaps.length > 0) {
			merged.informationGaps = Array.from(new Set([
				...fallbackFields.informationGaps,
				...nextGaps,
			]));
		}
	}

	return merged;
}

function mergeDistilledDaciReportFields(fallbackFields, distilledFields) {
	if (!isObjectRecord(distilledFields)) {
		return fallbackFields;
	}

	const merged = {
		...fallbackFields,
	};
	const overridableStringKeys = [
		"budgetText",
		"calloutText",
		"campaignFitText",
		"contributorsText",
		"description",
		"driverText",
		"informedText",
		"approverText",
		"recommendationText",
		"relationshipText",
		"statusText",
		"subtitle",
	];
	for (const key of overridableStringKeys) {
		const value = pickDistilledString(distilledFields, key);
		if (value) {
			merged[key] = value;
		}
	}

	for (const [key, limit] of [
		["competitiveAdvantages", 6],
		["decisionRisks", 6],
		["openGaps", 6],
		["informationGaps", 6],
	]) {
		if (!Array.isArray(distilledFields[key])) {
			continue;
		}
		const values = uniqueStrings(distilledFields[key]).slice(0, limit);
		if (values.length === 0) {
			continue;
		}
		if (key === "informationGaps") {
			merged.openGaps = uniqueStrings([
				...merged.openGaps,
				...values,
			]);
			continue;
		}
		merged[key] = values;
	}
	if (distilledFields.includeAtlassianLogo === true) {
		merged.includeAtlassianLogo = true;
	}

	return merged;
}

async function distillStructuredReportFields({
	activeWorkItemContext,
	generateText,
	provider,
	reportKind = "status-report",
	signal,
}) {
	if (typeof generateText !== "function") {
		return null;
	}

	const isDaciReport = reportKind === "rfp-qualification-daci";
	const system = isDaciReport
		? [
				"You extract structured fields for an RFP qualification DACI one-pager.",
				"Use only facts present in the supplied context. Do not invent dates, owners, metrics, budget status, stakeholder relationships, or evidence.",
				"Return only valid JSON. No markdown.",
			].join(" ")
		: [
				"You extract structured fields for a Jira Work Item status report.",
				"Use only facts present in the supplied context. Do not invent dates, owners, metrics, or evidence.",
				"Return only valid JSON. No markdown.",
			].join(" ");
	const prompt = isDaciReport
		? [
				"Extract concise RFP qualification DACI fields from this Work Item context.",
				"Schema:",
				"{",
				'  "recommendationText": "one evidence-backed bid/no-bid recommendation paragraph",',
				'  "driverText": "Driver: name and role",',
				'  "approverText": "Approver: name(s) and role(s)",',
				'  "contributorsText": "Contributors: name(s) and role(s)",',
				'  "informedText": "Informed: group(s) or stakeholder(s)",',
				'  "relationshipText": "one paragraph on stakeholder relationship strength",',
				'  "budgetText": "one paragraph on whether client budget is qualified",',
				'  "campaignFitText": "one paragraph on campaign fit",',
				'  "competitiveAdvantages": ["concise advantages"],',
				'  "decisionRisks": ["concise decision risks"],',
				'  "openGaps": ["concise missing evidence statements"]',
				"}",
				"",
				activeWorkItemContext,
			].join("\n")
		: [
				"Extract concise report fields from this Work Item context.",
				"Schema:",
				"{",
				'  "summary": "one sentence",',
				'  "whatChangedText": "one evidence-backed paragraph",',
				'  "confidenceText": "one evidence-backed paragraph",',
				'  "progressText": "one evidence-backed paragraph",',
				'  "blockersText": "one evidence-backed paragraph",',
				'  "nextWindowText": "one evidence-backed paragraph",',
				'  "milestonesText": "one evidence-backed paragraph",',
				'  "informationGaps": ["concise missing evidence statements"]',
				"}",
				"",
				activeWorkItemContext,
			].join("\n");
	const rawText = await generateText({
		maxOutputTokens: 1600,
		prompt,
		provider,
		signal,
		system,
		temperature: 0.1,
	});

	return parseJsonObjectFromText(rawText);
}

function buildChecklistHtml(informationGaps) {
	const gaps = Array.isArray(informationGaps) && informationGaps.length > 0
		? informationGaps
		: ["No major information gaps were detected in the supplied Work Item context."];

	return [
		'\t\t<aside class="checklist">',
		"\t\t\t<h2>Information gaps</h2>",
		"\t\t\t<ul>",
		...gaps.slice(0, 6).map((gap) => `\t\t\t<li>${escapeHtml(gap)}</li>`),
		"\t\t\t</ul>",
		"\t\t</aside>",
	].join("\n");
}

function fillStatusReportTemplate(templateHtml, reportFields) {
	const escapedParagraph = (value) => escapeHtml(sentence(value));
	const replacements = new Map([
		["{{AUTHOR}}", escapeHtml(reportFields.author)],
		["{{BLOCKER_COUNT}}", escapeHtml(reportFields.blockerCount)],
		["{{CONFIDENCE}}", escapeHtml(reportFields.confidence)],
		["{{DATE}}", escapeHtml(reportFields.date)],
		["{{DESCRIPTION}}", escapeHtml(reportFields.description)],
		["{{DOC_TITLE}}", escapeHtml(reportFields.docTitle)],
		["{{KEYWORDS}}", escapeHtml(reportFields.keywords)],
		["{{REPORTING_PERIOD}}", escapeHtml(reportFields.reportingPeriod)],
		["{{TEAM_OR_CONTEXT}}", escapeHtml(reportFields.teamOrContext)],
		["{{What changed since the last update.}}", escapedParagraph(reportFields.whatChangedText)],
		["{{Current confidence and why.}}", escapedParagraph(reportFields.confidenceText)],
		["{{Shipped or completed work.}}", escapedParagraph(reportFields.progressText)],
		["{{Blocked or slipping work with owner and next action.}}", escapedParagraph(reportFields.blockersText)],
		["{{What happens next and what decision/help is needed.}}", escapedParagraph(reportFields.nextWindowText)],
		["{{Validation or delivery milestones.}}", escapedParagraph(reportFields.milestonesText)],
	]);

	let html = templateHtml;
	for (const [placeholder, value] of replacements) {
		html = html.split(placeholder).join(value);
	}

	html = html
		.replace(
			/<p class="summary">[\s\S]*?<\/p>/u,
			`<p class="summary">${escapeHtml(reportFields.summary)}</p>`,
		)
		.replace(
			/(<p class="source-label">Route hint<\/p>\s*)<p>[\s\S]*?<\/p>/u,
			`$1<p>${escapeHtml(reportFields.routeHint)}</p>`,
		)
		.replace(
			/<aside class="checklist">[\s\S]*?<\/aside>/u,
			buildChecklistHtml(reportFields.informationGaps),
		);

	return html;
}

function buildMetricHtml(metricPairs) {
	const metrics = Array.isArray(metricPairs) ? metricPairs.slice(0, 4) : [];
	while (metrics.length < 4) {
		metrics.push({ label: "metric", value: "Gap" });
	}

	return metrics.map((metric) => [
		'\t<div class="metric">',
		`\t\t<div class="metric-value">${escapeHtml(metric.value)}</div>`,
		`\t\t<div class="metric-label">${escapeHtml(metric.label)}</div>`,
		"\t</div>",
	].join("\n")).join("\n");
}

function buildRoadmapHtml(roadmap) {
	const steps = Array.isArray(roadmap) && roadmap.length >= 3
		? roadmap.slice(0, 3)
		: [
				{ head: "Qualify", body: "Confirm budget, stakeholders, and mandatory requirements." },
				{ head: "Own", body: "Lock DACI owners for risky commitments." },
				{ head: "Respond", body: "Draft only after the bid/no-bid decision is recorded." },
			];

	return steps.map((step, index) => [
		'\t\t<div class="tl-step">',
		`\t\t\t<div class="tl-year">Phase ${index + 1}</div>`,
		`\t\t\t<div class="tl-head">${escapeHtml(step.head)}</div>`,
		`\t\t\t<div class="tl-body">${escapeHtml(step.body)}</div>`,
		"\t\t</div>",
	].join("\n")).join("\n");
}

function fillDaciOnePagerTemplate(templateHtml, reportFields) {
	const metaReplacements = new Map([
		["{{AUTHOR}}", escapeHtml(reportFields.author)],
		["{{DESCRIPTION}}", escapeHtml(reportFields.description)],
		["{{DOC_TITLE}}", escapeHtml(reportFields.docTitle)],
		["{{KEYWORDS}}", escapeHtml(reportFields.keywords)],
	]);
	let html = templateHtml;
	for (const [placeholder, value] of metaReplacements) {
		html = html.split(placeholder).join(value);
	}

	const body = [
		'<body data-vpk-motion="document" data-vpk-docnav="true">',
		"<main>",
		"",
		'<div class="header">',
		reportFields.includeAtlassianLogo
			? [
					'\t<div aria-label="Atlassian" style="align-items:center;display:flex;gap:8px;margin-right:24px;min-width:132px;">',
					'\t\t<svg aria-hidden="true" focusable="false" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">',
					'\t\t\t<path d="M7.4 4.2c.5-.9 1.8-.9 2.3 0l6.6 11.6c.5.9-.1 2-1.1 2h-3.1c-.5 0-1-.3-1.2-.7L7.4 11 4 17.1c-.2.4-.7.7-1.2.7H.9c-1 0-1.6-1.1-1.1-2L7.4 4.2Z" fill="var(--primary-blue)" transform="translate(2 1)"/>',
					'\t\t\t<path d="M14.3 4.2c.5-.9 1.8-.9 2.3 0l7.6 13.6h-4.1c-.5 0-1-.3-1.2-.7L12.5 5.7l1.8-1.5Z" fill="var(--link)" transform="translate(-2 1)"/>',
					"\t\t</svg>",
					'\t\t<span style="color:var(--body-text);font-size:13px;font-weight:700;letter-spacing:0;">Atlassian</span>',
					"\t</div>",
				].join("\n")
			: "",
		'\t<div class="title-block">',
		`\t\t<div class="eyebrow">${escapeHtml(reportFields.eyebrow)}</div>`,
		`\t\t<h1>${escapeHtml(reportFields.headline)}</h1>`,
		`\t\t<div class="subtitle">${escapeHtml(reportFields.subtitle)}</div>`,
		"\t</div>",
		'\t<div class="meta">',
		`\t\t${escapeHtml(reportFields.author)}<br>`,
		`\t\t${escapeHtml(reportFields.date)}<br>`,
		`\t\t${escapeHtml(reportFields.statusText)}`,
		"\t</div>",
		"</div>",
		"",
		'<div class="metrics">',
		buildMetricHtml(reportFields.metricPairs),
		"</div>",
		"",
		`<p class="lead">${escapeHtml(sentence(reportFields.recommendationText))}</p>`,
		"",
		'<div class="two-col">',
		"\t<section>",
		"\t\t<h2>DACI roles</h2>",
		`\t\t<p>${escapeHtml("Decision-making ownership for the qualification phase is intentionally explicit so the response team can avoid drafting around unresolved approval gaps.")}</p>`,
		'\t\t<ul class="dash">',
		`\t\t\t<li>${escapeHtml(reportFields.driverText)}</li>`,
		`\t\t\t<li>${escapeHtml(reportFields.approverText)}</li>`,
		`\t\t\t<li>${escapeHtml(reportFields.contributorsText)}</li>`,
		`\t\t\t<li>${escapeHtml(reportFields.informedText)}</li>`,
		"\t\t</ul>",
		"\t</section>",
		"",
		"\t<section>",
		"\t\t<h2>Qualification readout</h2>",
		`\t\t<p>${escapeHtml(sentence(reportFields.relationshipText))}</p>`,
		'\t\t<ul class="dash">',
		`\t\t\t<li>${escapeHtml(sentence(reportFields.budgetText))}</li>`,
		`\t\t\t<li>${escapeHtml(sentence(reportFields.campaignFitText))}</li>`,
		`\t\t\t<li>${escapeHtml(`Competitive advantages: ${formatSeries(reportFields.competitiveAdvantages, { limit: 3 })}`)}</li>`,
		"\t\t</ul>",
		"\t</section>",
		"</div>",
		"",
		"<section>",
		"\t<h2>Decision path<span class=\"sub\">qualification before response drafting</span></h2>",
		'\t<div class="timeline">',
		buildRoadmapHtml(reportFields.roadmap),
		"\t</div>",
		"</section>",
		"",
		'<section>',
		"\t<h2>Decision risks and open gaps</h2>",
		'\t<div class="two-col">',
		"\t\t<div>",
		"\t\t\t<h3>Decision risks</h3>",
		'\t\t\t<ul class="dash">',
		formatListItemsHtml(reportFields.decisionRisks, { empty: "No decision risks were supplied in the Work Item context." }),
		"\t\t\t</ul>",
		"\t\t</div>",
		"\t\t<div>",
		"\t\t\t<h3>Open gaps</h3>",
		'\t\t\t<ul class="dash">',
		formatListItemsHtml(reportFields.openGaps, { empty: "No open gaps were supplied in the Work Item context." }),
		"\t\t\t</ul>",
		"\t\t</div>",
		"\t</div>",
		"</section>",
		"",
		`<div class="callout">${escapeHtml(sentence(reportFields.calloutText))}</div>`,
		"",
		'<div class="footer">',
		`\t<span>${escapeHtml(reportFields.footerLeft)}</span>`,
		`\t<span>${escapeHtml(reportFields.footerRight)}</span>`,
		"</div>",
		"",
		"</main>",
		"</body>",
	].join("\n");

	return html.replace(/<body\b[^>]*>[\s\S]*?<\/body>/u, body);
}

function assertVpkHtmlReportContract(html) {
	if (!/<!doctype html>/iu.test(html) || !/<html[\s>]/iu.test(html)) {
		throw new Error("vpk-html report generation did not return a complete HTML document.");
	}
	if (/\{\{[^}]+\}\}/u.test(html)) {
		throw new Error("vpk-html report generation left unresolved placeholders.");
	}
	if (!/<meta\s+name="generator"\s+content="vpk-html">/iu.test(html)) {
		throw new Error("vpk-html report generation did not preserve the generator metadata.");
	}
	if (!/font-family:\s*"Charlie Display"/u.test(html) || !/--grid-background/u.test(html) || !/(class="masthead"|class="header")/u.test(html)) {
		throw new Error("vpk-html report generation did not preserve the template visual identity.");
	}
	if (!/<main\b/iu.test(html)) {
		throw new Error("vpk-html report generation did not preserve the main landmark.");
	}
	if (
		/<script\b[^>]*\bsrc=["']https?:\/\//iu.test(html) ||
		/<link\b[^>]*\bhref=["']https?:\/\//iu.test(html) ||
		/<(?:img|source|iframe|audio|video|object|embed)\b[^>]*(?:src|data|poster)=["']https?:\/\//iu.test(html) ||
		/url\(\s*["']?https?:\/\//iu.test(html) ||
		/@import\s+(?:url\()?["']?https?:\/\//iu.test(html)
	) {
		throw new Error("vpk-html report generation included remote runtime dependencies.");
	}
}

async function runVpkHtmlValidationScripts({
	harness,
	html,
	runVisualVerify = false,
	signal,
}) {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-html-report-"));
	const reportPath = path.join(tempDir, "report.html");

	try {
		await fs.writeFile(reportPath, html, "utf8");
		const results = [];
		results.push(await harness.runSkillScript(
			VPK_HTML_SKILL_NAME,
			"scripts/build.mjs",
			["--check-placeholders", reportPath],
			{ signal },
		));
		results.push(await harness.runSkillScript(
			VPK_HTML_SKILL_NAME,
			"scripts/check-html.mjs",
			[reportPath],
			{ signal },
		));
		if (runVisualVerify) {
			results.push(await harness.runSkillScript(
				VPK_HTML_SKILL_NAME,
				"scripts/build.mjs",
				["--verify", reportPath],
				{ signal, timeoutMs: 60_000 },
			));
		}
		return {
			reportPath,
			results,
		};
	} finally {
		await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
}

async function generateWorkItemVpkHtmlReport({
	contextDescription,
	generateText,
	harness = createRepoAgentSkillHarness(),
	provider,
	runSkillValidation = true,
	runVisualVerify = false,
	signal,
} = {}) {
	const activeWorkItemContext = extractActiveWorkItemContext(contextDescription);
	if (!activeWorkItemContext) {
		throw new Error("Cannot generate a vpk-html Work Item report without active Work Item context.");
	}

	const skillMetadata = await harness.loadSkillMetadata(VPK_HTML_SKILL_NAME);
	const skill = await harness.loadSkill(VPK_HTML_SKILL_NAME);
	const reportKind = resolveWorkItemReportKind(activeWorkItemContext);
	const templatePath = reportKind === "rfp-qualification-daci"
		? DACI_ONE_PAGER_TEMPLATE_PATH
		: STATUS_REPORT_TEMPLATE_PATH;
	const templateHtml = await harness.readSkillFile(
		VPK_HTML_SKILL_NAME,
		templatePath,
	);
	const fallbackFields = reportKind === "rfp-qualification-daci"
		? buildFallbackDaciReportFields(activeWorkItemContext)
		: buildFallbackReportFields(activeWorkItemContext);
	let distilledFields = null;
	try {
		distilledFields = await distillStructuredReportFields({
			activeWorkItemContext,
			generateText,
			provider,
			reportKind,
			signal,
		});
	} catch (error) {
		console.warn(
			"[VPK-HTML] AI Gateway report distillation failed; using deterministic Work Item fields:",
			error instanceof Error ? error.message : error,
		);
	}

	const reportFields = reportKind === "rfp-qualification-daci"
		? mergeDistilledDaciReportFields(fallbackFields, distilledFields)
		: mergeDistilledReportFields(fallbackFields, distilledFields);
	const html = reportKind === "rfp-qualification-daci"
		? fillDaciOnePagerTemplate(templateHtml, reportFields)
		: fillStatusReportTemplate(templateHtml, reportFields);
	assertVpkHtmlReportContract(html);
	const validation = runSkillValidation
		? await runVpkHtmlValidationScripts({
				harness,
				html,
				runVisualVerify,
				signal,
			})
		: null;

	return {
		artifactTitle: reportFields.artifactTitle,
		html,
		skill: {
			description: skillMetadata.description,
			name: skill.name,
			root: skill.skillRoot,
			templatePath,
		},
		validation,
	};
}

module.exports = {
	DACI_ONE_PAGER_TEMPLATE_PATH,
	STATUS_REPORT_TEMPLATE_PATH,
	VPK_HTML_SKILL_NAME,
	assertVpkHtmlReportContract,
	buildFallbackDaciReportFields,
	buildFallbackReportFields,
	fillDaciOnePagerTemplate,
	fillStatusReportTemplate,
	generateWorkItemVpkHtmlReport,
	parseContextFieldSections,
	runVpkHtmlValidationScripts,
};

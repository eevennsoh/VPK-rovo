const assert = require("node:assert/strict");
const test = require("node:test");

const model = import("./inline-comments.ts");

function createFile() {
	return {
		id: "profile",
		path: "src/profile.ts",
		status: "modified",
		language: "typescript",
		oldContents: "const name = 'old';\r\nreturn name;",
		newContents: "const name = 'new';\nreturn name.trim();",
		additions: 2,
		deletions: 2,
		defaultExpanded: true,
	};
}

function createDraft(id, overrides = {}) {
	return {
		id,
		fileId: "profile",
		filePath: "src/profile.ts",
		side: "additions",
		lineNumber: 2,
		lineText: "return name.trim();",
		body: "",
		...overrides,
	};
}

test("inline comment drafts can be created, updated, committed, and cancelled", async () => {
	const {
		EMPTY_INLINE_COMMENT_STATE,
		cancelInlineCommentDraft,
		commitInlineCommentDraft,
		createInlineCommentDraft,
		updateInlineCommentDraft,
	} = await model;

	let state = createInlineCommentDraft(EMPTY_INLINE_COMMENT_STATE, createDraft("draft-1"));
	state = createInlineCommentDraft(state, createDraft("draft-2", { lineNumber: 1 }));
	state = updateInlineCommentDraft(state, "draft-1", "  Handle the empty name.  ");
	state = commitInlineCommentDraft(state, "draft-1");
	state = cancelInlineCommentDraft(state, "draft-2");

	assert.deepEqual(state.drafts, []);
	assert.equal(state.comments.length, 1);
	assert.equal(state.comments[0].id, "draft-1");
	assert.equal(state.comments[0].body, "Handle the empty name.");
});

test("whitespace-only drafts remain editable and are not committed", async () => {
	const {
		EMPTY_INLINE_COMMENT_STATE,
		commitInlineCommentDraft,
		createInlineCommentDraft,
	} = await model;

	const state = createInlineCommentDraft(
		EMPTY_INLINE_COMMENT_STATE,
		createDraft("draft-1", { body: " \n\t " }),
	);

	assert.equal(commitInlineCommentDraft(state, "draft-1"), state);
});

test("multiple comments can be committed to the same file side and line", async () => {
	const {
		EMPTY_INLINE_COMMENT_STATE,
		commitInlineCommentDraft,
		createInlineCommentDraft,
	} = await model;

	let state = EMPTY_INLINE_COMMENT_STATE;
	state = createInlineCommentDraft(state, createDraft("draft-1", { body: "First" }));
	state = createInlineCommentDraft(state, createDraft("draft-2", { body: "Second" }));
	state = commitInlineCommentDraft(state, "draft-1");
	state = commitInlineCommentDraft(state, "draft-2");

	assert.deepEqual(state.comments.map((comment) => comment.body), ["First", "Second"]);
});

test("individual and bulk removal leave unfinished drafts untouched", async () => {
	const {
		removeAllInlineComments,
		removeInlineComment,
	} = await model;
	const draft = createDraft("draft-open");
	const first = createDraft("comment-1", { body: "First" });
	const second = createDraft("comment-2", { body: "Second" });

	const afterOne = removeInlineComment(
		{ drafts: [draft], comments: [first, second] },
		"comment-1",
	);
	assert.deepEqual(afterOne.comments, [second]);
	assert.deepEqual(afterOne.drafts, [draft]);

	const afterAll = removeAllInlineComments(afterOne);
	assert.deepEqual(afterAll.comments, []);
	assert.deepEqual(afterAll.drafts, [draft]);
});

test("line text resolution uses one-based old and new source lines", async () => {
	const { resolveInlineCommentLineText } = await model;
	const file = createFile();

	assert.equal(resolveInlineCommentLineText(file, "deletions", 1), "const name = 'old';");
	assert.equal(resolveInlineCommentLineText(file, "additions", 2), "return name.trim();");
	assert.equal(resolveInlineCommentLineText(file, "additions", 0), "");
	assert.equal(resolveInlineCommentLineText(file, "additions", 99), "");
});

test("AI context serialization is deterministic and preserves creation order", async () => {
	const { serializeInlineCommentsContext } = await model;
	const workItem = {
		key: "TWC-109",
		title: "Validate quantities",
		environment: "Development",
		repoName: "vitafleet-frontend",
		branchName: "feature/validate-quantity",
	};
	const comments = [
		createDraft("comment-1", { body: "Handle blank input." }),
		createDraft("comment-2", {
			body: "Keep the old behavior covered.",
			side: "deletions",
			lineNumber: 1,
			lineText: "const name = 'old';",
		}),
	];

	assert.equal(
		serializeInlineCommentsContext(workItem, comments),
		[
			"Inline code review comments (local prompt context):",
			"Work item: TWC-109 Validate quantities",
			"Repository: vitafleet-frontend",
			"Branch: feature/validate-quantity",
			"",
			"Comment 1:",
			"File: src/profile.ts",
			"Side: new",
			"Line: 2",
			"Exact code line: \"return name.trim();\"",
			"Review comment: Handle blank input.",
			"",
			"Comment 2:",
			"File: src/profile.ts",
			"Side: old",
			"Line: 1",
			"Exact code line: \"const name = 'old';\"",
			"Review comment: Keep the old behavior covered.",
		].join("\n"),
	);
	assert.equal(serializeInlineCommentsContext(workItem, []), "");
});

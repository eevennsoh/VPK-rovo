const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function getIconPaths(source) {
	return [...source.matchAll(/iconPath: "([^"]+)"/gu)].map((match) => match[1]);
}

const PROMPT_GALLERY_SOURCE = readProjectFile("components/blocks/prompt-gallery/page.tsx");
const PROMPT_GALLERY_DATA_SOURCE = readProjectFile("components/blocks/prompt-gallery/data/example-data.ts");
const CHAT_GALLERY_DATA_SOURCE = readProjectFile("components/blocks/chat-gallery/data/example-data.ts");
const ROVO_COMPOSER_SOURCE = readProjectFile("components/projects/rovo/components/rovo-app-composer.tsx");

test("Prompt gallery pills do not preview prompts on hover", () => {
	assert.doesNotMatch(PROMPT_GALLERY_SOURCE, /onMouseEnter=\{\(\) => handlePreviewStart\(suggestionPrompt\)\}/u);
	assert.doesNotMatch(PROMPT_GALLERY_SOURCE, /onMouseLeave=\{handlePreviewEnd\}/u);
	assert.match(PROMPT_GALLERY_SOURCE, /<span className="min-w-0 truncate">\{suggestion\.label\}<\/span>/u);
});

test("Rovo composer preview placeholder stays one line with ellipsis", () => {
	assert.match(ROVO_COMPOSER_SOURCE, /previewPromptHeight: baseTextareaHeight/u);
	assert.match(
		ROVO_COMPOSER_SOURCE,
		/\.chat-composer-textarea\.chat-composer-textarea-preview-active:placeholder-shown \{[\s\S]*white-space: nowrap;[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;/u,
	);
	assert.match(
		ROVO_COMPOSER_SOURCE,
		/\.chat-composer-textarea\.chat-composer-textarea-preview-active::placeholder \{[\s\S]*white-space: nowrap;[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;/u,
	);
});

test("Prompt gallery illustration paths resolve to public assets", () => {
	for (const source of [PROMPT_GALLERY_DATA_SOURCE, CHAT_GALLERY_DATA_SOURCE]) {
		assert.doesNotMatch(source, /\/illustration\/rich-icon\/[^"]+\/standard\.png/u);

		for (const iconPath of getIconPaths(source)) {
			assert.equal(path.isAbsolute(iconPath), true, `${iconPath} should be an absolute public path`);
			assert.equal(
				fs.existsSync(path.join(process.cwd(), "public", iconPath.slice(1))),
				true,
				`${iconPath} should exist in public/`,
			);
		}
	}
});

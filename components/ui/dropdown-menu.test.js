const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
	path.join(__dirname, "dropdown-menu.tsx"),
	"utf8",
);

test("dropdown menu popup uses a 12px container radius", () => {
	assert.match(source, /popup:\s*"[^"]*\brounded-xl\b/u);
	assert.doesNotMatch(source, /popup:\s*"[^"]*\brounded-lg\b/u);
});

test("dropdown menu front slot icons use a 24px subtle icon container", () => {
	assert.match(source, /const dropdownMenuFrontSlotClassName =\s*"inline-flex size-6 shrink-0 items-center justify-center text-icon-subtle/u);
	assert.match(source, /<span className=\{dropdownMenuFrontSlotClassName\}>/u);
	assert.doesNotMatch(source, /elemBefore \? \([\s\S]*?<span className=\{cn\("inline-flex h-5/u);
});

test("dropdown menu selected indicator uses a 24px container aligned with item icons", () => {
	assert.match(source, /indicator:\s*"pointer-events-none absolute left-2 inline-flex size-6 items-center justify-center text-icon-selected/u);
});

test("dropdown menu rows use an 8px item radius", () => {
	assert.match(source, /selectableItem:\s*"[^"]*\brounded-lg\b/u);
	assert.match(source, /data-slot="dropdown-menu-item"[\s\S]*\brounded-lg\b/u);
	assert.match(source, /data-slot="dropdown-menu-sub-trigger"[\s\S]*\brounded-lg\b/u);
	assert.doesNotMatch(source, /\brounded-sm\b/u);
});

test("dropdown menu shortcut strings render as VPK keycaps", () => {
	assert.match(source, /import \{ Kbd, KbdGroup \} from "@\/components\/ui\/kbd";/u);
	assert.match(source, /function DropdownMenuShortcutKeys\(\{ shortcut \}: Readonly<\{ shortcut: string \}>\)/u);
	assert.match(source, /<DropdownMenuShortcutKeys shortcut=\{children\} \/>/u);
	assert.match(source, /<KbdGroup>[\s\S]*<Kbd key=\{`\$\{key\}-\$\{index\}`\}>\{key\}<\/Kbd>[\s\S]*<\/KbdGroup>/u);
	assert.match(source, /return <Kbd>\{trimmedShortcut\}<\/Kbd>;/u);
});

test("dropdown menu single rows lock to a fixed 32px height", () => {
	assert.match(source, /const dropdownMenuRowHeightClassName = "h-8 py-0";/u);
	assert.match(
		source,
		/shouldWrapText \? dropdownMenuWrappingRowClassName : dropdownMenuRowHeightClassName/u,
	);
	assert.match(
		source,
		/allowTextWrap \? dropdownMenuWrappingRowClassName : dropdownMenuRowHeightClassName/u,
	);
});

test("dropdown menu rows only use vertical padding when text can wrap", () => {
	assert.match(
		source,
		/const dropdownMenuWrappingRowClassName = "min-h-8 py-1\.5";/u,
	);
	assert.match(source, /allowTextWrap\?: boolean;/u);
	assert.match(
		source,
		/const shouldWrapText = allowTextWrap \|\| Boolean\(description\);/u,
	);
	assert.match(
		source,
		/shouldWrapText \? "whitespace-normal break-words" : "truncate"/u,
	);
});

test("dropdown menu item maps onSelect to Base UI click activation", () => {
	assert.match(
		source,
		/type DropdownMenuItemClickHandler = NonNullable<MenuPrimitive\.Item\.Props\["onClick"\]>;/u,
	);
	assert.match(
		source,
		/interface DropdownMenuItemProps extends Omit<MenuPrimitive\.Item\.Props, "onSelect">/u,
	);
	assert.match(
		source,
		/const handleClick: DropdownMenuItemClickHandler = \(event\) => \{\s*onClick\?\.\(event\);[\s\S]*onSelect\?\.\(event\);[\s\S]*event\.preventBaseUIHandler\(\);[\s\S]*\};/u,
	);
	assert.match(source, /onClick=\{handleClick\}/u);
});

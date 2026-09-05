# Production Checks

Run these checks after changing the skill, templates, theme, scripts, assets, or
examples:

```bash
node .agents/skills/vpk-html/scripts/ensure-fonts.mjs
node .agents/skills/vpk-html/scripts/build.mjs --sync
node .agents/skills/vpk-html/scripts/build.mjs --check-templates
node .agents/skills/vpk-html/scripts/build.mjs --check-evals
pnpm run lint
pnpm run typecheck
```

When changing the shared color/font contract, edit `references/tokens.json`,
then regenerate and check the mirrored CSS:

```bash
node .agents/skills/vpk-html/scripts/build.mjs --write-styles
node .agents/skills/vpk-html/scripts/build.mjs --sync
```

Do not hand-edit token copies into individual demos or templates. Port scripts
should import `scripts/shared.mjs` and inline the shared block, font stacks, and
Kami-to-VPK color map from there.

Routine user renders require:

```bash
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders artifacts/vpk-html/<slug>/<slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --verify artifacts/vpk-html/<slug>/<slug>.html
node .agents/skills/vpk-html/scripts/check-html.mjs artifacts/vpk-html/<slug>/<slug>.html
```

Each generated user artifact should live in its own ignored folder at
`artifacts/vpk-html/<slug>/`. Keep PDFs, screenshots, and local validation captures
for that artifact inside the same folder, using a nested `screenshots/` folder
when there are many images.

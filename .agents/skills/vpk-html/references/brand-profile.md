# Brand profile

An **optional**, offline personalization layer. When present, vpk-html documents
adopt the author's identity and a single accent hue without leaving the Atlassian
deck identity. There is **no runtime** — the skill agent reads this profile and
bakes the values into the output while filling the template (see SKILL.md Step 0).

## Location

- Primary: `~/.config/vpk-html/brand.md`
- Fallback: `~/.vpk-html/brand.md`

If neither exists, render with the built-in identity (Atlassian blue accent, no
logo). The profile is never required.

## Format

YAML frontmatter + freeform Markdown habit notes:

```markdown
---
author: Jordan Lee
name: Jordan Lee
role: Staff Engineer
email: jordan@example.com
website: jordanlee.dev
company: Northwind
brand_color: "#6554C0"      # single accent hue (hex)
logo: ~/brand/northwind.png # local image; base64-inlined at fill time
---

# Habit notes

- Prefer plain, declarative subject lines over clever ones.
- In status reports, lead with what slipped, not what shipped.
- Never use exclamation marks in formal letters.
```

Frontmatter keys are all optional. Habit notes are prose guidance you apply with
editorial judgment — they are *defaults*, not hard rules.

## Precedence

Highest wins:

1. **Explicit prompt** — what the user says for this specific document.
2. **Editorial judgment** — the right call for this genre/audience.
3. **Habit notes** — the prose preferences above.
4. **Frontmatter** — the structured identity values.
5. **Built-in default** — Atlassian identity, blue accent, no logo.

## How the agent bakes it (offline)

There is no build step that reads this file. While filling the template:

### Layer A — identity substitution

Fill `{{AUTHOR}}` / `{{NAME}}` / role / `{{email}}` / `{{PAGE / CONTACT}}` /
company placeholders from frontmatter, unless the prompt overrides them.

### Layer C — brand color (hue-on-accent)

If `brand_color` is set, change the inline alias:

```css
/* from */ --brand: var(--primary-blue);
/* to   */ --brand: var(--ds-brand-override, #6554C0);
```

- Stays **offline** (no remote) and **check-clean**: `check-html.mjs` exempts
  `--x: var(--ds-…, #hex)` as a semantic fallback. `--ds-brand-override` is
  intentionally undefined, so it resolves to the hex.
- This is **hue-on-accent only.** It re-tints `var(--brand)` usages (mastheads,
  emphasis, accent rules). It does **not** replace `--primary-blue`, status
  colors, or neutrals — the ADS palette stays in force. Do not rewrite the
  palette to match a brand; vpk-html is an Atlassian-identity system with a
  tintable accent, not a white-label themer.

### Logo

If `logo:` resolves to a local image, base64-inline it into the header slot as a
`data:image/<type>;base64,…` URI (already exempt from the remote-asset check).
Never emit a remote URL or a local file path. If the logo is missing or the
profile is absent, render no logo.

## Verification

A document baked from a profile must still pass the full offline gate:

```bash
node scripts/check-html.mjs <output>.html   # no {{...}}, no remote refs, brand override clean
```

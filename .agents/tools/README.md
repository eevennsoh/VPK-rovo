# Tools

Declarative tool manifests that agents and skills can reference by `name`. Each
tool is a single Markdown file with YAML frontmatter describing its contract,
followed by usage notes.

A tool manifest is **declarative**: it documents the intended capability,
inputs/outputs, auth scopes, and safety class. Wiring a manifest to a real
runtime (an MCP server, REST connector, or built-in) is a separate, gated step —
record connector status in the relevant agent's `## Maintenance Notes`.

## File shape

```yaml
---
name: tool-name                # lowercase-hyphenated, matches the filename stem
description: One line on what the tool does and when to use it.
type: mcp | rest | builtin     # how it is (or will be) implemented
provider: jira | confluence | jsm | bitbucket | system   # source system
safety: read | write | destructive   # blast radius; gate write/destructive
scopes: ["read:jira-work"]     # required auth scopes, if any
inputs:
  - name: param
    type: string
    required: true
    description: What it is.
outputs:
  description: What the tool returns.
---
```

## Conventions

- `read` tools may run freely; `write` tools require user confirmation;
  `destructive` tools (delete/close/bulk-edit) require explicit, per-call
  confirmation.
- Keep one capability per file. Prefer composing small tools over one mega-tool.
- Document a concrete example invocation in the body.

---
name: jira-create-issue
description: Create a Jira issue (bug, story, task) with summary, description,
  priority, labels, and assignee. Use to file triaged work or convert action
  items and postmortem follow-ups into trackable issues.
type: mcp
provider: jira
safety: write
scopes: ["write:jira-work"]
inputs:
  - name: project
    type: string
    required: true
    description: Project key, e.g. ENG.
  - name: issueType
    type: string
    required: true
    description: Bug | Story | Task | Spike.
  - name: summary
    type: string
    required: true
    description: One-line title.
  - name: description
    type: string
    required: false
    description: Body, ideally with repro steps / acceptance criteria.
  - name: priority
    type: string
    required: false
    description: P0..P4 or the project's priority names.
  - name: labels
    type: string[]
    required: false
  - name: assignee
    type: string
    required: false
outputs:
  description: The created issue key and URL.
---

## Usage

Write tool — always confirm the field values with the user before creating.
Pair with `jira-search` first to avoid creating a duplicate. Good for turning
postmortem action items into owned issues.

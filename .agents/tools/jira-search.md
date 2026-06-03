---
name: jira-search
description: Search Jira issues with JQL and return a compact list of matching
  issues. Use to find duplicates, build backlogs, or gather sprint data.
type: mcp
provider: jira
safety: read
scopes: ["read:jira-work"]
inputs:
  - name: jql
    type: string
    required: true
    description: A valid JQL query, e.g. 'project = ENG AND status = "Needs triage"'.
  - name: fields
    type: string[]
    required: false
    description: Fields to return. Default summary,status,priority,assignee,labels.
  - name: maxResults
    type: number
    required: false
    description: Page size (default 50, max 100).
outputs:
  description: List of issues with key, summary, status, priority, assignee, labels.
---

## Usage

Use this to power triage and reporting. Examples:

- Find unsorted work: `project = ENG AND labels = needs-triage ORDER BY created ASC`
- Find potential duplicates: `project = ENG AND text ~ "SSO 500" AND statusCategory != Done`
- Sprint scope: `sprint = 42 ORDER BY priority DESC`

Read-only. Safe to call without confirmation.

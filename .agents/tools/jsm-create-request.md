---
name: jsm-create-request
description: Create a Jira Service Management request (customer-facing ticket) or
  escalate an incident. Use to log support requests, raise incidents, or convert
  an alert into a tracked service request with the right request type and
  priority.
type: mcp
provider: jsm
safety: write
scopes: ["write:servicedesk-request"]
inputs:
  - name: serviceDeskId
    type: string
    required: true
    description: Target service desk / project.
  - name: requestTypeId
    type: string
    required: true
    description: e.g. "Report a bug", "Incident", "Access request".
  - name: summary
    type: string
    required: true
  - name: description
    type: string
    required: false
  - name: priority
    type: string
    required: false
    description: P0..P4 or the desk's priority scheme.
  - name: reporter
    type: string
    required: false
    description: Customer/account the request is on behalf of.
outputs:
  description: The created request key, status, and customer portal URL.
---

## Usage

Write tool — confirm request type and priority before creating. For incidents,
set priority from the severity model and link the originating alert. Pair with a
search first to avoid duplicate tickets for the same outage.

---
name: confluence-search
description: Search Confluence pages with CQL and return matching pages with
  metadata. Use to audit docs, find duplicates/overlap, and locate the canonical
  page on a topic.
type: mcp
provider: confluence
safety: read
scopes: ["read:confluence-content.summary"]
inputs:
  - name: cql
    type: string
    required: true
    description: A valid CQL query, e.g. 'space = ENG AND type = page AND text ~ "onboarding"'.
  - name: fields
    type: string[]
    required: false
    description: Default title,space,lastUpdated,owner,labels,url.
  - name: maxResults
    type: number
    required: false
    description: Page size (default 25).
outputs:
  description: List of pages with title, space, last updated, owner, labels, url.
---

## Usage

Powers documentation audits. Examples:

- Stale pages: `space = ENG AND lastModified < now("-180d") ORDER BY lastModified ASC`
- Topic overlap: `space = ENG AND title ~ "onboarding"`
- Ownerless content: pair results with the freshness policy to flag missing owners.

Read-only. Safe to call without confirmation.

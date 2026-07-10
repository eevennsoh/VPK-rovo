# Linear GraphQL

Use this skill for raw Linear GraphQL work during local `vpk-symphony`
invocations that need to bootstrap or update Linear.

## Preferred creation path

Use direct Linear GraphQL over HTTPS with local auth. This is the default and
best proven path for this repository because company policy does not expose an
injected `linear_graphql` tool to Codex workers.

Default requirements:

- Load `LINEAR_API_KEY` and `SYMPHONY_LINEAR_PROJECT_SLUG` from the shell
  environment or ignored `.env.local`.
- POST one GraphQL operation at a time to `https://api.linear.app/graphql` with
  `Authorization: <LINEAR_API_KEY>` and `Content-Type: application/json`.
- Never print, commit, or include the token in issue text, comments, logs, or
  final responses.
- Use the same query and mutation documents in this reference. The transport
  changes; the schema-safe operation shapes do not.
- Treat missing local auth, missing project slug, unresolved project/team/state,
  HTTP errors, sandbox/network allowlist failures, or top-level GraphQL
  `errors` as real blockers only after this direct path has been attempted.
- If the HTTPS request is blocked by the current sandbox or network allowlist,
  immediately rerun the same request with the required approval/escalation for
  `api.linear.app` in the same turn. Do not stop at a status update, skip Linear
  issue creation, or continue as Symphony-managed work without an issue. Report
  Linear as blocked only if the escalated request is denied or still fails.

Default creation sequence:

1. Load `LINEAR_API_KEY` and `SYMPHONY_LINEAR_PROJECT_SLUG` from the shell or
   ignored `.env.local`.
2. Query `ProjectBySlug` using `SYMPHONY_LINEAR_PROJECT_SLUG`.
3. Resolve a team from that project and choose that team's `Todo` state.
4. Derive a concise title and scoped description from the actual user request.
5. Run `issueCreate` with `teamId`, `projectId`, `stateId`, `title`, and
   `description`.
6. Print only the created issue identifier, URL, and state. Never print the
   token or raw request headers.

## Discovering unfamiliar operations

When you need an unfamiliar mutation, input type, or object field, use targeted
introspection through direct local-auth GraphQL.

List mutation names:

```graphql
query ListMutations {
  __type(name: "Mutation") {
    fields {
      name
    }
  }
}
```

Inspect a specific input object:

```graphql
query CommentCreateInputShape {
  __type(name: "CommentCreateInput") {
    inputFields {
      name
      type {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
}
```

## Common workflows

### Create a Symphony issue from an ad-hoc request

Use this when `vpk-symphony` is invoked with a task-like request but no existing
Linear issue identifier or URL.

1. Resolve the configured Symphony project from `SYMPHONY_LINEAR_PROJECT_SLUG`
   or the rendered `WORKFLOW.md`.
2. Resolve a team for that project and the team's `Todo` state.
3. Create one issue with a concise title, scoped description, project id, team
   id, and `Todo` state id.
4. Return the created issue identifier and URL before continuing.

Do not hardcode examples or project/team ids. When the exact schema shape is
unclear, use the introspection patterns in this file to inspect `IssueCreateInput`,
`Project`, `ProjectFilter`, and relevant connection fields before mutating.

Useful project lookup pattern:

```graphql
query ProjectBySlug($slug: String!) {
  projects(filter: { slugId: { eq: $slug } }, first: 1) {
    nodes {
      id
      name
      slugId
      teams {
        nodes {
          id
          key
          name
          states {
            nodes {
              id
              name
              type
            }
          }
        }
      }
    }
  }
}
```

If the project lookup does not expose a usable team, infer the team from an
existing issue in the same project or stop with a precise blocker. Do not create
an issue in an arbitrary team.

Create the issue only after resolving the real ids:

```graphql
mutation CreateIssue(
  $teamId: String!
  $projectId: String
  $stateId: String
  $title: String!
  $description: String!
) {
  issueCreate(
    input: {
      teamId: $teamId
      projectId: $projectId
      stateId: $stateId
      title: $title
      description: $description
    }
  ) {
    success
    issue {
      id
      identifier
      title
      url
      state {
        id
        name
      }
      project {
        id
        name
      }
    }
  }
}
```

If the current schema rejects nullable optional fields, omit `projectId` or
`stateId` from the input instead of passing `null`.

Use this description shape for ticket bootstrap:

```markdown
Requested through `vpk-symphony` ad-hoc bootstrap.

Original request:
> <verbatim user request>

Scope:
- Classification: <implementation | answer-only | investigation | review>
- Expected output: <workpad answer | PR | browser evidence | other>

Acceptance / validation:
- <explicit user-provided checks, or "derive during kickoff">
```

### Query an issue by key, identifier, or id

Use these progressively:

- Start with `issue(id: $key)` when you have a ticket key such as `MT-686`.
- Fall back to `issues(filter: ...)` when you need identifier search semantics.
- Once you have the internal issue id, prefer `issue(id: $id)` for narrower reads.

Lookup by issue key:

```graphql
query IssueByKey($key: String!) {
  issue(id: $key) {
    id
    identifier
    title
    state {
      id
      name
      type
    }
    project {
      id
      name
    }
    branchName
    url
    description
    updatedAt
    links {
      nodes {
        id
        url
        title
      }
    }
  }
}
```

Lookup by identifier filter:

```graphql
query IssueByIdentifier($identifier: String!) {
  issues(filter: { identifier: { eq: $identifier } }, first: 1) {
    nodes {
      id
      identifier
      title
      state {
        id
        name
        type
      }
      project {
        id
        name
      }
      branchName
      url
      description
      updatedAt
    }
  }
}
```

Resolve a key to an internal id:

```graphql
query IssueByIdOrKey($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
  }
}
```

Read the issue once the internal id is known:

```graphql
query IssueDetails($id: String!) {
  issue(id: $id) {
    id
    identifier
    title
    url
    description
    state {
      id
      name
      type
    }
    project {
      id
      name
    }
    attachments {
      nodes {
        id
        title
        url
        sourceType
      }
    }
  }
}
```

### Query team workflow states for an issue

Use this before changing issue state when you need the exact `stateId`:

```graphql
query IssueTeamStates($id: String!) {
  issue(id: $id) {
    id
    team {
      id
      key
      name
      states {
        nodes {
          id
          name
          type
        }
      }
    }
  }
}
```

### Edit an existing comment

Use `commentUpdate` through the active Linear GraphQL transport:

```graphql
mutation UpdateComment($id: String!, $body: String!) {
  commentUpdate(id: $id, input: { body: $body }) {
    success
    comment {
      id
      body
    }
  }
}
```

### Create a comment

Use `commentCreate` through the active Linear GraphQL transport:

```graphql
mutation CreateComment($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment {
      id
      url
    }
  }
}
```

### Move an issue to a different state

Use `issueUpdate` with the destination `stateId`:

```graphql
mutation MoveIssueToState($id: String!, $stateId: String!) {
  issueUpdate(id: $id, input: { stateId: $stateId }) {
    success
    issue {
      id
      identifier
      state {
        id
        name
      }
    }
  }
}
```

### Attach a GitHub PR to an issue

Use the GitHub-specific attachment mutation when linking a PR:

```graphql
mutation AttachGitHubPR($issueId: String!, $url: String!, $title: String) {
  attachmentLinkGitHubPR(
    issueId: $issueId
    url: $url
    title: $title
    linkKind: links
  ) {
    success
    attachment {
      id
      title
      url
    }
  }
}
```

If you only need a plain URL attachment and do not care about GitHub-specific
link metadata, use:

```graphql
mutation AttachURL($issueId: String!, $url: String!, $title: String) {
  attachmentLinkURL(issueId: $issueId, url: $url, title: $title) {
    success
    attachment {
      id
      title
      url
    }
  }
}
```

### Introspection patterns used during schema discovery

Use these when the exact field or mutation shape is unclear:

```graphql
query QueryFields {
  __type(name: "Query") {
    fields {
      name
    }
  }
}
```

```graphql
query IssueFieldArgs {
  __type(name: "Query") {
    fields {
      name
      args {
        name
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
  }
}
```

### Upload media to a comment

Do this in three steps:

1. Call `fileUpload` through the active Linear GraphQL transport to get
   `uploadUrl`, `assetUrl`, and any required upload headers.
2. Upload the local file bytes to `uploadUrl` with `curl -X PUT` and the exact
   headers returned by `fileUpload`.
3. Call the active Linear GraphQL transport again with `commentCreate` (or
   `commentUpdate`) and include the resulting `assetUrl` in the comment body.

Use the actual MIME type and size of the file. Common Symphony evidence types
are `image/png` for screenshots, `image/gif` for short inline motion previews,
and `video/webm` for recordings. For screenshots and GIF previews, request a
public upload and embed the uploaded asset with markdown image syntax
(`![alt text](assetUrl)`) so Linear shows the image inline. Public uploads are
for images, so upload WebM recordings with `makePublic: false`, place the
`assetUrl` on its own line, and treat it as downloadable recording evidence
rather than a guaranteed playable Linear preview.

Useful mutations:

```graphql
mutation FileUpload(
  $filename: String!
  $contentType: String!
  $size: Int!
  $makePublic: Boolean
) {
  fileUpload(
    filename: $filename
    contentType: $contentType
    size: $size
    makePublic: $makePublic
  ) {
    success
    uploadFile {
      uploadUrl
      assetUrl
      headers {
        key
        value
      }
    }
  }
}
```

## Usage rules

- For task-like `vpk-symphony` invocations without an issue identifier, attempt
  `issueCreate` before doing local work.
- Use direct local-auth Linear GraphQL for comment edits, uploads, and ad-hoc
  Linear API queries. Do not wait for injected `linear_graphql`.
- Prefer the narrowest issue lookup that matches what you already know:
  key -> identifier search -> internal id.
- For state transitions, fetch team states first and use the exact `stateId`
  instead of hardcoding names inside mutations.
- Prefer `attachmentLinkGitHubPR` over a generic URL attachment when linking a
  GitHub PR to a Linear issue.
- Do not introduce committed raw-token shell helpers for GraphQL access.
- If you need shell work for uploads, only use it for signed upload URLs
  returned by `fileUpload`; those URLs already carry the needed authorization.

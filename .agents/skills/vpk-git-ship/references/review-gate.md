# Review gate

Run this gate before every merge, including merge-back of an existing PR. The
required `CI / PR checks` status is protected on `main`; auto-merge waits for it.
GitHub also blocks unresolved conversations. Never use `--admin` to bypass
checks or conversation resolution.

## Codex auto-review status

After creating or updating a PR, capture its current head and update time:

```bash
gh pr view <number> --json headRefOid,updatedAt,reviews,url
```

When this run pushed the head and the user did not request `--bypass`, poll for
up to three minutes at 15-second intervals for a terminal Codex signal:

- a `chatgpt-codex-connector` review tied to the current head;
- a current-head `+1` reaction, meaning reviewed with no findings;
- `eyes`, meaning still in progress.

Ignore stale-head signals and keep polling until the timeout. A timeout, missing
credit, auth problem, outage, or explicit bypass is non-blocking: record the
status and continue. Do not post `@codex review`; automatic review is already
configured and a manual mention can duplicate it. For an existing PR whose head
was not pushed in this run, inspect current status without waiting.

## Fetch every review surface

`gh pr view` does not expose thread-resolution state. Page through GraphQL
`reviewThreads` until `hasNextPage` is false:

```bash
gh api graphql \
  -f owner="<owner>" -f name="<repo>" -F number=<pr> -f after=null \
  -f query='query($owner:String!,$name:String!,$number:Int!,$after:String){
    repository(owner:$owner,name:$name){pullRequest(number:$number){
      reviewDecision mergeStateStatus
      reviewThreads(first:100,after:$after){
        pageInfo{hasNextPage endCursor}
        nodes{id isResolved isOutdated path line startLine
          comments(first:20){nodes{id body author{login} url createdAt}}}
      }
    }}
  }'
```

Repeat with `after=<endCursor>`. An empty or short GraphQL result can be stale,
especially while `mergeStateStatus` is `BLOCKED`. Reconcile it against REST:

```bash
gh api repos/<owner>/<repo>/pulls/<pr>/comments --paginate \
  --jq '.[] | {id, author: .user.login, in_reply_to: .in_reply_to_id, url}'
gh api repos/<owner>/<repo>/pulls/<pr>/reviews --paginate \
  --jq '.[] | select(.state != "APPROVED") | {id, author: .user.login, state}'
```

REST comments have no resolution field, so their presence alone does not mean a
thread is unresolved. Reconcile by comment identity, review state, and GraphQL
`isResolved`, not by author or head SHA. Every top-level REST comment must map
to a GraphQL thread, and every non-approving REST review must be represented or
classified. Older-commit conversations still block when unresolved.

If GraphQL omits a top-level REST comment or non-approving review, repeat the PR
view, paginated GraphQL query, and REST queries every five seconds for up to 30
seconds. If it remains hidden, stop and report the exact comment/review URL or
ID. Do not use scraped HTML, undocumented endpoints, or browser automation to
manufacture a thread ID.

Only declare the gate clear after every GraphQL page and REST surface agrees and
no thread has `isResolved == false`. `mergeStateStatus: CLEAN` is supporting
evidence, not proof by itself.

## Classify and remediate

Classify every unresolved thread, regardless of reviewer:

- **Valid:** a real bug, contract gap, missing test, incorrect visual state, or
  clarity issue. Make the smallest source fix, run focused validation, commit,
  and push.
- **Invalid or already handled:** current source or a newer diff proves the
  concern no longer applies. Do not change code; reply with specific evidence.
- **Ambiguous or product judgment:** stop before merge and report the URL and
  decision needed. Do not resolve it.

Every resolved conversation needs a visible disposition first:

```text
Fixed in <commit>; validation: <check/result>.
No code change: <specific evidence/rationale>.
```

Reply through the documented mutation:

```bash
gh api graphql -f threadId="<PRRT-id>" -f body="<reply>" \
  -f query='mutation($threadId:ID!,$body:String!){
    addPullRequestReviewThreadReply(input:{
      pullRequestReviewThreadId:$threadId,body:$body
    }){comment{url}}
  }'
```

A reply is not a resolution. Resolve only after the disposition exists:

```bash
gh api graphql -f threadId="<PRRT-id>" \
  -f query='mutation($threadId:ID!){
    resolveReviewThread(input:{threadId:$threadId}){thread{id isResolved}}
  }'
```

The mutation requires the GraphQL `PRRT_...` ID, not a REST comment ID. Re-fetch
all pages and REST surfaces afterward. Continue only when every handled thread
returns `isResolved: true`, no unresolved thread remains, and required checks
are passing or pending under auto-merge.

## Failure and re-review cases

- If a remediation push changes the head, re-check required checks and repeat
  the full review-surface reconciliation. A reviewer may create new threads.
- If GitHub dismisses or re-requests review after the push, treat that as current
  state; do not reuse approval evidence from the old head.
- If APIs cannot fetch, reply, resolve, or verify a thread, stop before merge.
- If `BLOCKED` or `UNKNOWN` persists while checks are green, reconcile GraphQL
  and REST again before attributing it to CODEOWNERS or another ruleset.
- Never resolve silently, resolve first and fix later, or treat a posted reply
  as a cleared conversation.

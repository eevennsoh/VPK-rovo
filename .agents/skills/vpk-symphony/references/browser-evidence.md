# Browser Evidence

Use this reference only for Symphony issue evidence. For normal local UI work,
use `/agent-browser` as directed by `AGENTS.md`.

## Policy

1. Check whether `playwright-cli --version` succeeds.
2. Treat browser launch as part of availability. If the version check passes
   but every attempted `playwright-cli open` path fails because browser
   binaries, cache writes, or sandbox permissions are unavailable, treat it as
   a Symphony setup gap. Patch the workflow when the issue requires browser
   evidence; otherwise record the exact launch limitation in the workpad
   `Validation` section and continue with the best non-browser proof.
3. If `playwright-cli` is unavailable, skip browser media capture, record the
   limitation in the workpad `Validation` section, and continue with the best
   non-browser proof.
4. If available, use `playwright-cli` for browser validation and consult
   `references/playwright-cli/quickstart.md` only as needed.
5. Store artifacts under `output/playwright/<issue-identifier>/`.
6. Capture a before artifact only when it proves the bug or requested baseline.
7. Capture an after artifact for app-touching work before handoff.
8. Prefer screenshots for static UI and final state checks.
9. Use short WebM recordings for multi-step interactions, animation,
   timing-sensitive behavior, drag/drop, keyboard flows, or hover/focus states.
10. Inspect artifacts for secrets, tokens, local file paths, private data,
   unrelated browser tabs, terminal panes, and devtools output before upload.
11. Upload only required media through `linear_graphql` using `fileUpload`, then
   update the single `## Codex Workpad` comment.

## Upload Formatting

- Screenshots: `![alt text](<asset-url>)`
- Inline motion proof: generate a short animated GIF from the recording, upload
  it as `image/gif`, and embed it with `![alt text](<asset-url>)`
- WebM recordings: upload as downloadable evidence and put the asset URL on its
  own line. Do not rely on Linear to render WebM `fileUpload` assets as playable
  inline video.

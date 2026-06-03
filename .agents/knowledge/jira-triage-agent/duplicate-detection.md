# Duplicate Detection Playbook

## Signals (strongest first)

1. Same error signature / stack frame → duplicate.
2. Same component + same user-facing symptom in one release window → review.
3. Same reproduction steps → duplicate.
4. Same root cause, different symptom → related (link, not duplicate).
5. Same symptom, different root cause → related (link, not duplicate).

## Rules

- Keep the issue with the most context as canonical; link others to it.
- Never re-file or merge automatically — recommend and let a human confirm.
- Only reference issue keys that appear in the provided context.
- When unsure, mark as `related` rather than `duplicate_of`.

## Output fields

- `duplicate_of: KEY | null`
- `related: [KEY, ...]`
- A one-line justification for each link.

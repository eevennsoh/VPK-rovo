# Page Templates

Every new page starts with a summary and a "Last reviewed" line.

## How-to

```
# How to <task>
> Summary: one paragraph on what this enables and who it's for.
Last reviewed: <date> · Owner: <name> · Labels: <labels>

## Prerequisites
## Steps
## Verify it worked
## Troubleshooting
## Related pages
```

## Runbook

```
# Runbook: <system / alert>
> Summary: when this runbook applies.
Last reviewed: <date> · Owner: <name> · Labels: runbook, <area>

## Detection (what alert/symptom triggers this)
## Impact & severity
## Diagnosis steps
## Mitigation steps
## Escalation path
## Post-incident
```

## Decision record (ADR)

```
# ADR-<n>: <decision>
Status: proposed | accepted | superseded
Date: <date> · Owner: <name>

## Context
## Decision
## Consequences
## Alternatives considered
```

## FAQ

```
# <Topic> FAQ
Last reviewed: <date> · Owner: <name> · Labels: faq, <area>

### Question?
Answer.
```

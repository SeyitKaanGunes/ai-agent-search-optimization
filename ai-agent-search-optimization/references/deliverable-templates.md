# Deliverable Templates

Read this when producing reports, tickets, content briefs, or measurement scorecards.

## Audit Finding

```markdown
### [Severity] Finding title

- Affected URLs/templates:
- Evidence:
- Why it matters for AI search:
- Recommended fix:
- Validation:
- Impact:
- Confidence:
- Effort:
```

## Implementation Ticket

```markdown
## Goal

## Scope

## Changes

- File/URL:
- Required behavior:
- Acceptance criteria:

## Validation

- Crawl/fetch check:
- Structured data check:
- AI visibility prompt check:
- Analytics/Search Console follow-up:
```

## Content Brief

```markdown
## Page

- Target URL:
- Primary entity:
- Intent cluster:
- Target prompts:
- Human audience:

## Required Sections

- Direct answer:
- Comparison/evaluation criteria:
- Evidence or original data:
- FAQs:
- Internal links:
- Schema:

## Source Requirements

- First-party proof:
- Third-party references:
- Author/reviewer:
- Update cadence:
```

## Prompt Visibility Scorecard

```markdown
| Prompt | Surface | Brand mentioned | Brand cited | Cited URL | Rank/position | Sentiment | Competitors | Notes |
|---|---|---:|---:|---|---:|---|---|---|
```

Scoring:

- Mention: 1 if the brand appears, otherwise 0.
- Citation: 1 if the brand's owned URL is cited, otherwise 0.
- Recommendation: 2 for recommended, 1 for neutral inclusion, 0 for absent, -1 for negative.
- Source quality: 2 for canonical owned source, 1 for credible third-party source, 0 for weak or unrelated source.

---
name: ai-agent-search-optimization
description: Audit, plan, and implement AI search visibility work for websites across ChatGPT Search, Perplexity, Google AI Overviews and AI Mode, and other answer engines. Use when Codex needs to improve a site's chance of being crawled, understood, cited, or recommended by AI agents; create or review llms.txt; inspect robots.txt access for AI crawlers; design entity, schema, content, internal linking, and citation strategies; build AI visibility prompt test suites; or produce GEO/AEO/LLMO implementation briefs.
---

# AI Agent Search Optimization

## Overview

Optimize for AI search by improving retrieval eligibility, entity clarity, answer usefulness, and citation confidence. Do not promise rankings or guaranteed AI citations; produce testable technical fixes, content briefs, and measurement plans.

## Quick Start

1. Identify the target site, market, brand/entity, competitors, and AI surfaces the user cares about.
2. Run a local technical audit when a URL is available:

```bash
python ai-agent-search-optimization/scripts/audit_site.py https://example.com --brand "Example" --markdown
```

3. If the site lacks `/llms.txt`, generate a high-signal draft:

```bash
python ai-agent-search-optimization/scripts/build_llms_txt.py --site https://example.com --name "Example" --summary "One sentence positioning." --from-sitemap --output llms.txt
```

4. Generate a prompt matrix for manual or automated visibility tracking:

```bash
python ai-agent-search-optimization/scripts/prompt_matrix.py --brand "Example" --category "customer support software" --competitors "Zendesk,Intercom" --output prompts.csv
```

5. Produce a prioritized plan with: issue, affected URL/template, AI-search impact, fix, owner, effort, validation method, and confidence.

## Workflow

Use the SEARCH stack:

- **Surface access**: Verify robots.txt, CDN/WAF behavior, sitemap discovery, status codes, canonicalization, noindex/nosnippet, and text availability for major search and AI crawlers.
- **Entity clarity**: Make the brand, product, category, locations, founders, authors, credentials, sameAs links, and organization schema unambiguous.
- **Answer coverage**: Map query fan-out topics to pages that answer concrete comparison, pricing, best-for, how-to, troubleshooting, and local intent.
- **Retrieval structure**: Improve internal links, hubs, canonical pages, structured data that matches visible content, and optional LLM-friendly resources such as `/llms.txt`.
- **Citation proof**: Add first-party evidence, original data, dates, methodology, author expertise, case studies, reviews, policies, and quotable definitions.
- **Human outcomes**: Track AI mentions/citations alongside organic traffic, assisted conversions, signup quality, and high-intent referral behavior.

## Decision Rules

- If the user asks for Google AI Overviews or AI Mode, treat it as search optimization first. Google says there are no extra technical requirements beyond Search eligibility, snippet eligibility, crawlability, and helpful content.
- If the user asks for ChatGPT Search, check whether `OAI-SearchBot` is allowed separately from `GPTBot`. Allowing search crawling does not require allowing model-training crawling.
- If the user asks for Perplexity, check `PerplexityBot` for search indexing and explain that `Perplexity-User` is for user-triggered fetches.
- If the user asks for `/llms.txt`, create it as a curated map for models and agents, not as a ranking guarantee. Keep it concise, current, and linked to authoritative pages.
- If the user asks to "game" AI systems, redirect toward legitimate crawlability, evidence, source quality, content usefulness, and measurement.
- If current platform behavior matters, verify official crawler/search docs before making strong claims.

## Deliverables

Prefer these outputs:

- **AI visibility audit**: technical blockers, entity/citation gaps, content coverage, priority fixes.
- **Implementation patch**: robots.txt, sitemap references, llms.txt, schema updates, copy changes, internal links, template fixes.
- **Content brief pack**: pages to create or improve, target prompts/intents, required evidence, schema, internal links, and validation checks.
- **Prompt test suite**: prompts by intent class, competitor comparison prompts, expected source/citation checks, and scoring rubric.
- **Measurement plan**: surfaces, prompt sampling cadence, mention/citation/sentiment metrics, and analytics tie-ins.

## Bundled Resources

- Read `references/ai-search-principles.md` when platform-specific guidance, caveats, or official source URLs matter.
- Read `references/audit-framework.md` when planning a full audit or explaining prioritization.
- Read `references/deliverable-templates.md` when producing reports, tickets, briefs, or measurement scorecards.
- Use `scripts/audit_site.py` for a dependency-free crawlability and AI-readiness audit of a URL.
- Use `scripts/build_llms_txt.py` to generate a first-pass `/llms.txt` file from site metadata, links, and optionally a sitemap.
- Use `scripts/prompt_matrix.py` to generate AI visibility prompts for repeated manual or automated testing.

## Quality Bar

- Separate confirmed facts from hypotheses.
- Tie every recommendation to a likely AI retrieval, grounding, citation, or conversion effect.
- Prefer source-backed primary content over synthetic summaries.
- Avoid fake reviews, spam mentions, hidden text, cloaking, or AI-only pages that harm users.
- Make the final plan shippable: exact files, URLs, snippets, schema objects, and validation steps.

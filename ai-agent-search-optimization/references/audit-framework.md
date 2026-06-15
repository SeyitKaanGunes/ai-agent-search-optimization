# Audit Framework

Read this when producing a full AI search visibility audit or prioritizing fixes.

## SEARCH Stack

### 1. Surface Access

Goal: ensure AI and search systems can fetch and parse the pages worth citing.

Check:

- HTTP status, redirects, canonical URLs, and HTTPS.
- `robots.txt` access for Googlebot, OAI-SearchBot, GPTBot, ChatGPT-User, PerplexityBot, Perplexity-User, and other user-requested agents.
- `noindex`, `nosnippet`, `max-snippet`, `data-nosnippet`, and robots meta directives.
- XML sitemap discovery from robots.txt and `/sitemap.xml`.
- CDN/WAF bot rules that could block AI search crawlers even when robots.txt allows them.
- Important content rendered as text rather than image-only or client-only state.

Prioritize blockers that prevent retrieval before content rewrites.

### 2. Entity Clarity

Goal: make the brand and its offerings easy to resolve.

Check:

- Organization, LocalBusiness, Product, Service, SoftwareApplication, Person, Author, Article, FAQPage, HowTo, Review, and Breadcrumb schema where appropriate.
- Consistent brand name, product names, categories, locations, social profiles, and sameAs links.
- About, contact, author, editorial policy, pricing, product, docs, comparison, and support pages.
- Clear disambiguation from similarly named competitors.

### 3. Answer Coverage

Goal: cover the prompts that AI systems fan out into.

Map content to:

- "Best X for Y"
- "X vs Y"
- "Alternatives to X"
- "How to choose X"
- "How much does X cost"
- "Is X safe/compliant"
- "How to integrate X with Y"
- "Troubleshoot X"
- Local or vertical variants

Create pages only when they help humans. Improve existing pages when the site already has topical authority.

### 4. Retrieval Structure

Goal: make the right page the obvious source.

Check:

- Hub-and-spoke internal links.
- Descriptive anchors that match real questions.
- Canonical pages for categories, features, use cases, integrations, comparisons, docs, and policies.
- Tables, definitions, summaries, and step-by-step sections where they help scanning and extraction.
- `/llms.txt` as a curated map for agents when it fits the site.

### 5. Citation Proof

Goal: increase confidence that the site is worth citing.

Add or improve:

- Original data, benchmarks, survey methods, screenshots, changelogs, case studies, or examples.
- Dates, authors, credentials, review process, and update history.
- Clear pricing, policies, security/compliance details, and product limitations.
- Third-party sources only when they are legitimate and high quality.

### 6. Human Outcomes

Goal: avoid vanity optimization.

Measure:

- AI mention share by prompt cluster.
- Citation/source share and exact cited URLs.
- Sentiment and recommendation framing.
- Competitor co-mentions.
- Referral traffic quality, assisted conversions, demo requests, signups, or sales-qualified actions.

## Priority Scoring

Score each recommendation:

- Impact: 1 to 5, expected improvement in retrieval, citation, or conversion.
- Confidence: 1 to 5, evidence that the fix matters for this site.
- Effort: 1 to 5, implementation difficulty.

Sort by `(impact * confidence) / effort`, then pull any hard access blocker to the top.

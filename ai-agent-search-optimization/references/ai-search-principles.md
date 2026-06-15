# AI Search Principles

Read this when a task needs platform-specific guidance, caveats, or source URLs.

## Source Stance

Prefer official docs for current platform behavior:

- Google AI features and your website: https://developers.google.com/search/docs/appearance/ai-features
- Google generative AI optimization guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- OpenAI crawler overview: https://developers.openai.com/api/docs/bots
- Perplexity crawler overview: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- llms.txt proposal: https://llmstxt.org/

Refresh these before making date-sensitive claims.

## What Usually Matters

- AI answers usually depend on retrievable, crawlable, indexable, text-readable sources.
- Visibility is not just brand mentions. Track citations, source URLs, sentiment, answer position, and whether the AI recommends the entity for relevant use cases.
- Strong AI-search pages tend to have clear entity identity, direct answers, comparison-ready claims, original evidence, current dates, and authoritative internal/external references.
- Treat `/llms.txt` as a curated map for models and agents. It can reduce ambiguity, but it is not an official ranking requirement for Google AI features.

## Platform Notes

### Google AI Overviews and AI Mode

- Foundational SEO remains relevant.
- A page must be eligible for Google Search and snippets to appear as a supporting link.
- Crawlability, internal links, page experience, textual content, media quality, and structured data consistency still matter.
- Google says no special AI text file, special schema, or extra machine-readable file is required for these features.
- Avoid inauthentic mention campaigns and shallow "AEO/GEO hacks."

### ChatGPT Search

- Check `OAI-SearchBot` for search result inclusion.
- Check `GPTBot` separately for training opt-in or opt-out preferences.
- Do not assume blocking GPTBot blocks search inclusion or vice versa.
- Robots changes may take time to propagate.

### Perplexity

- `PerplexityBot` is the search/indexing crawler.
- `Perplexity-User` handles user-triggered page fetches and may not behave like a normal crawler.
- Treat robots and WAF controls as access policy, not a visibility strategy by themselves.

### llms.txt

- Root path is usually `/llms.txt`.
- Keep it Markdown, concise, and linked to high-value canonical resources.
- Include pages that help an AI agent understand the site: overview, docs, product pages, pricing, policies, comparison pages, data sources, API docs, and contact/support.
- Remove stale URLs quickly. A stale LLM map is worse than no map for trust.

## Red Lines

Do not recommend:

- Cloaking AI-specific content that differs materially from human-visible content.
- Hidden text or doorway pages.
- Fake third-party mentions, fabricated reviews, or synthetic citations.
- Schema that does not match visible page content.
- Claims of guaranteed inclusion in AI answers.

# AI Agent Search Optimization Skill

[![skills.sh](https://skills.sh/b/SeyitKaanGunes/ai-agent-search-optimization)](https://skills.sh/SeyitKaanGunes/ai-agent-search-optimization)

An open-source Codex skill for improving website visibility in AI search and answer engines.

This is not another generic SEO checklist and it is not another AI visibility dashboard. The skill turns the current GEO/AEO/LLMO market gap into an agent workflow: crawlability checks, AI crawler access, entity clarity, citation-ready content, `llms.txt`, prompt-based visibility testing, and implementation briefs.

## Why This Exists

Most AI visibility products are closed SaaS dashboards. They are useful for tracking, but they do not give developers a transparent, local, agent-friendly workflow for fixing the site itself.

This skill focuses on the missing layer:

- Audit whether AI/search crawlers can fetch and parse the site.
- Generate practical `/llms.txt` drafts without treating them as magic ranking files.
- Build prompt suites for ChatGPT, Perplexity, Google AI Mode, and similar surfaces.
- Turn findings into implementation tickets, content briefs, schema fixes, and measurement plans.
- Keep advice aligned with official crawler/search guidance rather than hype.

## How It Is Different

Most open agent skills in this area are still traditional marketing skills. For example, SEO audit skills usually focus on crawlability, indexation, speed, on-page optimization, content quality, and authority signals. Programmatic SEO skills usually focus on large-scale landing page templates, keyword patterns, internal linking, and thin-content avoidance.

This skill starts where those stop:

- **AI crawler access**: Checks AI/search crawler readiness for agents such as `OAI-SearchBot`, `GPTBot`, `ChatGPT-User`, `PerplexityBot`, and `Perplexity-User`.
- **AI answer visibility**: Builds prompt suites for ChatGPT, Perplexity, Google AI Mode, and similar answer engines instead of only tracking classic keywords.
- **Citation readiness**: Evaluates whether pages have the entity clarity, proof, source quality, and answer structure needed to be cited or recommended by AI systems.
- **Agent-friendly site maps**: Generates `/llms.txt` as a curated map for AI agents without pretending it is a magic ranking file.
- **Developer-ready output**: Converts GEO/AEO findings into files, snippets, implementation tickets, content briefs, schema work, and validation steps.
- **Open execution layer**: Runs locally with dependency-free scripts instead of locking the workflow inside a closed SaaS dashboard.

Compared with AI visibility SaaS platforms such as Profound, Peec AI, and AthenaHQ, this repository is not trying to replace enterprise monitoring dashboards. Those tools are useful for historical tracking, prompt monitoring, sentiment, and share-of-voice reporting. This skill is the local open-source layer that helps an agent inspect and fix the website itself.

The positioning is simple:

```text
Not another SEO checklist. Not another dashboard.
An open-source execution layer for AI search optimization.
```

## Install

Install with the Skills CLI:

```bash
npx skills add SeyitKaanGunes/ai-agent-search-optimization --skill ai-agent-search-optimization
```

Use it once without installing:

```bash
npx skills use SeyitKaanGunes/ai-agent-search-optimization@ai-agent-search-optimization
```

For local development, point Codex or your agent runtime at:

```text
ai-agent-search-optimization/SKILL.md
```

## Included Tools

```bash
python ai-agent-search-optimization/scripts/audit_site.py https://example.com --brand "Example" --markdown
python ai-agent-search-optimization/scripts/build_llms_txt.py --site https://example.com --name "Example" --summary "One sentence positioning." --from-sitemap
python ai-agent-search-optimization/scripts/prompt_matrix.py --brand "Example" --category "customer support software" --competitors "Zendesk,Intercom"
```

## MCP Server

This repository also ships an MCP server that exposes the skill as callable tools, resources, and prompts.

### Tools

- `audit_site`: audit a URL for AI search readiness, crawler access, `/llms.txt`, sitemap, schema, and visible text issues.
- `build_llms_txt`: generate a curated `/llms.txt` draft for AI agents.
- `prompt_matrix`: create AI visibility prompt suites for ChatGPT, Perplexity, Google AI Mode, and similar answer engines.

### Resources

- `ai-search://principles`
- `ai-search://audit-framework`
- `ai-search://deliverable-templates`

### Prompts

- `ai_visibility_audit`
- `llms_txt_review`
- `geo_content_brief`

### Local MCP Config

Until the npm package is published, run directly from GitHub:

```json
{
  "mcpServers": {
    "ai-agent-search-optimization": {
      "command": "npx",
      "args": ["-y", "github:SeyitKaanGunes/ai-agent-search-optimization"]
    }
  }
}
```

After npm publish, the config becomes:

```json
{
  "mcpServers": {
    "ai-agent-search-optimization": {
      "command": "npx",
      "args": ["-y", "mcp-server-ai-agent-search-optimization"]
    }
  }
}
```

The MCP Registry metadata is in `server.json`. The package declares:

```text
mcpName: io.github.SeyitKaanGunes/ai-agent-search-optimization
```

### MCP Development

```bash
npm ci
npm run typecheck
npm run build
npm run validate:mcp
npm run validate:pack
```

CI runs the same checks on pushes and pull requests. `scripts/mcp-smoke-test.mjs` starts the built MCP server with a real MCP client, then verifies the tools, resources, prompts, and sample outputs.

### Publish To npm And MCP Registry

The npm package name is:

```text
mcp-server-ai-agent-search-optimization
```

To publish it and register the MCP server from GitHub Actions:

1. Create an npm automation token.
2. Add it to the GitHub repository secrets as `NPM_TOKEN`.
3. Create a GitHub release or run the `Publish npm package and MCP Registry` workflow manually.

The workflow publishes the npm package first, then uses GitHub OIDC to authenticate `mcp-publisher` and publish `server.json` to the MCP Registry. After the npm package is live, switch from the GitHub `npx` config to the npm package config shown above.

## Skills.sh Listing

Skills.sh does not use a manual submission form for ordinary new skill listings. Public skills appear after the Skills CLI has seen installs from the GitHub repo.

To help the listing appear:

```bash
npx skills add SeyitKaanGunes/ai-agent-search-optimization --skill ai-agent-search-optimization
```

Once installed by users, the skill can appear in Skills.sh search and leaderboard data based on anonymous aggregate install telemetry. Repo page display can be customized with `skills.sh.json` after the repository has been seen by the telemetry service.

## Positioning

Use this for:

- AI search visibility audits
- ChatGPT Search crawler checks
- Perplexity visibility readiness
- Google AI Overviews and AI Mode readiness
- `llms.txt` generation
- entity and schema cleanup
- citation-ready content planning
- prompt-based AI visibility measurement

Do not use it for spam, fake mentions, cloaking, hidden text, fabricated reviews, or guaranteed ranking claims.

## Official Sources

The skill points agents toward official docs before making platform-specific claims:

- Google AI features and your website: https://developers.google.com/search/docs/appearance/ai-features
- Google generative AI optimization guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- OpenAI crawler overview: https://developers.openai.com/api/docs/bots
- Perplexity crawler overview: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- llms.txt proposal: https://llmstxt.org/

## License

MIT

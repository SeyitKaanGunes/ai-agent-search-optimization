export function auditPrompt(args: { url: string; brand?: string; competitors?: string }) {
  return `Use the AI Agent Search Optimization MCP tools to audit ${args.url}${args.brand ? ` for ${args.brand}` : ""}.

Run audit_site first. Then use ai-search://audit-framework and ai-search://principles to produce a prioritized GEO/AEO implementation plan.

Include:
- technical blockers
- AI crawler access issues
- entity/schema gaps
- citation-readiness gaps
- llms.txt recommendation
- prompt visibility tests${args.competitors ? `\n- competitor context: ${args.competitors}` : ""}`;
}

export function llmsTxtPrompt(args: { site: string; name: string; summary: string }) {
  return `Generate and review an /llms.txt draft for ${args.name} at ${args.site}.

Use build_llms_txt with this summary:
${args.summary}

Then explain what should be manually curated before publishing.`;
}

export function contentBriefPrompt(args: { brand: string; category: string; competitors?: string }) {
  return `Create an AI search content brief pack for ${args.brand} in the ${args.category} category.

Use prompt_matrix to identify answer-engine prompts. Then produce page briefs that improve citation readiness, entity clarity, and comparison coverage.${args.competitors ? ` Competitors: ${args.competitors}.` : ""}`;
}

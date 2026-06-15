#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { auditPrompt, contentBriefPrompt, llmsTxtPrompt } from "./prompts.js";
import { readResource, resourceEntries, type ResourceUri } from "./resources.js";
import { auditSite } from "./tools/audit-site.js";
import { buildLlmsTxt } from "./tools/build-llms-txt.js";
import { promptMatrix } from "./tools/prompt-matrix.js";

const server = new McpServer({
  name: "ai-agent-search-optimization",
  version: "0.1.0"
});

server.tool(
  "audit_site",
  "Audit a website URL for AI search readiness: crawler access, robots.txt, llms.txt, sitemap discovery, schema, visible text, and citation-readiness blockers.",
  {
    url: z.string().describe("Website URL to audit. Only http and https URLs are supported."),
    brand: z.string().optional().describe("Optional brand/entity name to check in crawlable page text."),
    agents: z.array(z.string()).optional().describe("Optional crawler user agents to check against robots.txt."),
    format: z.enum(["json", "markdown"]).optional().describe("Output format. Defaults to json.")
  },
  async (input) => auditSite(input)
);

server.tool(
  "build_llms_txt",
  "Generate a concise /llms.txt draft as a curated map for AI agents. This is not a ranking guarantee.",
  {
    site: z.string().describe("Website origin, e.g. https://example.com."),
    name: z.string().describe("Brand, product, or website name."),
    summary: z.string().describe("One-sentence positioning summary for AI agents."),
    links: z
      .array(
        z.object({
          section: z.string().optional(),
          title: z.string(),
          url: z.string()
        })
      )
      .optional()
      .describe("Optional curated links. Relative URLs are resolved against the site origin."),
    fromSitemap: z.boolean().optional().describe("Whether to include a sample of URLs from /sitemap.xml."),
    sitemapLimit: z.number().int().min(1).max(100).optional().describe("Maximum sitemap URLs to include when fromSitemap is true.")
  },
  async (input) => buildLlmsTxt(input)
);

server.tool(
  "prompt_matrix",
  "Generate reusable AI visibility prompts for ChatGPT, Perplexity, Google AI Mode, and similar answer engines.",
  {
    brand: z.string().describe("Brand/entity name."),
    category: z.string().describe("Product, service, or market category."),
    audience: z.string().optional().describe("Target audience. Defaults to buyers."),
    competitors: z.array(z.string()).optional().describe("Competitor names for comparison prompts."),
    pains: z.array(z.string()).optional().describe("Customer problems for problem-intent prompts."),
    location: z.string().optional().describe("Location for local-intent prompts. Defaults to the United States."),
    surface: z.string().optional().describe("AI surfaces to track. Defaults to ChatGPT, Perplexity, Google AI Mode."),
    format: z.enum(["csv", "json", "markdown"]).optional().describe("Output format. Defaults to json.")
  },
  async (input) => promptMatrix(input)
);

for (const resource of resourceEntries()) {
  server.resource(resource.name, resource.uri, async () => readResource(resource.uri as ResourceUri));
}

server.prompt(
  "ai_visibility_audit",
  "Create a structured AI search visibility audit workflow for a website.",
  {
    url: z.string(),
    brand: z.string().optional(),
    competitors: z.string().optional()
  },
  (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: auditPrompt(args)
        }
      }
    ]
  })
);

server.prompt(
  "llms_txt_review",
  "Generate and review an /llms.txt draft for a website.",
  {
    site: z.string(),
    name: z.string(),
    summary: z.string()
  },
  (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: llmsTxtPrompt(args)
        }
      }
    ]
  })
);

server.prompt(
  "geo_content_brief",
  "Create content briefs for AI answer visibility and citation readiness.",
  {
    brand: z.string(),
    category: z.string(),
    competitors: z.string().optional()
  },
  (args) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: contentBriefPrompt(args)
        }
      }
    ]
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

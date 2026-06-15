import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const command = process.env.MCP_SMOKE_COMMAND ?? "node";
const args = process.env.MCP_SMOKE_ARGS
  ? JSON.parse(process.env.MCP_SMOKE_ARGS)
  : ["dist/server.js"];

const transport = new StdioClientTransport({ command, args });
const client = new Client({
  name: "ai-agent-search-optimization-smoke-test",
  version: "1.0.0"
});

try {
  await client.connect(transport);

  const tools = await client.listTools();
  assertIncludes(
    tools.tools.map((tool) => tool.name),
    ["audit_site", "build_llms_txt", "prompt_matrix"],
    "tools"
  );

  const resources = await client.listResources();
  assertIncludes(
    resources.resources.map((resource) => resource.uri),
    [
      "ai-search://principles",
      "ai-search://audit-framework",
      "ai-search://deliverable-templates"
    ],
    "resources"
  );

  const prompts = await client.listPrompts();
  assertIncludes(
    prompts.prompts.map((prompt) => prompt.name),
    ["ai_visibility_audit", "llms_txt_review", "geo_content_brief"],
    "prompts"
  );

  const llmsTxt = await client.callTool({
    name: "build_llms_txt",
    arguments: {
      site: "https://example.com",
      name: "Example",
      summary: "Example helps teams validate AI search optimization workflows.",
      links: [{ title: "Docs", url: "/docs" }]
    }
  });
  assertTextIncludes(llmsTxt, "# Example", "build_llms_txt output");
  assertTextIncludes(llmsTxt, "https://example.com/docs", "build_llms_txt links");

  const matrix = await client.callTool({
    name: "prompt_matrix",
    arguments: {
      brand: "Example",
      category: "support software",
      competitors: ["Zendesk"],
      format: "markdown"
    }
  });
  assertTextIncludes(matrix, "Compare Example with Zendesk", "prompt_matrix output");

  const principles = await client.readResource({
    uri: "ai-search://principles"
  });
  const principleText = resourceText(principles);
  if (!principleText.includes("AI Search Principles")) {
    throw new Error("principles resource did not include expected text");
  }

  console.log("MCP smoke test passed");
} finally {
  await client.close();
}

function assertIncludes(actual, expected, label) {
  const missing = expected.filter((item) => !actual.includes(item));
  if (missing.length > 0) {
    throw new Error(`Missing ${label}: ${missing.join(", ")}`);
  }
}

function assertTextIncludes(result, expected, label) {
  const text = toolText(result);
  if (!text.includes(expected)) {
    throw new Error(`${label} did not include ${JSON.stringify(expected)}`);
  }
}

function toolText(result) {
  return (result.content ?? [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

function resourceText(result) {
  return (result.contents ?? [])
    .filter((item) => item.text)
    .map((item) => item.text)
    .join("\n");
}

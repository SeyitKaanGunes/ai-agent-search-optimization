import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const resources = {
  "ai-search://principles": {
    name: "AI Search Principles",
    file: "ai-agent-search-optimization/references/ai-search-principles.md"
  },
  "ai-search://audit-framework": {
    name: "AI Search Audit Framework",
    file: "ai-agent-search-optimization/references/audit-framework.md"
  },
  "ai-search://deliverable-templates": {
    name: "AI Search Deliverable Templates",
    file: "ai-agent-search-optimization/references/deliverable-templates.md"
  }
} as const;

export type ResourceUri = keyof typeof resources;

export function resourceEntries() {
  return Object.entries(resources).map(([uri, data]) => ({ uri: uri as ResourceUri, ...data }));
}

export async function readResource(uri: ResourceUri) {
  const resource = resources[uri];
  const text = await readFile(resolve(rootDir, resource.file), "utf8");
  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text
      }
    ]
  };
}

import { asTextResult } from "../lib/format.js";

const TEMPLATES = [
  ["discovery", "What are the best {category} options for {audience}? Include sources."],
  ["recommendation", "Recommend a {category} for {audience}. Explain why and cite sources."],
  ["comparison", "Compare {brand} with {competitor} for {audience}. Include strengths, weaknesses, and sources."],
  ["alternatives", "What are the strongest alternatives to {competitor} in {category}? Include sources."],
  ["pricing", "How much does {brand} cost, and how does pricing compare with {competitor}? Cite sources."],
  ["trust", "Is {brand} trustworthy for {audience}? Discuss evidence, reviews, security, and sources."],
  ["implementation", "How do I implement or get started with {brand}? Cite official sources."],
  ["problem", "Which {category} should I choose if my main problem is {pain}? Include sources."],
  ["local", "Which {category} providers are best for {location}? Include sources."],
  ["citation", "Find official sources that explain what {brand} does, who it is for, and why it is different."]
] as const;

export type PromptMatrixInput = {
  brand: string;
  category: string;
  audience?: string;
  competitors?: string[];
  pains?: string[];
  location?: string;
  surface?: string;
  format?: "csv" | "json" | "markdown";
};

export function buildPromptRows(input: PromptMatrixInput) {
  const competitors = input.competitors?.filter(Boolean) ?? [];
  const pains = input.pains?.filter(Boolean) ?? ["reducing cost", "improving quality", "saving time"];
  const rows: Record<string, string>[] = [];

  for (const [intent, template] of TEMPLATES) {
    if (template.includes("{competitor}")) {
      for (const competitor of competitors.length ? competitors : ["a leading competitor"]) {
        rows.push(buildRow(intent, template, input, competitor, pains[0]));
      }
    } else if (template.includes("{pain}")) {
      for (const pain of pains) {
        rows.push(buildRow(intent, template, input, competitors[0] ?? "a competitor", pain));
      }
    } else {
      rows.push(buildRow(intent, template, input, competitors[0] ?? "a competitor", pains[0]));
    }
  }

  return rows;
}

export function promptMatrix(input: PromptMatrixInput) {
  const rows = buildPromptRows(input);
  const format = input.format ?? "json";
  if (format === "markdown") {
    const lines = ["| Intent | Surface | Prompt | Checks |", "|---|---|---|---|"];
    for (const row of rows) {
      lines.push(`| ${row.intent} | ${row.surface} | ${row.prompt.replace(/\|/g, "\\|")} | ${row.expectedChecks} |`);
    }
    return asTextResult(`${lines.join("\n")}\n`);
  }

  if (format === "csv") {
    const fields = Object.keys(rows[0] ?? {});
    const lines = [fields.join(",")];
    for (const row of rows) {
      lines.push(fields.map((field) => csv(row[field] ?? "")).join(","));
    }
    return asTextResult(`${lines.join("\n")}\n`);
  }

  return asTextResult(JSON.stringify(rows, null, 2));
}

function buildRow(intent: string, template: string, input: PromptMatrixInput, competitor: string, pain: string) {
  const prompt = template
    .replaceAll("{brand}", input.brand)
    .replaceAll("{category}", input.category)
    .replaceAll("{audience}", input.audience ?? "buyers")
    .replaceAll("{competitor}", competitor)
    .replaceAll("{pain}", pain)
    .replaceAll("{location}", input.location ?? "the United States");

  return {
    intent,
    surface: input.surface ?? "ChatGPT,Perplexity,Google AI Mode",
    brand: input.brand,
    category: input.category,
    competitor,
    prompt,
    expectedChecks: "brand_mentioned,owned_url_cited,sentiment,competitors,cited_urls"
  };
}

function csv(value: string) {
  if (!/[",\n]/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

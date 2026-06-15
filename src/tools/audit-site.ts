import { type AuditReport, type Finding, asJsonResult, asTextResult, auditToMarkdown } from "../lib/format.js";
import { decodeHtml, fetchText, siteOrigin } from "../lib/web.js";

const DEFAULT_AGENTS = [
  "Googlebot",
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "CCBot"
];

type AuditSiteInput = {
  url: string;
  brand?: string;
  agents?: string[];
  format?: "json" | "markdown";
};

type ParsedHtml = {
  title: string;
  description: string;
  canonical: string;
  robotsMeta: string;
  h1: string[];
  h2: string[];
  visibleText: string;
  jsonLdBlocks: string[];
  schemaTypes: string[];
  internalLinkCount: number;
};

export async function auditSite(input: AuditSiteInput) {
  const target = new URL(input.url.startsWith("http") ? input.url : `https://${input.url}`).toString();
  const origin = siteOrigin(target);
  const robotsUrl = `${origin}/robots.txt`;
  const llmsUrl = `${origin}/llms.txt`;
  const agents = input.agents?.length ? input.agents : DEFAULT_AGENTS;

  const [page, robots, llms] = await Promise.all([
    fetchText(target),
    fetchText(robotsUrl, { timeoutMs: 8_000, maxBytes: 500_000 }),
    fetchText(llmsUrl, { timeoutMs: 8_000, maxBytes: 500_000 })
  ]);

  const parsed = parseHtml(page.text, origin);
  const sitemaps = robots.status === 200 ? parseSitemaps(robots.text, origin) : [];
  const crawlerAccess = Object.fromEntries(
    agents.map((agent) => [agent, robots.status === 200 ? canFetch(robots.text, agent, new URL(target).pathname || "/") : null])
  ) as Record<string, boolean | null>;

  const report: AuditReport = {
    url: target,
    finalUrl: page.url,
    status: page.status,
    title: parsed.title,
    description: parsed.description,
    canonical: parsed.canonical,
    robotsMeta: parsed.robotsMeta,
    h1: parsed.h1.slice(0, 5),
    h2Sample: parsed.h2.slice(0, 10),
    visibleTextChars: parsed.visibleText.length,
    schemaTypes: parsed.schemaTypes,
    jsonLdBlocks: parsed.jsonLdBlocks.length,
    internalLinkCount: parsed.internalLinkCount,
    sitemaps,
    crawlerAccess,
    llmsTxt: {
      url: llmsUrl,
      status: llms.status,
      chars: llms.text.length,
      hasH1: /^#\s+/m.test(llms.text),
      linkCount: (llms.text.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length
    },
    findings: buildFindings({
      pageStatus: page.status,
      pageError: page.error,
      robotsStatus: robots.status,
      robotsError: robots.error,
      robotsMeta: parsed.robotsMeta,
      visibleText: parsed.visibleText,
      title: parsed.title,
      h1: parsed.h1,
      schemaTypes: parsed.schemaTypes,
      llmsStatus: llms.status,
      brand: input.brand,
      crawlerAccess,
      sitemaps
    })
  };

  if (input.format === "markdown") {
    return asTextResult(auditToMarkdown(report));
  }
  return asJsonResult(report);
}

function parseHtml(html: string, origin: string): ParsedHtml {
  const cleaned = html
    .replace(/<script\b(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const title = textOfFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = metaContent(html, "description");
  const robotsMeta = [metaContent(html, "robots"), metaContent(html, "googlebot")].filter(Boolean).join(", ");
  const canonical = attrFromFirst(html, /<link\b[^>]*rel=["'][^"']*\bcanonical\b[^"']*["'][^>]*>/i, "href");
  const h1 = texts(cleaned, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  const h2 = texts(cleaned, /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi);
  const jsonLdBlocks = texts(html, /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, false);
  const schemaTypes = parseSchemaTypes(jsonLdBlocks);
  const visibleText = decodeHtml(
    cleaned
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
  const internalLinkCount = new Set(
    Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi))
      .map((match) => {
        try {
          return new URL(match[1], origin).toString();
        } catch {
          return "";
        }
      })
      .filter((href) => href && new URL(href).origin === origin)
  ).size;

  return { title, description, canonical, robotsMeta, h1, h2, visibleText, jsonLdBlocks, schemaTypes, internalLinkCount };
}

function textOfFirst(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match ? stripTags(match[1]) : "";
}

function texts(html: string, pattern: RegExp, strip = true) {
  const values: string[] = [];
  for (const match of html.matchAll(pattern)) {
    values.push(strip ? stripTags(match[1]) : match[1].trim());
  }
  return values.filter(Boolean);
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function metaContent(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${escaped}["'])[^>]*>`, "i");
  return attrFromFirst(html, pattern, "content");
}

function attrFromFirst(html: string, elementPattern: RegExp, attr: string) {
  const element = html.match(elementPattern)?.[0] ?? "";
  const pattern = new RegExp(`${attr}=["']([^"']+)["']`, "i");
  return decodeHtml(element.match(pattern)?.[1]?.trim() ?? "");
}

function parseSchemaTypes(blocks: string[]) {
  const types = new Set<string>();

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }
    const record = value as Record<string, unknown>;
    const type = record["@type"];
    if (typeof type === "string") {
      types.add(type);
    } else if (Array.isArray(type)) {
      type.forEach((item) => types.add(String(item)));
    }
    Object.values(record).forEach(walk);
  }

  for (const block of blocks) {
    try {
      walk(JSON.parse(block));
    } catch {
      // Ignore invalid JSON-LD, but keep the block count in the report.
    }
  }

  return [...types].sort();
}

function parseSitemaps(robots: string, origin: string) {
  const sitemaps = robots
    .split(/\r?\n/)
    .filter((line) => /^sitemap:/i.test(line))
    .map((line) => line.split(/:(.*)/s)[1]?.trim())
    .filter(Boolean) as string[];
  return sitemaps.length ? sitemaps : [`${origin}/sitemap.xml`];
}

function canFetch(robots: string, agent: string, path: string) {
  const groups = parseRobotsGroups(robots);
  const lowerAgent = agent.toLowerCase();
  const matching = groups.filter((group) => group.agents.some((item) => item === "*" || item === lowerAgent));
  if (matching.length === 0) {
    return true;
  }

  let best: { directive: "allow" | "disallow"; length: number } | null = null;
  for (const group of matching) {
    for (const rule of group.rules) {
      if (!rule.path || !path.startsWith(rule.path)) {
        continue;
      }
      if (!best || rule.path.length > best.length || (rule.path.length === best.length && rule.directive === "allow")) {
        best = { directive: rule.directive, length: rule.path.length };
      }
    }
  }
  return best ? best.directive === "allow" : true;
}

function parseRobotsGroups(robots: string) {
  const groups: Array<{ agents: string[]; rules: Array<{ directive: "allow" | "disallow"; path: string }> }> = [];
  let current: { agents: string[]; rules: Array<{ directive: "allow" | "disallow"; path: string }> } | null = null;

  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line.includes(":")) {
      continue;
    }
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && current) {
      current.rules.push({ directive: key, path: value });
    }
  }

  return groups;
}

function buildFindings(input: {
  pageStatus: number | null;
  pageError: string | null;
  robotsStatus: number | null;
  robotsError: string | null;
  robotsMeta: string;
  visibleText: string;
  title: string;
  h1: string[];
  schemaTypes: string[];
  llmsStatus: number | null;
  brand?: string;
  crawlerAccess: Record<string, boolean | null>;
  sitemaps: string[];
}) {
  const findings: Finding[] = [];
  const add = (severity: Finding["severity"], title: string, detail: string, fix: string) => {
    findings.push({ severity, title, detail, fix });
  };

  if (input.pageStatus !== 200) {
    add("critical", "Target URL is not returning HTTP 200", `Status: ${input.pageStatus ?? "unknown"}, error: ${input.pageError ?? "none"}`, "Fix status, redirect chain, or target URL before optimizing content.");
  }
  if (input.robotsStatus !== 200) {
    add("high", "robots.txt could not be fetched", `Status: ${input.robotsStatus ?? "unknown"}, error: ${input.robotsError ?? "none"}`, "Publish a valid robots.txt and include sitemap references.");
  }
  for (const [agent, allowed] of Object.entries(input.crawlerAccess)) {
    if (allowed === false) {
      add("high", `${agent} is disallowed by robots.txt`, "This can block AI/search retrieval for that crawler.", `Review robots.txt policy for ${agent}; allow search crawlers when visibility is desired.`);
    }
  }
  if (input.sitemaps.length === 0) {
    add("medium", "No sitemap discovered", "No Sitemap directive was found in robots.txt.", "Add Sitemap directives to robots.txt and keep XML sitemaps current.");
  }
  const robotsMeta = input.robotsMeta.toLowerCase();
  if (robotsMeta.includes("noindex")) {
    add("critical", "Page has noindex directive", input.robotsMeta, "Remove noindex from pages meant to appear in search or AI answers.");
  }
  if (robotsMeta.includes("nosnippet") || robotsMeta.replace(/\s/g, "").includes("max-snippet:0")) {
    add("high", "Snippet restrictions may reduce AI feature eligibility", input.robotsMeta, "Use snippet restrictions only where required by policy or licensing.");
  }
  if (input.visibleText.length < 1000) {
    add("medium", "Low visible text volume", `Only ${input.visibleText.length} visible text characters parsed.`, "Ensure key answers, product facts, and evidence are available as server-rendered or crawlable text.");
  }
  if (!input.title) {
    add("medium", "Missing title tag", "No title was parsed.", "Add a concise title naming the entity, category, and page purpose.");
  }
  if (input.h1.length === 0) {
    add("medium", "Missing H1", "No H1 was parsed.", "Add one descriptive H1 that identifies the page topic.");
  }
  if (input.schemaTypes.length === 0) {
    add("medium", "No JSON-LD schema detected", "No valid application/ld+json @type values found.", "Add schema that matches visible content, such as Organization, Product, Service, Article, FAQPage, or BreadcrumbList.");
  }
  if (input.llmsStatus !== 200) {
    add("low", "No /llms.txt found", `Status: ${input.llmsStatus ?? "unknown"}`, "Consider adding a concise /llms.txt map for AI agents if the site has documentation, product, policy, or support resources.");
  }
  if (input.brand && !input.visibleText.toLowerCase().includes(input.brand.toLowerCase())) {
    add("medium", "Brand/entity name not found in visible text", `Brand checked: ${input.brand}`, "Make the primary entity explicit in crawlable copy, schema, title, and key landing pages.");
  }

  return findings;
}

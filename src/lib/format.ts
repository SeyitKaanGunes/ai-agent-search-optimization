export type Finding = {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  detail: string;
  fix: string;
};

export type AuditReport = {
  url: string;
  finalUrl: string;
  status: number | null;
  title: string;
  description: string;
  canonical: string;
  robotsMeta: string;
  h1: string[];
  h2Sample: string[];
  visibleTextChars: number;
  schemaTypes: string[];
  jsonLdBlocks: number;
  internalLinkCount: number;
  sitemaps: string[];
  crawlerAccess: Record<string, boolean | null>;
  llmsTxt: {
    url: string;
    status: number | null;
    chars: number;
    hasH1: boolean;
    linkCount: number;
  };
  findings: Finding[];
};

export function auditToMarkdown(report: AuditReport): string {
  const lines = [
    `# AI Search Visibility Audit: ${report.url}`,
    "",
    `- Status: ${report.status ?? "unknown"}`,
    `- Final URL: ${report.finalUrl}`,
    `- Title: ${report.title || "(missing)"}`,
    `- Description: ${report.description || "(missing)"}`,
    `- Canonical: ${report.canonical || "(missing)"}`,
    `- Visible text chars: ${report.visibleTextChars}`,
    `- Schema types: ${report.schemaTypes.join(", ") || "(none)"}`,
    `- Internal links parsed: ${report.internalLinkCount}`,
    "",
    "## Crawler Access",
    ""
  ];

  for (const [agent, allowed] of Object.entries(report.crawlerAccess)) {
    const value = allowed === null ? "unknown" : allowed ? "allowed" : "blocked";
    lines.push(`- ${agent}: ${value}`);
  }

  lines.push(
    "",
    "## llms.txt",
    "",
    `- URL: ${report.llmsTxt.url}`,
    `- Status: ${report.llmsTxt.status ?? "unknown"}`,
    `- Characters: ${report.llmsTxt.chars}`,
    `- Markdown H1: ${report.llmsTxt.hasH1}`,
    `- Markdown links: ${report.llmsTxt.linkCount}`,
    "",
    "## Findings",
    ""
  );

  if (report.findings.length === 0) {
    lines.push("No major issues found by the lightweight audit. Run a deeper crawl and prompt visibility test next.");
  }

  for (const finding of report.findings) {
    lines.push(
      `### [${finding.severity}] ${finding.title}`,
      "",
      `- Detail: ${finding.detail}`,
      `- Fix: ${finding.fix}`,
      ""
    );
  }

  return `${lines.join("\n").trim()}\n`;
}

export function asTextResult(text: string) {
  return {
    content: [{ type: "text" as const, text }]
  };
}

export function asJsonResult(value: unknown) {
  return asTextResult(JSON.stringify(value, null, 2));
}

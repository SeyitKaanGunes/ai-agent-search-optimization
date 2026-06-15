import { asTextResult } from "../lib/format.js";
import { extractSitemapUrls, fetchText, resolveSiteUrl, siteOrigin } from "../lib/web.js";

export type BuildLlmsTxtInput = {
  site: string;
  name: string;
  summary: string;
  links?: Array<{
    section?: string;
    title: string;
    url: string;
  }>;
  fromSitemap?: boolean;
  sitemapLimit?: number;
};

export async function buildLlmsTxt(input: BuildLlmsTxtInput) {
  const site = siteOrigin(input.site);
  const sections = new Map<string, Array<{ title: string; url: string }>>();
  addLink(sections, "Core pages", "Homepage", site);

  for (const link of input.links ?? []) {
    addLink(sections, link.section ?? "Core pages", link.title, resolveSiteUrl(site, link.url));
  }

  if (input.fromSitemap) {
    const sitemap = await fetchText(`${site}/sitemap.xml`, { timeoutMs: 12_000, maxBytes: 2_000_000 });
    if (sitemap.status === 200 && sitemap.text) {
      for (const url of extractSitemapUrls(sitemap.text, input.sitemapLimit ?? 25)) {
        addLink(sections, "Sitemap sample", titleFromUrl(url), url);
      }
    }
  }

  const output = renderLlmsTxt(input.name, site, input.summary, sections);
  return asTextResult(output);
}

function addLink(sections: Map<string, Array<{ title: string; url: string }>>, section: string, title: string, url: string) {
  const list = sections.get(section) ?? [];
  list.push({ title, url });
  sections.set(section, list);
}

function renderLlmsTxt(name: string, site: string, summary: string, sections: Map<string, Array<{ title: string; url: string }>>) {
  const lines = [
    `# ${name}`,
    "",
    `> ${summary}`,
    "",
    `Official website: ${site}`,
    ""
  ];

  for (const [section, links] of sections.entries()) {
    const seen = new Set<string>();
    const unique = links.filter((link) => {
      if (seen.has(link.url)) {
        return false;
      }
      seen.add(link.url);
      return true;
    });
    if (unique.length === 0) {
      continue;
    }

    lines.push(`## ${section}`, "");
    for (const link of unique) {
      lines.push(`- [${link.title}](${link.url})`);
    }
    lines.push("");
  }

  lines.push(
    "## Optional",
    "",
    "- Add markdown versions of dense docs or policy pages when available.",
    "- Keep this file short and remove stale URLs during each release or content update.",
    ""
  );

  return lines.join("\n");
}

function titleFromUrl(url: string) {
  const parsed = new URL(url);
  const path = parsed.pathname.replace(/\/$/, "");
  if (!path) {
    return "Homepage";
  }
  const slug = path.split("/").pop() || path;
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

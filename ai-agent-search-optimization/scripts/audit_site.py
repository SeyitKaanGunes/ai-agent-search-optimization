#!/usr/bin/env python3
"""Dependency-free AI search visibility audit for a single website URL."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from html.parser import HTMLParser
from typing import Any


DEFAULT_AGENTS = [
    "Googlebot",
    "OAI-SearchBot",
    "GPTBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Perplexity-User",
    "ClaudeBot",
    "CCBot",
]


class FetchResult(dict):
    pass


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self._in_title = False
        self._skip_depth = 0
        self.meta: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.headings: dict[str, list[str]] = {"h1": [], "h2": []}
        self.json_ld: list[str] = []
        self._in_json_ld = False
        self._json_ld_parts: list[str] = []
        self.text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attrs_dict = {k.lower(): (v or "") for k, v in attrs}
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1
        if tag == "title":
            self._in_title = True
        if tag == "meta":
            self.meta.append(attrs_dict)
        if tag == "link":
            self.links.append(attrs_dict)
        if tag == "script" and attrs_dict.get("type", "").lower() == "application/ld+json":
            self._in_json_ld = True
            self._json_ld_parts = []
        if tag in {"h1", "h2"}:
            self.text_parts.append(f"\n<{tag}>")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._in_json_ld:
            self.json_ld.append("".join(self._json_ld_parts).strip())
            self._in_json_ld = False
            self._json_ld_parts = []

    def handle_data(self, data: str) -> None:
        text = " ".join(data.split())
        if not text:
            return
        if self._in_title:
            self.title += text
        elif self._in_json_ld:
            self._json_ld_parts.append(data)
        elif not self._skip_depth:
            self.text_parts.append(text)

    def close(self) -> None:
        super().close()
        text = " ".join(self.text_parts)
        for level in ("h1", "h2"):
            pattern = re.compile(rf"<{level}>\s*([^<]+)", re.IGNORECASE)
            self.headings[level] = [m.group(1).strip() for m in pattern.finditer(text)]


def normalize_url(url: str) -> str:
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    parsed = urllib.parse.urlparse(url)
    path = parsed.path or "/"
    return urllib.parse.urlunparse((parsed.scheme, parsed.netloc, path, "", parsed.query, ""))


def origin(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def fetch(url: str, user_agent: str = "ai-agent-search-optimization/0.1", timeout: int = 12) -> FetchResult:
    req = urllib.request.Request(url, headers={"User-Agent": user_agent, "Accept": "text/html,text/plain,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read(2_000_000)
            charset = response.headers.get_content_charset() or "utf-8"
            return FetchResult(
                url=response.geturl(),
                status=response.status,
                headers=dict(response.headers.items()),
                text=raw.decode(charset, errors="replace"),
                error=None,
            )
    except urllib.error.HTTPError as exc:
        body = exc.read(200_000).decode("utf-8", errors="replace")
        return FetchResult(url=url, status=exc.code, headers=dict(exc.headers.items()), text=body, error=str(exc))
    except Exception as exc:  # noqa: BLE001
        return FetchResult(url=url, status=None, headers={}, text="", error=str(exc))


def meta_content(parser: PageParser, *names: str) -> str:
    wanted = {name.lower() for name in names}
    for item in parser.meta:
        key = (item.get("name") or item.get("property") or "").lower()
        if key in wanted:
            return item.get("content", "")
    return ""


def link_href(parser: PageParser, rel_name: str) -> str:
    rel_name = rel_name.lower()
    for item in parser.links:
        rels = {part.lower() for part in item.get("rel", "").split()}
        if rel_name in rels:
            return item.get("href", "")
    return ""


def parse_schema_types(json_ld_blocks: list[str]) -> list[str]:
    types: list[str] = []

    def walk(value: Any) -> None:
        if isinstance(value, dict):
            kind = value.get("@type")
            if isinstance(kind, str):
                types.append(kind)
            elif isinstance(kind, list):
                types.extend(str(item) for item in kind)
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    for block in json_ld_blocks:
        try:
            walk(json.loads(block))
        except json.JSONDecodeError:
            continue
    return sorted(set(types))


def parse_sitemaps(robots_text: str, site_origin: str) -> list[str]:
    found = []
    for line in robots_text.splitlines():
        if line.lower().startswith("sitemap:"):
            found.append(line.split(":", 1)[1].strip())
    if not found:
        found.append(urllib.parse.urljoin(site_origin, "/sitemap.xml"))
    return found


def audit(url: str, brand: str | None, agents: list[str]) -> dict[str, Any]:
    target = normalize_url(url)
    site_origin = origin(target)
    robots_url = urllib.parse.urljoin(site_origin, "/robots.txt")
    llms_url = urllib.parse.urljoin(site_origin, "/llms.txt")

    robots = fetch(robots_url, timeout=8)
    page = fetch(target)
    llms = fetch(llms_url, timeout=8)

    robot_parser = urllib.robotparser.RobotFileParser()
    robot_parser.set_url(robots_url)
    if robots.get("status") == 200:
        robot_parser.parse(robots.get("text", "").splitlines())

    parser = PageParser()
    if page.get("text"):
        parser.feed(page["text"])
        parser.close()

    visible_text = html.unescape(" ".join(parser.text_parts))
    visible_text = re.sub(r"\s+", " ", visible_text).strip()
    robots_meta = meta_content(parser, "robots", "googlebot")
    schema_types = parse_schema_types(parser.json_ld)
    sitemap_urls = parse_sitemaps(robots.get("text", ""), site_origin) if robots.get("status") == 200 else []

    agent_access = {}
    for agent in agents:
        if robots.get("status") == 200:
            agent_access[agent] = robot_parser.can_fetch(agent, target)
        else:
            agent_access[agent] = None

    internal_links = []
    for link in parser.links:
        href = link.get("href", "")
        if not href:
            continue
        absolute = urllib.parse.urljoin(target, href)
        if urllib.parse.urlparse(absolute).netloc == urllib.parse.urlparse(site_origin).netloc:
            internal_links.append(absolute)

    findings = build_findings(
        page=page,
        robots=robots,
        llms=llms,
        parser=parser,
        visible_text=visible_text,
        robots_meta=robots_meta,
        schema_types=schema_types,
        agent_access=agent_access,
        sitemap_urls=sitemap_urls,
        brand=brand,
    )

    return {
        "url": target,
        "final_url": page.get("url"),
        "status": page.get("status"),
        "robots_url": robots_url,
        "llms_url": llms_url,
        "title": parser.title.strip(),
        "description": meta_content(parser, "description"),
        "canonical": link_href(parser, "canonical"),
        "robots_meta": robots_meta,
        "h1": parser.headings["h1"][:5],
        "h2_sample": parser.headings["h2"][:10],
        "visible_text_chars": len(visible_text),
        "schema_types": schema_types,
        "json_ld_blocks": len(parser.json_ld),
        "internal_link_count": len(set(internal_links)),
        "sitemaps": sitemap_urls,
        "crawler_access": agent_access,
        "llms_txt": {
            "status": llms.get("status"),
            "chars": len(llms.get("text", "")),
            "has_h1": bool(re.search(r"^#\s+", llms.get("text", ""), re.M)),
            "link_count": len(re.findall(r"\[[^\]]+\]\([^)]+\)", llms.get("text", ""))),
        },
        "findings": findings,
    }


def build_findings(**data: Any) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []

    def add(severity: str, title: str, detail: str, fix: str) -> None:
        findings.append({"severity": severity, "title": title, "detail": detail, "fix": fix})

    page = data["page"]
    robots = data["robots"]
    llms = data["llms"]
    parser = data["parser"]
    visible_text = data["visible_text"]
    robots_meta = data["robots_meta"].lower()
    schema_types = data["schema_types"]
    agent_access = data["agent_access"]
    sitemap_urls = data["sitemap_urls"]
    brand = data["brand"]

    if page.get("status") != 200:
        add("critical", "Target URL is not returning HTTP 200", f"Status: {page.get('status')}, error: {page.get('error')}", "Fix status, redirect chain, or target URL before optimizing content.")
    if robots.get("status") != 200:
        add("high", "robots.txt could not be fetched", f"Status: {robots.get('status')}, error: {robots.get('error')}", "Publish a valid robots.txt and include sitemap references.")
    for agent, allowed in agent_access.items():
        if allowed is False:
            add("high", f"{agent} is disallowed by robots.txt", "This can block AI/search retrieval for that crawler.", f"Review robots.txt policy for {agent}; allow search crawlers when visibility is desired.")
    if not sitemap_urls:
        add("medium", "No sitemap discovered", "No Sitemap directive was found in robots.txt.", "Add Sitemap directives to robots.txt and keep XML sitemaps current.")
    if "noindex" in robots_meta:
        add("critical", "Page has noindex directive", robots_meta, "Remove noindex from pages meant to appear in search or AI answers.")
    if "nosnippet" in robots_meta or "max-snippet:0" in robots_meta.replace(" ", ""):
        add("high", "Snippet restrictions may reduce AI feature eligibility", robots_meta, "Use snippet restrictions only where required by policy or licensing.")
    if len(visible_text) < 1000:
        add("medium", "Low visible text volume", f"Only {len(visible_text)} visible text characters parsed.", "Ensure key answers, product facts, and evidence are available as server-rendered or crawlable text.")
    if not parser.title.strip():
        add("medium", "Missing title tag", "No title was parsed.", "Add a concise title naming the entity, category, and page purpose.")
    if not parser.headings["h1"]:
        add("medium", "Missing H1", "No H1 was parsed.", "Add one descriptive H1 that identifies the page topic.")
    if not schema_types:
        add("medium", "No JSON-LD schema detected", "No valid application/ld+json @type values found.", "Add schema that matches visible content, such as Organization, Product, Service, Article, FAQPage, or BreadcrumbList.")
    if llms.get("status") != 200:
        add("low", "No /llms.txt found", f"Status: {llms.get('status')}", "Consider adding a concise /llms.txt map for AI agents if the site has documentation, product, policy, or support resources.")
    if brand and brand.lower() not in visible_text.lower():
        add("medium", "Brand/entity name not found in visible text", f"Brand checked: {brand}", "Make the primary entity explicit in crawlable copy, schema, title, and key landing pages.")
    return findings


def to_markdown(report: dict[str, Any]) -> str:
    lines = [
        f"# AI Search Visibility Audit: {report['url']}",
        "",
        f"- Status: {report['status']}",
        f"- Final URL: {report.get('final_url')}",
        f"- Title: {report.get('title') or '(missing)'}",
        f"- Description: {report.get('description') or '(missing)'}",
        f"- Canonical: {report.get('canonical') or '(missing)'}",
        f"- Visible text chars: {report['visible_text_chars']}",
        f"- Schema types: {', '.join(report['schema_types']) or '(none)'}",
        f"- Internal links parsed: {report['internal_link_count']}",
        "",
        "## Crawler Access",
        "",
    ]
    for agent, allowed in report["crawler_access"].items():
        value = "unknown" if allowed is None else ("allowed" if allowed else "blocked")
        lines.append(f"- {agent}: {value}")
    lines.extend(["", "## llms.txt", ""])
    llms = report["llms_txt"]
    lines.extend([
        f"- URL: {report['llms_url']}",
        f"- Status: {llms['status']}",
        f"- Characters: {llms['chars']}",
        f"- Markdown H1: {llms['has_h1']}",
        f"- Markdown links: {llms['link_count']}",
        "",
        "## Findings",
        "",
    ])
    if not report["findings"]:
        lines.append("No major issues found by the lightweight audit. Run a deeper crawl and prompt visibility test next.")
    for item in report["findings"]:
        lines.extend([
            f"### [{item['severity']}] {item['title']}",
            "",
            f"- Detail: {item['detail']}",
            f"- Fix: {item['fix']}",
            "",
        ])
    return "\n".join(lines).strip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit a URL for AI search visibility basics.")
    parser.add_argument("url", help="URL to audit")
    parser.add_argument("--brand", help="Brand/entity name to check in visible text")
    parser.add_argument("--agents", help="Comma-separated user agents to test against robots.txt")
    parser.add_argument("--markdown", action="store_true", help="Print Markdown instead of JSON")
    args = parser.parse_args()

    agents = [item.strip() for item in args.agents.split(",")] if args.agents else DEFAULT_AGENTS
    report = audit(args.url, args.brand, [agent for agent in agents if agent])
    if args.markdown:
        sys.stdout.write(to_markdown(report))
    else:
        json.dump(report, sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

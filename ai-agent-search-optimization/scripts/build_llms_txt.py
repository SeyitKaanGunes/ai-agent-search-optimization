#!/usr/bin/env python3
"""Generate a concise llms.txt draft from site metadata and links."""

from __future__ import annotations

import argparse
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict


def normalize_site(site: str) -> str:
    if not re.match(r"^https?://", site, re.I):
        site = "https://" + site
    parsed = urllib.parse.urlparse(site)
    return f"{parsed.scheme}://{parsed.netloc}"


def parse_link(raw: str) -> tuple[str, str, str]:
    if "=" not in raw:
        raise ValueError(f"Link must use Title=url format: {raw}")
    left, url = raw.split("=", 1)
    if ":" in left:
        section, title = left.split(":", 1)
    else:
        section, title = "Core pages", left
    return section.strip(), title.strip(), url.strip()


def fetch_sitemap_urls(site: str, limit: int) -> list[str]:
    sitemap_url = urllib.parse.urljoin(site, "/sitemap.xml")
    req = urllib.request.Request(sitemap_url, headers={"User-Agent": "ai-agent-search-optimization/0.1"})
    with urllib.request.urlopen(req, timeout=12) as response:
        data = response.read(2_000_000)
    root = ET.fromstring(data)
    urls: list[str] = []
    for loc in root.iter():
        if loc.tag.endswith("loc") and loc.text:
            urls.append(loc.text.strip())
        if len(urls) >= limit:
            break
    return urls


def title_from_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.strip("/")
    if not path:
        return "Homepage"
    slug = path.rsplit("/", 1)[-1]
    slug = re.sub(r"[-_]+", " ", slug)
    return slug.strip().title() or url


def render(name: str, site: str, summary: str, sections: dict[str, list[tuple[str, str]]]) -> str:
    lines = [
        f"# {name}",
        "",
        f"> {summary}",
        "",
        f"Official website: {site}",
        "",
    ]
    for section, links in sections.items():
        if not links:
            continue
        lines.extend([f"## {section}", ""])
        seen: set[str] = set()
        for title, url in links:
            if url in seen:
                continue
            seen.add(url)
            lines.append(f"- [{title}]({url})")
        lines.append("")
    lines.extend([
        "## Optional",
        "",
        "- Add markdown versions of dense docs or policy pages when available.",
        "- Keep this file short and remove stale URLs during each release or content update.",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build an llms.txt draft.")
    parser.add_argument("--site", required=True, help="Site origin, e.g. https://example.com")
    parser.add_argument("--name", required=True, help="Brand, product, or website name")
    parser.add_argument("--summary", required=True, help="One sentence summary for AI agents")
    parser.add_argument("--link", action="append", default=[], help="Repeatable Section:Title=url or Title=url")
    parser.add_argument("--from-sitemap", action="store_true", help="Include URLs from /sitemap.xml")
    parser.add_argument("--sitemap-limit", type=int, default=25, help="Maximum sitemap URLs to include")
    parser.add_argument("--output", help="Write to this file instead of stdout")
    args = parser.parse_args()

    site = normalize_site(args.site)
    sections: dict[str, list[tuple[str, str]]] = defaultdict(list)
    sections["Core pages"].append(("Homepage", site))

    for raw in args.link:
        section, title, url = parse_link(raw)
        sections[section].append((title, urllib.parse.urljoin(site, url)))

    if args.from_sitemap:
        try:
            for url in fetch_sitemap_urls(site, args.sitemap_limit):
                sections["Sitemap sample"].append((title_from_url(url), url))
        except Exception as exc:  # noqa: BLE001
            print(f"warning: sitemap fetch failed: {exc}", file=sys.stderr)

    output = render(args.name, site, args.summary, sections)
    if args.output:
        with open(args.output, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(output)
    else:
        sys.stdout.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

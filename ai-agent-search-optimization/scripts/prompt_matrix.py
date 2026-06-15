#!/usr/bin/env python3
"""Generate reusable AI visibility prompts for brand/category monitoring."""

from __future__ import annotations

import argparse
import csv
import json
import sys


TEMPLATES = [
    ("discovery", "What are the best {category} options for {audience}? Include sources."),
    ("recommendation", "Recommend a {category} for {audience}. Explain why and cite sources."),
    ("comparison", "Compare {brand} with {competitor} for {audience}. Include strengths, weaknesses, and sources."),
    ("alternatives", "What are the strongest alternatives to {competitor} in {category}? Include sources."),
    ("pricing", "How much does {brand} cost, and how does pricing compare with {competitor}? Cite sources."),
    ("trust", "Is {brand} trustworthy for {audience}? Discuss evidence, reviews, security, and sources."),
    ("implementation", "How do I implement or get started with {brand}? Cite official sources."),
    ("problem", "Which {category} should I choose if my main problem is {pain}? Include sources."),
    ("local", "Which {category} providers are best for {location}? Include sources."),
    ("citation", "Find official sources that explain what {brand} does, who it is for, and why it is different."),
]


def build_rows(args: argparse.Namespace) -> list[dict[str, str]]:
    competitors = [item.strip() for item in (args.competitors or "").split(",") if item.strip()]
    pains = [item.strip() for item in (args.pains or "").split(",") if item.strip()] or ["reducing cost", "improving quality", "saving time"]
    rows: list[dict[str, str]] = []

    for intent, template in TEMPLATES:
        if "{competitor}" in template:
            values = competitors or ["a leading competitor"]
            for competitor in values:
                rows.append(row(intent, template, args, competitor=competitor, pain=pains[0]))
        elif "{pain}" in template:
            for pain in pains:
                rows.append(row(intent, template, args, competitor=competitors[0] if competitors else "a competitor", pain=pain))
        else:
            rows.append(row(intent, template, args, competitor=competitors[0] if competitors else "a competitor", pain=pains[0]))
    return rows


def row(intent: str, template: str, args: argparse.Namespace, competitor: str, pain: str) -> dict[str, str]:
    prompt = template.format(
        brand=args.brand,
        category=args.category,
        audience=args.audience,
        competitor=competitor,
        pain=pain,
        location=args.location,
    )
    return {
        "intent": intent,
        "surface": args.surface,
        "brand": args.brand,
        "category": args.category,
        "competitor": competitor,
        "prompt": prompt,
        "expected_checks": "brand_mentioned,owned_url_cited,sentiment,competitors,cited_urls",
    }


def write_csv(rows: list[dict[str, str]], output: str | None) -> None:
    handle = open(output, "w", encoding="utf-8", newline="") if output else sys.stdout
    try:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    finally:
        if output:
            handle.close()


def write_markdown(rows: list[dict[str, str]], output: str | None) -> None:
    lines = ["| Intent | Surface | Prompt | Checks |", "|---|---|---|---|"]
    for item in rows:
        prompt = item["prompt"].replace("|", "\\|")
        lines.append(f"| {item['intent']} | {item['surface']} | {prompt} | {item['expected_checks']} |")
    text = "\n".join(lines) + "\n"
    if output:
        with open(output, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
    else:
        sys.stdout.write(text)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate AI visibility prompt matrix.")
    parser.add_argument("--brand", required=True)
    parser.add_argument("--category", required=True)
    parser.add_argument("--audience", default="buyers")
    parser.add_argument("--competitors", help="Comma-separated competitor names")
    parser.add_argument("--pains", help="Comma-separated customer problems")
    parser.add_argument("--location", default="the United States")
    parser.add_argument("--surface", default="ChatGPT,Perplexity,Google AI Mode")
    parser.add_argument("--format", choices=["csv", "json", "markdown"], default="csv")
    parser.add_argument("--output", help="Output path")
    args = parser.parse_args()

    rows = build_rows(args)
    if args.format == "json":
        text = json.dumps(rows, indent=2, ensure_ascii=False) + "\n"
        if args.output:
            with open(args.output, "w", encoding="utf-8", newline="\n") as handle:
                handle.write(text)
        else:
            sys.stdout.write(text)
    elif args.format == "markdown":
        write_markdown(rows, args.output)
    else:
        write_csv(rows, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

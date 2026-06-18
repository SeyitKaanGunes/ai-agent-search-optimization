const DEFAULT_USER_AGENT = "mcp-server-ai-agent-search-optimization/0.1.1";

export type FetchResult = {
  url: string;
  status: number | null;
  headers: Record<string, string>;
  text: string;
  error: string | null;
};

export function normalizeHttpUrl(input: string, path = "/"): string {
  const raw = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Only http and https URLs are supported: ${input}`);
  }
  if (!url.pathname || url.pathname === "") {
    url.pathname = path;
  }
  url.hash = "";
  return url.toString();
}

export function siteOrigin(input: string): string {
  const url = new URL(normalizeHttpUrl(input));
  return `${url.protocol}//${url.host}`;
}

export function resolveSiteUrl(site: string, link: string): string {
  return new URL(link, siteOrigin(site)).toString();
}

export async function fetchText(url: string, options: { timeoutMs?: number; maxBytes?: number; userAgent?: string } = {}): Promise<FetchResult> {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const maxBytes = options.maxBytes ?? 2_000_000;
  const target = normalizeHttpUrl(url);

  try {
    const response = await fetch(target, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "user-agent": options.userAgent ?? DEFAULT_USER_AGENT,
        accept: "text/html,text/plain,application/xml,text/xml,*/*"
      }
    });

    const headers = Object.fromEntries(response.headers.entries());
    const length = Number(headers["content-length"] ?? "0");
    if (length > maxBytes) {
      return {
        url: response.url,
        status: response.status,
        headers,
        text: "",
        error: `Response too large: ${length} bytes > ${maxBytes} bytes`
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const body = buffer.subarray(0, maxBytes).toString("utf8");
    return {
      url: response.url,
      status: response.status,
      headers,
      text: body,
      error: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      url: target,
      status: null,
      headers: {},
      text: "",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function extractSitemapUrls(xml: string, limit: number): string[] {
  const urls: string[] = [];
  const pattern = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(xml)) && urls.length < limit) {
    urls.push(decodeHtml(match[1].trim()));
  }
  return urls;
}

export function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

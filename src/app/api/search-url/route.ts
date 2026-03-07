import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  console.log(`[search-url] Query: "${q}"`);

  // Try DuckDuckGo lite (less restrictive than html version)
  const url = await tryDDGLite(q) || await tryDDGApi(q);

  if (url) {
    console.log(`[search-url] Result: ${url}`);
    return NextResponse.json({ url });
  }

  console.log(`[search-url] No results found for "${q}"`);
  return NextResponse.json({ error: "No results found" }, { status: 404 });
}

async function tryDDGLite(q: string): Promise<string | null> {
  try {
    const res = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: `q=${encodeURIComponent(q)}`,
      signal: AbortSignal.timeout(8000),
    });

    console.log(`[search-url] DDG lite: ${res.status}`);
    if (!res.ok) return null;

    const html = await res.text();

    // Lite results have links like: <a rel="nofollow" href="https://...">
    // Skip DuckDuckGo's own links
    const matches = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter(
        (u) =>
          !u.includes("duckduckgo.com") &&
          !u.includes("duck.co") &&
          !u.includes("spreadprivacy.com")
      );

    if (matches.length > 0) {
      let url = matches[0];
      // Handle uddg redirect wrapper
      const uddg = url.match(/uddg=([^&]+)/);
      if (uddg?.[1]) url = decodeURIComponent(uddg[1]);
      return url;
    }

    return null;
  } catch (err) {
    console.error(`[search-url] DDG lite error:`, err);
    return null;
  }
}

async function tryDDGApi(q: string): Promise<string | null> {
  try {
    // DuckDuckGo instant answer API — returns a redirect URL for bang-like queries
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1`,
      {
        headers: { "User-Agent": "Dump/1.0" },
        signal: AbortSignal.timeout(5000),
      }
    );

    console.log(`[search-url] DDG API: ${res.status}`);
    if (!res.ok) return null;

    const data = await res.json();

    // Check for redirect (AbstractURL or official site)
    if (data.AbstractURL) return data.AbstractURL;
    if (data.Results?.[0]?.FirstURL) return data.Results[0].FirstURL;
    if (data.RelatedTopics?.[0]?.FirstURL) return data.RelatedTopics[0].FirstURL;

    return null;
  } catch (err) {
    console.error(`[search-url] DDG API error:`, err);
    return null;
  }
}

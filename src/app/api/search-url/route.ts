import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    // Use DuckDuckGo HTML search and extract first result URL
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Dump/1.0)",
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    const html = await res.text();

    // DuckDuckGo HTML results have links in <a class="result__a" href="...">
    const match = html.match(/class="result__a"[^>]*href="([^"]+)"/);
    if (match?.[1]) {
      let url = match[1];
      // DuckDuckGo wraps URLs in a redirect, extract the actual URL
      const uddg = url.match(/uddg=([^&]+)/);
      if (uddg?.[1]) {
        url = decodeURIComponent(uddg[1]);
      }
      return NextResponse.json({ url });
    }

    return NextResponse.json({ error: "No results found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

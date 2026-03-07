import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    console.error("[search-url] SCRAPINGBEE_API_KEY not set");
    return NextResponse.json({ error: "Search not configured" }, { status: 500 });
  }

  console.log(`[search-url] Query: "${q}"`);

  try {
    const res = await fetch(
      `https://app.scrapingbee.com/api/v1/fast_search?api_key=${apiKey}&search=${encodeURIComponent(q)}&language=en&country_code=us`,
      { signal: AbortSignal.timeout(10000) }
    );

    console.log(`[search-url] ScrapingBee: ${res.status}`);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[search-url] ScrapingBee error: ${text}`);
      return NextResponse.json({ error: "Search failed" }, { status: 502 });
    }

    const data = await res.json();
    const first = data.organic?.[0];

    if (first?.link) {
      console.log(`[search-url] Result: ${first.link} — "${first.title}"`);
      return NextResponse.json({ url: first.link, title: first.title });
    }

    console.log(`[search-url] No organic results`);
    return NextResponse.json({ error: "No results found" }, { status: 404 });
  } catch (err) {
    console.error(`[search-url] Error:`, err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

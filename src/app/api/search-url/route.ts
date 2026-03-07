import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  console.log(`[search-url] Query: "${q}"`);

  const url = await tryDDGLite(q) || await tryDDGApi(q) || await tryGoogleRedirect(q);

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
      redirect: "follow",
    });

    console.log(`[search-url] DDG lite: ${res.status}`);
    if (res.status !== 200) return null;

    const html = await res.text();
    console.log(`[search-url] DDG lite HTML length: ${html.length}`);

    // Lite results have links in <a rel="nofollow" href="..."> after result number cells
    const matches = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      .filter(
        (u) =>
          !u.includes("duckduckgo.com") &&
          !u.includes("duck.co") &&
          !u.includes("spreadprivacy.com")
      );

    console.log(`[search-url] DDG lite found ${matches.length} candidate URLs`);
    if (matches.length > 0) {
      let url = matches[0];
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
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&no_redirect=1`,
      {
        headers: { "User-Agent": "Dump/1.0" },
        signal: AbortSignal.timeout(5000),
      }
    );

    console.log(`[search-url] DDG API: ${res.status}`);
    if (!res.ok) return null;

    const text = await res.text();
    console.log(`[search-url] DDG API response length: ${text.length}`);
    if (!text || text.length < 2) return null;

    const data = JSON.parse(text);

    if (data.AbstractURL) return data.AbstractURL;
    if (data.Results?.[0]?.FirstURL) return data.Results[0].FirstURL;
    if (data.RelatedTopics?.[0]?.FirstURL) return data.RelatedTopics[0].FirstURL;
    if (data.Redirect) return data.Redirect;

    return null;
  } catch (err) {
    console.error(`[search-url] DDG API error:`, err);
    return null;
  }
}

async function tryGoogleRedirect(q: string): Promise<string | null> {
  try {
    // Google's "I'm Feeling Lucky" — follow the redirect to get the first result
    const res = await fetch(
      `https://www.google.com/search?q=${encodeURIComponent(q)}&btnI=1`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(5000),
        redirect: "manual",
      }
    );

    console.log(`[search-url] Google redirect: ${res.status}`);
    const location = res.headers.get("location");
    console.log(`[search-url] Google location: ${location}`);

    if (location && !location.includes("google.com/sorry") && !location.includes("google.com/search")) {
      // May be a consent redirect — check if it's an actual external URL
      if (location.startsWith("http") && !location.includes("google.com")) {
        return location;
      }
      // Google may redirect to consent page, try to extract url= param
      const urlParam = location.match(/[?&]url=([^&]+)/);
      if (urlParam?.[1]) return decodeURIComponent(urlParam[1]);
    }

    return null;
  } catch (err) {
    console.error(`[search-url] Google redirect error:`, err);
    return null;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { extractMeta, extractTagContent, extractLink } from "@/lib/metadata";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MagpaiBot/1.0; +https://magpai.app)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({});
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({});
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    const maxSize = 50_000;

    while (totalSize < maxSize) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
    }
    reader.cancel();

    const html = new TextDecoder().decode(
      chunks.reduce((acc, chunk) => {
        const merged = new Uint8Array(acc.length + chunk.length);
        merged.set(acc);
        merged.set(chunk, acc.length);
        return merged;
      }, new Uint8Array())
    );

    const title =
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      extractTagContent(html, "title");

    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "twitter:description") ||
      extractMeta(html, "description");

    let favicon = extractLink(html, "icon") || extractLink(html, "shortcut icon");

    if (favicon && !favicon.startsWith("http")) {
      try {
        const base = new URL(url);
        favicon = new URL(favicon, base.origin).href;
      } catch {
        favicon = undefined;
      }
    }

    let image = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");

    if (image && !image.startsWith("http")) {
      try {
        const base = new URL(url);
        image = new URL(image, base.origin).href;
      } catch {
        image = undefined;
      }
    }

    return NextResponse.json({
      title: title || undefined,
      description: description ? description.slice(0, 200) : undefined,
      favicon: favicon || undefined,
      image: image || undefined,
    });
  } catch {
    return NextResponse.json({});
  }
}

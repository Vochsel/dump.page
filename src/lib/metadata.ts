export function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*?)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*?)["'][^>]*(?:property|name)=["']${escapeRegex(property)}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return undefined;
}

export function extractTagContent(html: string, tag: string): string | undefined {
  const match = html.match(
    new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i")
  );
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined;
}

export function extractLink(html: string, rel: string): string | undefined {
  const match = html.match(
    new RegExp(
      `<link[^>]*rel=["']${escapeRegex(rel)}["'][^>]*href=["']([^"']*?)["']`,
      "i"
    )
  );
  if (match?.[1]) return match[1];
  const match2 = html.match(
    new RegExp(
      `<link[^>]*href=["']([^"']*?)["'][^>]*rel=["']${escapeRegex(rel)}["']`,
      "i"
    )
  );
  return match2?.[1] || undefined;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

const SITE_URL = "https://www.dump.page";

export function getBoardUrl(slug: string, options?: {
  visibility?: "private" | "shared" | "public";
  shareToken?: string;
  itemId?: string;
  absolute?: boolean; // default true
}): string {
  const { visibility, shareToken, itemId, absolute = true } = options ?? {};
  const base = absolute ? SITE_URL : "";
  let url = `${base}/b/${slug}`;
  if (itemId) url += `/${itemId}`;
  if (visibility === "shared" && shareToken) {
    url += `?token=${shareToken}`;
  }
  return url;
}

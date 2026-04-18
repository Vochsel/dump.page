const SITE_URL = "https://www.dump.page";

export function getSharedBoardPathUrl(slug: string, shareToken: string, options?: {
  itemId?: string;
  absolute?: boolean; // default true
}) {
  const { itemId, absolute = true } = options ?? {};
  const base = absolute ? SITE_URL : "";
  let url = `${base}/s/${shareToken}/b/${slug}`;
  if (itemId) url += `/${itemId}`;
  return url;
}

export function getBoardUrl(slug: string, options?: {
  visibility?: "private" | "shared" | "public";
  shareToken?: string;
  itemId?: string;
  absolute?: boolean; // default true
}): string {
  const { visibility, shareToken, itemId, absolute = true } = options ?? {};

  if (visibility === "shared" && shareToken) {
    return getSharedBoardPathUrl(slug, shareToken, { itemId, absolute });
  }

  const base = absolute ? SITE_URL : "";
  let url = `${base}/b/${slug}`;
  if (itemId) url += `/${itemId}`;
  return url;
}

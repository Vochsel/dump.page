import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { htmlToMarkdown } from "./html-to-markdown";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function getBoardRss(
  slug: string,
  shareToken?: string,
  baseUrl?: string
): Promise<{ xml: string; status: number }> {
  try {
    const result = await convex.query(api.boards.getBoardForMarkdown, {
      slug,
      shareToken,
    });

    if (!result) {
      return {
        xml: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Not Found</title><description>This board is private or does not exist.</description></channel></rss>`,
        status: 404,
      };
    }

    const { board, nodes } = result;
    const siteUrl = baseUrl || "https://magpai.app";
    const boardUrl = `${siteUrl}/b/${slug}${shareToken ? `?token=${shareToken}` : ""}`;
    const now = new Date().toUTCString();

    const items = nodes
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((node) => {
        let title: string;
        let description: string;
        let link: string | undefined;

        if (node.type === "link") {
          title = node.metadata?.title || node.content;
          description = node.metadata?.description || node.content;
          link = node.content;
        } else if (node.type === "text") {
          if (node.title) {
            title = node.title;
          } else {
            const text = htmlToMarkdown(node.content);
            title = text.slice(0, 100) + (text.length > 100 ? "..." : "");
          }
          description = htmlToMarkdown(node.content);
        } else {
          // checklist
          title = node.title || "Checklist";
          try {
            const items = JSON.parse(node.content);
            if (Array.isArray(items)) {
              description = items.map((i: { text: string; checked: boolean }) =>
                `[${i.checked ? "x" : " "}] ${i.text}`
              ).join("\n");
            } else {
              description = node.content;
            }
          } catch {
            description = node.content;
          }
        }

        const pubDate = new Date(node.updatedAt).toUTCString();

        return `    <item>
      <title>${escapeXml(title)}</title>
      <description>${escapeXml(description)}</description>${link ? `\n      <link>${escapeXml(link)}</link>` : ""}
      <guid isPermaLink="false">${slug}-${node._id}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${board.icon} ${board.name}`)}</title>
    <link>${escapeXml(boardUrl)}</link>
    <description>${escapeXml(`${board.name} - a Dump board`)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteUrl}/b/${slug}/rss.xml${shareToken ? `?token=${shareToken}` : ""}`)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>`;

    return { xml, status: 200 };
  } catch {
    return {
      xml: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Failed to load board.</description></channel></rss>`,
      status: 500,
    };
  }
}

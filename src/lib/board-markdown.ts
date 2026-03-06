import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import TurndownService from "turndown";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

function contentToMarkdown(content: string): string {
  if (!content) return "";
  // If content looks like HTML, convert to markdown
  if (content.trimStart().startsWith("<")) {
    return turndown.turndown(content);
  }
  return content;
}

const RSS_EXTENSIONS = [".rss", ".xml", ".atom"];
const RSS_PATH_PATTERNS = ["/feed", "/rss", "/atom"];

function looksLikeRssFeed(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (RSS_EXTENSIONS.some((ext) => path.endsWith(ext))) return true;
    if (RSS_PATH_PATTERNS.some((p) => path.includes(p))) return true;
    return false;
  } catch {
    return false;
  }
}

interface RssItem {
  title: string;
  link: string;
}

async function fetchRssItems(url: string): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MagpaiBot/1.0; +https://magpai.app)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();

    // Check if this is actually XML/RSS content
    if (!xml.includes("<rss") && !xml.includes("<feed") && !xml.includes("<channel")) {
      return [];
    }

    const items: RssItem[] = [];

    // Parse RSS 2.0 <item> elements
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
      const block = match[1];
      const title = extractXmlTag(block, "title");
      const link = extractXmlTag(block, "link") || extractXmlAttr(block, "link", "href");
      if (title && link) items.push({ title, link });
    }

    // If no RSS items found, try Atom <entry> elements
    if (items.length === 0) {
      const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
      while ((match = entryRegex.exec(xml)) !== null && items.length < 20) {
        const block = match[1];
        const title = extractXmlTag(block, "title");
        const link = extractXmlAttr(block, "link", "href") || extractXmlTag(block, "link");
        if (title && link) items.push({ title, link });
      }
    }

    return items;
  } catch {
    return [];
  }
}

function extractXmlTag(xml: string, tag: string): string | undefined {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataMatch = xml.match(
    new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i")
  );
  if (cdataMatch?.[1]) return cdataMatch[1].trim();

  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return match?.[1]?.trim();
}

function extractXmlAttr(xml: string, tag: string, attr: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, "i"));
  return match?.[1]?.trim();
}

export async function getBoardMarkdown(
  boardId: string,
  shareToken?: string
): Promise<{ markdown: string; status: number }> {
  try {
    const result = await convex.query(api.boards.getBoardForMarkdown, {
      boardId: boardId as Id<"boards">,
      shareToken,
    });

    if (!result) {
      return {
        markdown: "# Board Not Found\n\nThis board is private or does not exist.",
        status: 404,
      };
    }

    const { board, nodes } = result;

    let markdown = `# ${board.icon} ${board.name}\n\n`;

    const textNodes = nodes.filter((n) => n.type === "text");
    const linkNodes = nodes.filter((n) => n.type === "link");
    const checklistNodes = nodes.filter((n) => n.type === "checklist");

    if (textNodes.length > 0) {
      markdown += `## Notes\n\n`;
      for (const node of textNodes) {
        if (node.title) {
          markdown += `### ${node.title}\n\n`;
        }
        markdown += `${contentToMarkdown(node.content)}\n\n`;
      }
    }

    if (checklistNodes.length > 0) {
      markdown += `## Checklists\n\n`;
      for (const node of checklistNodes) {
        if (node.title) {
          markdown += `### ${node.title}\n\n`;
        }
        try {
          const items = JSON.parse(node.content);
          if (Array.isArray(items)) {
            for (const item of items) {
              markdown += `- [${item.checked ? "x" : " "}] ${item.text}\n`;
            }
            markdown += `\n`;
          }
        } catch {
          markdown += `${node.content}\n\n`;
        }
      }
    }

    if (linkNodes.length > 0) {
      // Fetch RSS feeds in parallel for link nodes that look like feeds
      const rssResults = await Promise.all(
        linkNodes.map((node) =>
          looksLikeRssFeed(node.content)
            ? fetchRssItems(node.content)
            : Promise.resolve([] as RssItem[])
        )
      );

      markdown += `## Links\n\n`;
      for (let i = 0; i < linkNodes.length; i++) {
        const node = linkNodes[i];
        const rssItems = rssResults[i];
        const title = node.metadata?.title || node.content;
        markdown += `- [${title}](${node.content})`;
        if (node.metadata?.description) {
          markdown += ` - ${node.metadata.description}`;
        }
        markdown += `\n`;

        if (rssItems.length > 0) {
          for (const item of rssItems) {
            markdown += `  - [${item.title}](${item.link})\n`;
          }
        }
      }
    }

    if (nodes.length === 0) {
      markdown += `*This board is empty.*\n`;
    }

    return { markdown, status: 200 };
  } catch {
    return {
      markdown: "# Error\n\nFailed to load board.",
      status: 500,
    };
  }
}

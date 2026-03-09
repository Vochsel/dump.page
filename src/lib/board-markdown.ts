import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
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

const MCP_FOOTER = `\n---\n\n> **Tip:** For live access to this board and the ability to make changes, install the [Dump MCP integration](https://www.dump.page/mcp). Setup instructions for ChatGPT, Claude, Claude Code, and Codex are available at [dump.page/mcp](https://www.dump.page/mcp).\n`;

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

export async function getItemMarkdown(
  slug: string,
  itemId: string,
  shareToken?: string
): Promise<{ markdown: string; status: number }> {
  try {
    const result = await convex.query(api.boards.getBoardForMarkdown, {
      slug,
      shareToken,
    });

    if (!result) {
      return {
        markdown: "# Not Found\n\nThis board is private or does not exist.",
        status: 404,
      };
    }

    const { board, nodes } = result;
    const node = nodes.find((n) => n._id === itemId);

    if (!node) {
      return {
        markdown: "# Item Not Found\n\nThis item does not exist on this board.",
        status: 404,
      };
    }

    let markdown = `# ${board.name}\n\n`;

    if (node.type === "text") {
      if (node.title) markdown += `## ${node.title}\n\n`;
      markdown += `${contentToMarkdown(node.content)}\n`;
    } else if (node.type === "checklist") {
      if (node.title) markdown += `## ${node.title}\n\n`;
      try {
        const items = JSON.parse(node.content);
        if (Array.isArray(items)) {
          for (const item of items) {
            markdown += `- [${item.checked ? "x" : " "}] ${item.text}\n`;
          }
        }
      } catch {
        markdown += `${node.content}\n`;
      }
    } else if (node.type === "link") {
      const title = node.metadata?.title || node.content;
      markdown += `- [${title}](${node.content})`;
      if (node.metadata?.description) {
        markdown += ` - ${node.metadata.description}`;
      }
      markdown += "\n";
    }

    return { markdown, status: 200 };
  } catch {
    return {
      markdown: "# Error\n\nFailed to load item.",
      status: 500,
    };
  }
}

type MarkdownNode = {
  id?: string;
  type: string;
  content: string;
  title?: string;
  position?: { x: number; y: number };
  metadata?: { title?: string; description?: string } | null;
  _rssAppend?: string;
};

type MarkdownEdge = {
  source: string;
  target: string;
};

/** Render a single node to markdown */
function renderNode(node: MarkdownNode): string {
  if (node.type === "text") {
    let md = "";
    if (node.title) md += `### ${node.title}\n\n`;
    md += `${contentToMarkdown(node.content)}\n\n`;
    return md;
  }
  if (node.type === "checklist") {
    let md = "";
    if (node.title) md += `### ${node.title}\n\n`;
    try {
      const items = JSON.parse(node.content);
      if (Array.isArray(items)) {
        for (const item of items) {
          md += `- [${item.checked ? "x" : " "}] ${item.text}\n`;
        }
        md += `\n`;
      }
    } catch {
      md += `${node.content}\n\n`;
    }
    return md;
  }
  if (node.type === "link") {
    const title = node.metadata?.title || node.content;
    let md = `- [${title}](${node.content})`;
    if (node.metadata?.description) {
      md += ` - ${node.metadata.description}`;
    }
    md += `\n`;
    if (node._rssAppend) {
      md += `${node._rssAppend}\n`;
    }
    return md;
  }
  return `${node.content}\n\n`;
}

/**
 * Build connected chains from edges using DFS.
 * Returns arrays of node IDs in traversal order.
 * Handles cycles by skipping already-visited nodes.
 */
function buildConnectedChains(
  nodeIds: Set<string>,
  edges: MarkdownEdge[]
): { chains: string[][]; orphanIds: Set<string> } {
  const adjacency = new Map<string, string[]>();
  const connectedIds = new Set<string>();

  // The visual arrow (markerStart) points at the source node, meaning the
  // user drags FROM source TO target but the arrow shows target → source.
  // So the intended reading order follows target → source.
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.target)!.push(edge.source);
  }

  // Roots: nodes with no incoming edges in the reversed graph
  // (i.e. nodes that are never a "source" in the original edges)
  const hasIncoming = new Set<string>();
  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      hasIncoming.add(edge.source);
    }
  }

  const roots = [...connectedIds].filter((id) => !hasIncoming.has(id));
  // If all nodes have incoming edges (cycle), pick any as root
  if (roots.length === 0 && connectedIds.size > 0) {
    roots.push([...connectedIds][0]);
  }

  const visited = new Set<string>();
  const chains: string[][] = [];

  function dfs(nodeId: string, chain: string[]) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    chain.push(nodeId);
    const neighbors = adjacency.get(nodeId) || [];
    for (const next of neighbors) {
      dfs(next, chain);
    }
  }

  for (const root of roots) {
    if (visited.has(root)) continue;
    const chain: string[] = [];
    dfs(root, chain);
    if (chain.length > 0) chains.push(chain);
  }

  // Pick up any connected nodes missed (part of isolated cycles not reachable from roots)
  for (const id of connectedIds) {
    if (visited.has(id)) continue;
    const chain: string[] = [];
    dfs(id, chain);
    if (chain.length > 0) chains.push(chain);
  }

  const orphanIds = new Set([...nodeIds].filter((id) => !connectedIds.has(id)));
  return { chains, orphanIds };
}

/**
 * Cluster nodes by spatial proximity using single-linkage clustering.
 * Nodes within `eps` pixels of each other (Euclidean) are grouped together.
 */
function clusterByProximity(
  nodes: MarkdownNode[],
  eps = 400
): MarkdownNode[][] {
  if (nodes.length === 0) return [];

  // Nodes without position go into a single fallback cluster
  const withPos = nodes.filter((n) => n.position);
  const withoutPos = nodes.filter((n) => !n.position);

  if (withPos.length === 0) return withoutPos.length > 0 ? [withoutPos] : [];

  // Union-Find for clustering
  const parent = new Map<number, number>();
  function find(i: number): number {
    if (parent.get(i) !== i) parent.set(i, find(parent.get(i)!));
    return parent.get(i)!;
  }
  function union(a: number, b: number) {
    parent.set(find(a), find(b));
  }
  for (let i = 0; i < withPos.length; i++) parent.set(i, i);

  for (let i = 0; i < withPos.length; i++) {
    for (let j = i + 1; j < withPos.length; j++) {
      const dx = withPos[i].position!.x - withPos[j].position!.x;
      const dy = withPos[i].position!.y - withPos[j].position!.y;
      if (Math.sqrt(dx * dx + dy * dy) < eps) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, MarkdownNode[]>();
  for (let i = 0; i < withPos.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(withPos[i]);
  }

  // Sort nodes within each cluster top-to-bottom, left-to-right
  const clusters = [...groups.values()].map((group) =>
    group.sort((a, b) => {
      const dy = a.position!.y - b.position!.y;
      return Math.abs(dy) > 20 ? dy : a.position!.x - b.position!.x;
    })
  );

  // Sort clusters by average Y position (top-to-bottom)
  clusters.sort((a, b) => {
    const avgYA = a.reduce((s, n) => s + n.position!.y, 0) / a.length;
    const avgYB = b.reduce((s, n) => s + n.position!.y, 0) / b.length;
    return avgYA - avgYB;
  });

  if (withoutPos.length > 0) clusters.push(withoutPos);
  return clusters;
}

// Format pre-fetched board data as markdown (no auth check, caller must verify access)
export function formatBoardDataAsMarkdown(
  board: {
    name: string;
    settings?: { contextType?: string; systemPrompt?: string } | null;
  },
  nodes: Array<MarkdownNode>,
  edges?: Array<MarkdownEdge>
): string {
  let markdown = `# ${board.name}\n\n`;

  const contextType = board.settings?.contextType;
  if (contextType === "skill") {
    markdown += `> **Context Type: Skill** — This board provides contextual information to be used as a skill. Refer to it frequently for updated context.\n\n`;
  } else if (contextType === "agent") {
    markdown += `> **Context Type: Agent** — This board defines an agent persona. The goals, personality, and instructions below should take over your current context.\n\n`;
  }

  if (board.settings?.systemPrompt) {
    markdown += `${board.settings.systemPrompt}\n\n`;
  }

  if (nodes.length === 0) {
    markdown += `*This board is empty.*\n`;
    markdown += MCP_FOOTER;
    return markdown;
  }

  // Build node lookup by ID
  const nodeById = new Map<string, MarkdownNode>();
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (node.id) {
      nodeById.set(node.id, node);
      nodeIds.add(node.id);
    }
  }

  const validEdges = (edges || []).filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  // Split into connected chains and orphans
  const { chains, orphanIds } = buildConnectedChains(nodeIds, validEdges);

  // Collect all render groups: each group is an ordered array of nodes
  // with an avgY for top-to-bottom sorting between groups.
  const groups: { nodes: MarkdownNode[]; avgY: number }[] = [];

  // Connected chains as groups
  for (const chain of chains) {
    const chainNodes = chain.map((id) => nodeById.get(id)).filter(Boolean) as MarkdownNode[];
    const avgY = chainNodes.reduce((s, n) => s + (n.position?.y ?? 0), 0) / chainNodes.length;
    groups.push({ nodes: chainNodes, avgY });
  }

  // Orphan nodes clustered by proximity, each cluster is a group
  const orphanNodes = nodes.filter((n) => n.id ? orphanIds.has(n.id) : true);
  if (orphanNodes.length > 0) {
    const hasPositions = orphanNodes.some((n) => n.position);
    if (hasPositions) {
      const clusters = clusterByProximity(orphanNodes);
      for (const cluster of clusters) {
        const avgY = cluster.reduce((s, n) => s + (n.position?.y ?? 0), 0) / cluster.length;
        groups.push({ nodes: cluster, avgY });
      }
    } else {
      // No positions — render in original order as one group
      groups.push({ nodes: orphanNodes, avgY: Infinity });
    }
  }

  // Sort all groups top-to-bottom and render
  groups.sort((a, b) => a.avgY - b.avgY);
  for (const group of groups) {
    for (const node of group.nodes) {
      markdown += renderNode(node);
    }
  }

  markdown += MCP_FOOTER;
  return markdown;
}

export async function getBoardMarkdown(
  slug: string,
  shareToken?: string
): Promise<{ markdown: string; status: number }> {
  try {
    const result = await convex.query(api.boards.getBoardForMarkdown, {
      slug,
      shareToken,
    });

    if (!result) {
      return {
        markdown: "# Board Not Found\n\nThis board is private or does not exist.",
        status: 404,
      };
    }

    const { board, nodes: allNodes, edges: rawEdges } = result;
    const nodes = allNodes.filter((n: { archived?: boolean }) => !n.archived);

    // Enrich link nodes with RSS feed items before rendering
    const linkNodes = nodes.filter((n) => n.type === "link");
    if (linkNodes.length > 0) {
      const rssResults = await Promise.all(
        linkNodes.map((node) =>
          looksLikeRssFeed(node.content)
            ? fetchRssItems(node.content)
            : Promise.resolve([] as RssItem[])
        )
      );
      for (let i = 0; i < linkNodes.length; i++) {
        const rssItems = rssResults[i];
        if (rssItems.length > 0) {
          // Append RSS items as sub-content so renderNode picks them up
          const rssText = rssItems.map((item) => `  - [${item.title}](${item.link})`).join("\n");
          (linkNodes[i] as { _rssAppend?: string })._rssAppend = rssText;
        }
      }
    }

    // Map to MarkdownNode with IDs and positions
    const markdownNodes: MarkdownNode[] = nodes.map((n) => ({
      id: n._id,
      type: n.type,
      content: n.content,
      title: n.title,
      position: n.position,
      metadata: n.metadata,
      _rssAppend: (n as { _rssAppend?: string })._rssAppend,
    }));

    const edges: MarkdownEdge[] = (rawEdges || []).map((e) => ({
      source: e.source as string,
      target: e.target as string,
    }));

    const markdown = formatBoardDataAsMarkdown(board, markdownNodes, edges);

    return { markdown, status: 200 };
  } catch {
    return {
      markdown: "# Error\n\nFailed to load board.",
      status: 500,
    };
  }
}

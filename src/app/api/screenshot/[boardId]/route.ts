import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";

export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const secret = request.headers.get("x-screenshot-secret");
  if (!secret || secret !== process.env.SCREENSHOT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const convex = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL as string
  );

  try {
    const data = await convex.query(api.screenshots.getBoardForScreenshot, {
      boardId: boardId as Id<"boards">,
      secret,
    });

    if (!data) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const { board, nodes } = data;

    // Build static HTML of the board
    const html = buildBoardHtml(board, nodes);

    // Launch Puppeteer
    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 630 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const screenshotUint8 = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });
    const screenshotBuffer = Buffer.from(screenshotUint8);

    await browser.close();

    // Upload to Convex file storage
    const uploadUrl = await convex.mutation(
      api.screenshots.generateUploadUrl,
      { secret }
    );

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: screenshotBuffer,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status}`);
    }

    const { storageId } = (await uploadRes.json()) as {
      storageId: Id<"_storage">;
    };

    // Save thumbnail on board
    await convex.mutation(api.screenshots.storeThumbnail, {
      boardId: boardId as Id<"boards">,
      storageId,
      secret,
    });

    return NextResponse.json({ success: true, storageId });
  } catch (err) {
    console.error("Screenshot generation failed:", err);
    return NextResponse.json(
      { error: "Screenshot generation failed" },
      { status: 500 }
    );
  }
}

interface BoardData {
  name: string;
  icon: string;
  settings?: {
    backgroundColor?: string;
    backgroundPattern?: string;
  } | null;
}

interface NodeData {
  type: "text" | "link" | "checklist";
  content: string;
  title?: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  metadata?: {
    title?: string;
    favicon?: string;
    description?: string;
    image?: string;
  } | null;
  collapsed?: boolean;
}

function findBestViewport(
  nodes: NodeData[],
  viewW: number,
  viewH: number
): { cx: number; cy: number } {
  if (nodes.length === 0) return { cx: 600, cy: 315 };

  // Use a density-based approach: find the center that captures the most nodes
  // Weight by recency (index in array, which is by creation time)
  const centers = nodes.map((n) => ({
    x: n.position.x + n.dimensions.width / 2,
    y: n.position.y + (n.collapsed ? 20 : n.dimensions.height / 2),
  }));

  let bestCx = 0,
    bestCy = 0,
    bestScore = -1;

  // Test each node center as a potential viewport center
  for (const candidate of centers) {
    let score = 0;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const nx = n.position.x;
      const ny = n.position.y;
      const nw = n.dimensions.width;
      const nh = n.collapsed ? 40 : n.dimensions.height;

      // Check overlap with viewport
      const overlapX = Math.max(
        0,
        Math.min(nx + nw, candidate.x + viewW / 2) -
          Math.max(nx, candidate.x - viewW / 2)
      );
      const overlapY = Math.max(
        0,
        Math.min(ny + nh, candidate.y + viewH / 2) -
          Math.max(ny, candidate.y - viewH / 2)
      );

      if (overlapX > 0 && overlapY > 0) {
        const coverage = (overlapX * overlapY) / (nw * nh);
        score += coverage;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCx = candidate.x;
      bestCy = candidate.y;
    }
  }

  return { cx: bestCx, cy: bestCy };
}

function buildBoardHtml(board: BoardData, nodes: NodeData[]): string {
  const bgColor = board.settings?.backgroundColor || "#f9fafb";
  const pattern = board.settings?.backgroundPattern || "dots";

  // Calculate bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + node.dimensions.width);
    maxY = Math.max(maxY, node.position.y + (node.collapsed ? 40 : node.dimensions.height));
  }

  if (nodes.length === 0) {
    minX = 0;
    minY = 0;
    maxX = 1200;
    maxY = 630;
  }

  // Determine scale: fit all content if it's not too spread out,
  // otherwise use a minimum scale that keeps text readable
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const padding = 40;
  const fitScale = Math.min(
    (1200 - padding * 2) / contentW,
    (630 - padding * 2) / contentH
  );

  // Minimum scale: cards should be at least ~200px wide (readable text)
  // Original card width is 280, so min scale is ~0.7
  const MIN_SCALE = 0.65;
  const scale = Math.min(Math.max(fitScale, MIN_SCALE), 1.2);

  // If scale > fitScale, we need to crop — find the best viewport
  let viewX: number, viewY: number;
  if (scale > fitScale * 1.05) {
    // Content doesn't fit at this scale — find best crop
    const { cx, cy } = findBestViewport(nodes, 1200 / scale, 630 / scale);
    viewX = cx - 1200 / scale / 2;
    viewY = cy - 630 / scale / 2;
  } else {
    // Everything fits — center it
    viewX = minX - (1200 / scale - contentW) / 2;
    viewY = minY - (630 / scale - contentH) / 2;
  }

  let patternCss = "";
  if (pattern === "dots") {
    patternCss = `background-image: radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px); background-size: 24px 24px;`;
  } else if (pattern === "paper") {
    patternCss = `background-image: linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 24px 24px;`;
  } else if (pattern === "boxes") {
    patternCss = `background-image: linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 24px 24px;`;
  }

  const nodeHtml = nodes
    .map((node) => {
      const x = (node.position.x - viewX) * scale;
      const y = (node.position.y - viewY) * scale;
      const w = node.dimensions.width * scale;
      const h = node.collapsed ? 40 * scale : node.dimensions.height * scale;

      // Skip nodes entirely outside viewport (with some margin)
      if (x + w < -50 || x > 1250 || y + h < -50 || y > 680) return "";

      let content = "";
      const fs = {
        title: Math.round(12 * scale),
        body: Math.round(11 * scale),
        small: Math.round(10 * scale),
        icon: Math.round(14 * scale),
        pad: Math.round(10 * scale),
        padSm: Math.round(6 * scale),
        gap: Math.round(5 * scale),
        check: Math.round(12 * scale),
      };

      if (node.type === "link") {
        const title =
          node.metadata?.title ||
          node.content
            .replace(/^https?:\/\/(www\.)?/, "")
            .replace(/\/$/, "");
        const favicon = node.metadata?.favicon;
        const faviconHtml = favicon
          ? `<img src="${escapeHtml(favicon)}" width="${fs.icon}" height="${fs.icon}" style="border-radius:3px;flex-shrink:0;" onerror="this.style.display='none'" />`
          : `<div style="width:${fs.icon}px;height:${fs.icon}px;background:#3b82f6;border-radius:3px;flex-shrink:0;"></div>`;
        content = `
          <div style="display:flex;align-items:center;gap:${fs.gap}px;padding:${fs.pad}px;">
            ${faviconHtml}
            <span style="font-size:${fs.body}px;color:#1e40af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;">${escapeHtml(title)}</span>
          </div>
        `;
        if (node.metadata?.description && !node.collapsed) {
          content += `<div style="padding:0 ${fs.pad}px ${fs.pad}px;font-size:${fs.small}px;color:#6b7280;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.4;">${escapeHtml(node.metadata.description)}</div>`;
        }
      } else if (node.type === "text") {
        const text = node.content.replace(/<[^>]*>/g, "").slice(0, 150);
        if (node.title) {
          content += `<div style="padding:${fs.pad}px ${fs.pad}px ${fs.padSm}px;font-size:${fs.title}px;font-weight:600;color:#1f2937;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(node.title)}</div>`;
        }
        content += `<div style="padding:${node.title ? 0 : fs.pad}px ${fs.pad}px ${fs.pad}px;font-size:${fs.body}px;color:#6b7280;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${node.collapsed ? 1 : 3};-webkit-box-orient:vertical;line-height:1.4;">${escapeHtml(text)}</div>`;
      } else if (node.type === "checklist") {
        try {
          const items = JSON.parse(node.content);
          if (Array.isArray(items)) {
            const maxItems = node.collapsed ? 1 : 4;
            const displayItems = items.slice(0, maxItems);
            const remaining = items.length - displayItems.length;
            if (node.title) {
              const checked = items.filter((i: { checked: boolean }) => i.checked).length;
              content += `<div style="display:flex;align-items:center;justify-content:space-between;padding:${fs.pad}px ${fs.pad}px ${fs.padSm}px;">
                <span style="font-size:${fs.title}px;font-weight:600;color:#1f2937;">${escapeHtml(node.title)}</span>
                <span style="font-size:${fs.small}px;color:#9ca3af;">${checked}/${items.length}</span>
              </div>`;
            }
            content += displayItems
              .map(
                (item: { text: string; checked: boolean }) =>
                  `<div style="display:flex;align-items:center;gap:${fs.gap}px;padding:${Math.round(2 * scale)}px ${fs.pad}px;font-size:${fs.small}px;color:${item.checked ? "#9ca3af" : "#374151"};${item.checked ? "text-decoration:line-through;" : ""}line-height:1.3;">
                    <div style="width:${fs.check}px;height:${fs.check}px;border:1.5px solid ${item.checked ? "#22c55e" : "#d1d5db"};border-radius:3px;background:${item.checked ? "#22c55e" : "white"};flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                      ${item.checked ? `<span style="color:white;font-size:${Math.round(8 * scale)}px;line-height:1;">&#10003;</span>` : ""}
                    </div>
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(item.text)}</span>
                  </div>`
              )
              .join("");
            if (remaining > 0) {
              content += `<div style="padding:${Math.round(2 * scale)}px ${fs.pad}px;font-size:${fs.small}px;color:#9ca3af;">+${remaining} more</div>`;
            }
          }
        } catch {
          content = `<div style="padding:${fs.pad}px;font-size:${fs.body}px;color:#6b7280;">Checklist</div>`;
        }
      }

      // Type-specific left border accent
      const borderColor =
        node.type === "link"
          ? "#3b82f6"
          : node.type === "checklist"
            ? "#22c55e"
            : "#f59e0b";

      return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:white;border:1px solid #e5e7eb;border-left:3px solid ${borderColor};border-radius:${Math.round(8 * scale)}px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04);">${content}</div>`;
    })
    .filter(Boolean)
    .join("\n");

  // Add a subtle vignette/fade at edges when cropping
  const edgeFade = `
    <div style="position:absolute;inset:0;pointer-events:none;
      box-shadow:inset 0 0 60px 20px ${bgColor};
    "></div>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { width: 1200px; height: 630px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style></head>
<body>
  <div style="width:1200px;height:630px;background:${bgColor};${patternCss}position:relative;overflow:hidden;">
    ${nodeHtml}
    ${edgeFade}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

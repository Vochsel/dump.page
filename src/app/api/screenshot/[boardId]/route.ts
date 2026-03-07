import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

const CHROMIUM_PACK_URL =
  "https://github.com/nichochar/chromium-bun-layer/releases/download/v133.0.0/chromium-v133.0.0-pack.tar";

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

function buildBoardHtml(board: BoardData, nodes: NodeData[]): string {
  const bgColor = board.settings?.backgroundColor || "#f9fafb";
  const pattern = board.settings?.backgroundPattern || "dots";

  // Calculate bounding box of all nodes to determine viewport
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + node.dimensions.width);
    maxY = Math.max(maxY, node.position.y + node.dimensions.height);
  }

  if (nodes.length === 0) {
    minX = 0;
    minY = 0;
    maxX = 1200;
    maxY = 630;
  }

  // Add padding and calculate scale to fit 1200x630
  const padding = 60;
  const contentW = maxX - minX + padding * 2;
  const contentH = maxY - minY + padding * 2;
  const scale = Math.min(1200 / contentW, 630 / contentH, 1.2);
  const offsetX =
    (1200 - contentW * scale) / 2 - minX * scale + padding * scale;
  const offsetY =
    (630 - contentH * scale) / 2 - minY * scale + padding * scale;

  let patternCss = "";
  if (pattern === "dots") {
    patternCss = `background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px); background-size: 24px 24px;`;
  } else if (pattern === "paper") {
    patternCss = `background-image: linear-gradient(#e5e7eb 1px, transparent 1px); background-size: 24px 24px;`;
  } else if (pattern === "boxes") {
    patternCss = `background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px); background-size: 24px 24px;`;
  }

  const nodeHtml = nodes
    .map((node) => {
      const x = node.position.x * scale + offsetX;
      const y = node.position.y * scale + offsetY;
      const w = node.dimensions.width * scale;
      const h = node.collapsed
        ? 40 * scale
        : node.dimensions.height * scale;

      let content = "";

      if (node.type === "link") {
        const title =
          node.metadata?.title ||
          node.content
            .replace(/^https?:\/\/(www\.)?/, "")
            .replace(/\/$/, "");
        const favicon = node.metadata?.favicon;
        const faviconHtml = favicon
          ? `<img src="${escapeHtml(favicon)}" width="${14 * scale}" height="${14 * scale}" style="border-radius:2px;flex-shrink:0;" onerror="this.style.display='none'" />`
          : `<div style="width:${14 * scale}px;height:${14 * scale}px;background:#3b82f6;border-radius:2px;flex-shrink:0;"></div>`;
        content = `
          <div style="display:flex;align-items:center;gap:${6 * scale}px;padding:${8 * scale}px ${10 * scale}px;">
            ${faviconHtml}
            <span style="font-size:${12 * scale}px;color:#1e40af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(title)}</span>
          </div>
        `;
        if (node.metadata?.description && !node.collapsed) {
          content += `<div style="padding:0 ${10 * scale}px ${8 * scale}px;font-size:${10 * scale}px;color:#6b7280;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${escapeHtml(node.metadata.description)}</div>`;
        }
      } else if (node.type === "text") {
        const text = node.content.replace(/<[^>]*>/g, "").slice(0, 120);
        if (node.title) {
          content += `<div style="padding:${8 * scale}px ${10 * scale}px ${2 * scale}px;font-size:${11 * scale}px;font-weight:600;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(node.title)}</div>`;
        }
        content += `<div style="padding:${node.title ? 2 * scale : 8 * scale}px ${10 * scale}px ${8 * scale}px;font-size:${11 * scale}px;color:#6b7280;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${node.collapsed ? 1 : 4};-webkit-box-orient:vertical;">${escapeHtml(text)}</div>`;
      } else if (node.type === "checklist") {
        try {
          const items = JSON.parse(node.content);
          if (Array.isArray(items)) {
            const displayItems = items.slice(0, node.collapsed ? 1 : 4);
            if (node.title) {
              content += `<div style="padding:${8 * scale}px ${10 * scale}px ${2 * scale}px;font-size:${11 * scale}px;font-weight:600;color:#374151;">${escapeHtml(node.title)}</div>`;
            }
            content += displayItems
              .map(
                (item: { text: string; checked: boolean }) =>
                  `<div style="display:flex;align-items:center;gap:${4 * scale}px;padding:${2 * scale}px ${10 * scale}px;font-size:${10 * scale}px;color:${item.checked ? "#9ca3af" : "#374151"};${item.checked ? "text-decoration:line-through;" : ""}">
                    <div style="width:${10 * scale}px;height:${10 * scale}px;border:1.5px solid ${item.checked ? "#22c55e" : "#d1d5db"};border-radius:2px;background:${item.checked ? "#22c55e" : "transparent"};flex-shrink:0;"></div>
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(item.text)}</span>
                  </div>`
              )
              .join("");
          }
        } catch {
          content = `<div style="padding:${8 * scale}px;font-size:${11 * scale}px;color:#6b7280;">Checklist</div>`;
        }
      }

      return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:white;border:1px solid #e5e7eb;border-radius:${8 * scale}px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">${content}</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { width: 1200px; height: 630px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style></head>
<body>
  <div style="width:1200px;height:630px;background:${bgColor};${patternCss}position:relative;overflow:hidden;">
    ${nodeHtml}
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

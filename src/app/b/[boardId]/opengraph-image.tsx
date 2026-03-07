import { ImageResponse } from "next/og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Board preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BoardOgImage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;

  const convex = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL as string
  );

  const boardData = await convex.query(api.boards.getBoardForMarkdown, {
    slug: boardId,
  });

  if (!boardData) {
    return generateFallbackImage();
  }

  const { board, nodes } = boardData;
  const itemCount = nodes.filter((n: { archived?: boolean }) => !n.archived).length;

  let thumbnailUrl: string | null = null;
  try {
    thumbnailUrl = await convex.query(api.screenshots.getThumbnailUrl, {
      boardId: board._id as Id<"boards">,
    });
  } catch {
    // No thumbnail available
  }

  const dynaPuffFont = await fetch(
    "https://fonts.gstatic.com/s/dynapuff/v4/z7N5dRvsZDIVHbYPMhZJ3HQ83UaSu4uhr7-ZFeoYkgAr1x8RSxYu6YjrSRs4wn8.ttf"
  ).then((res) => res.arrayBuffer());

  const icon = board.icon && !board.icon.startsWith("lucide:") ? board.icon : null;

  const logoData = await readFile(join(process.cwd(), "public", "dump.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  if (thumbnailUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, objectFit: "cover" }}
          />
          {/* Branding top-left */}
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 32,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "12px",
              padding: "8px 16px 8px 10px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoBase64} alt="" width={28} height={28} />
            <span style={{ fontSize: 18, fontWeight: 700, color: "white", fontFamily: "DynaPuff" }}>
              dump.page
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "200px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
              display: "flex",
              alignItems: "flex-end",
              padding: "32px 40px",
              gap: "16px",
            }}
          >
            {icon && <span style={{ fontSize: 48 }}>{icon}</span>}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "white",
                  fontFamily: "DynaPuff",
                }}
              >
                {board.name}
              </span>
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "DynaPuff",
            data: dynaPuffFont,
            style: "normal" as const,
            weight: 700 as const,
          },
        ],
      }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f8fafc 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: 0.15,
          }}
        />
        {/* Branding top-left */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 32,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} alt="" width={32} height={32} />
          <span style={{ fontSize: 20, fontWeight: 700, color: "#9ca3af", fontFamily: "DynaPuff" }}>
            dump.page
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {icon && <span style={{ fontSize: 120 }}>{icon}</span>}
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#1f2937",
              fontFamily: "DynaPuff",
              maxWidth: 900,
              textAlign: "center",
            }}
          >
            {board.name}
          </span>
          <span style={{ fontSize: 32, color: "#6b7280" }}>
            {itemCount} {itemCount === 1 ? "item" : "items"} on Dump
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "DynaPuff",
          data: dynaPuffFont,
          style: "normal" as const,
          weight: 700 as const,
        },
      ],
    }
  );
}

async function generateFallbackImage() {
  const logoData = await readFile(join(process.cwd(), "public", "dump.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  const dynaPuffFont = await fetch(
    "https://fonts.gstatic.com/s/dynapuff/v4/z7N5dRvsZDIVHbYPMhZJ3HQ83UaSu4uhr7-ZFeoYkgAr1x8RSxYu6YjrSRs4wn8.ttf"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f8fafc 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} alt="" width={80} height={80} />
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#1f2937",
              fontFamily: "DynaPuff",
            }}
          >
            Dump
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "DynaPuff",
          data: dynaPuffFont,
          style: "normal" as const,
          weight: 700 as const,
        },
      ],
    }
  );
}

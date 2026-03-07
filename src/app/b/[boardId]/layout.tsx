import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}): Promise<Metadata> {
  const { boardId } = await params;

  try {
    const boardData = await convex.query(api.boards.getBoardForMarkdown, {
      slug: boardId,
    });

    if (!boardData) return { title: "Dump" };

    const { board, nodes } = boardData;
    const itemCount = nodes.filter((n: { archived?: boolean }) => !n.archived).length;
    const icon = board.icon && !board.icon.startsWith("lucide:") ? `${board.icon} ` : "";
    const title = `${icon}${board.name} — Dump`;
    const description = `${itemCount} ${itemCount === 1 ? "item" : "items"} on Dump`;

    let thumbnailUrl: string | null = null;
    try {
      thumbnailUrl = await convex.query(api.screenshots.getThumbnailUrl, {
        boardId: board._id as Id<"boards">,
      });
    } catch {
      // No thumbnail
    }

    const metadata: Metadata = {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
      twitter: {
        card: thumbnailUrl ? "summary_large_image" : "summary",
        title,
        description,
      },
    };

    if (thumbnailUrl) {
      metadata.openGraph!.images = [{ url: thumbnailUrl, width: 1200, height: 630 }];
      metadata.twitter!.images = [thumbnailUrl];
    }

    return metadata;
  } catch {
    return { title: "Dump" };
  }
}

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

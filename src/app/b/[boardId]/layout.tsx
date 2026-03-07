import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

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

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
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

"use client";

import { useAuth } from "@/context/auth-context";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CreateBoardDialog } from "@/components/board/CreateBoardDialog";
import { UserMenu } from "@/components/auth/UserMenu";
import { BoardIcon } from "@/components/board/BoardIcon";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Globe, Link as LinkIcon, FileText, ExternalLink, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteBoardButton } from "@/components/board/DeleteBoardButton";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const boards = useQuery(api.boards.getMyBoardsWithRecentNodes);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-muted-foreground font-[family-name:var(--font-poppins)]">
          Loading...
        </div>
      </div>
    );
  }

  const firstName = user.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/dump.png"
              alt="Dump"
              className="h-9"
            />
            <span className="font-[family-name:var(--font-dynapuff)] text-lg text-gray-800">
              Dump
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CreateBoardDialog />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold text-stone-900">
            Hey {firstName} 👋
          </h1>
          <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400 mt-1">
            Your boards and recent activity
          </p>
        </div>

        {/* Board grid */}
        {boards === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-stone-200 p-5 h-52 animate-pulse"
              >
                <div className="h-5 w-24 bg-stone-100 rounded mb-3" />
                <div className="h-3 w-32 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 mb-4">
              <Plus className="h-7 w-7 text-stone-400" />
            </div>
            <p className="font-[family-name:var(--font-poppins)] text-lg font-medium text-stone-600 mb-1">
              No boards yet
            </p>
            <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400 mb-6">
              Create your first board to start collecting links and notes
            </p>
            <CreateBoardDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boards.map(
              (board) =>
                board && (
                  <Link
                    key={board._id}
                    href={`/b/${board._id}`}
                    className="group bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Board header */}
                    <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0">
                          <BoardIcon icon={board.icon} className="text-xl" size={22} />
                        </span>
                        <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 text-[15px] truncate">
                          {board.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Badge
                          variant={
                            board.visibility === "public"
                              ? "default"
                              : board.visibility === "shared"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-[10px] capitalize px-1.5 py-0"
                        >
                          {board.visibility}
                        </Badge>
                      </div>
                    </div>

                    {/* Recent nodes preview */}
                    <div className="px-5 pb-4 flex-1">
                      {board.recentNodes && board.recentNodes.length > 0 ? (
                        <ul className="space-y-1.5">
                          {board.recentNodes.map((node) => (
                            <li
                              key={node._id}
                              className="flex items-center gap-2 text-xs text-stone-500 min-w-0"
                            >
                              {node.type === "link" ? (
                                <LinkIcon className="h-3 w-3 text-blue-400 flex-shrink-0" />
                              ) : node.type === "checklist" ? (
                                <CheckSquare className="h-3 w-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <FileText className="h-3 w-3 text-amber-400 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {node.type === "link"
                                  ? node.metadata?.title ||
                                    node.content.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
                                  : node.type === "checklist"
                                    ? (() => {
                                        try {
                                          const items = JSON.parse(node.content);
                                          if (Array.isArray(items)) {
                                            const checked = items.filter((i: { checked: boolean }) => i.checked).length;
                                            const total = items.length;
                                            const label = items.find((i: { text: string }) => i.text)?.text || "Checklist";
                                            return `${label} (${checked}/${total})`;
                                          }
                                        } catch { /* ignore */ }
                                        return "Checklist";
                                      })()
                                    : node.content.replace(/<[^>]*>/g, "").slice(0, 60)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-stone-300 italic">No items yet</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {board.memberCount} {board.memberCount === 1 ? "member" : "members"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Open <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                        {board.role === "owner" && (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteBoardButton
                              boardId={board._id as Id<"boards">}
                              boardName={board.name}
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
            )}
          </div>
        )}
      </main>
    </div>
  );
}

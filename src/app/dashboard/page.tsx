"use client";

import { useAuth } from "@/context/auth-context";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { CreateBoardDialog } from "@/components/board/CreateBoardDialog";
import { UserMenu } from "@/components/auth/UserMenu";
import { BoardIcon } from "@/components/board/BoardIcon";
import Link from "next/link";
import { Users, Plus, Link as LinkIcon, FileText, ExternalLink, CheckSquare, Sun, Moon, Monitor, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteBoardButton } from "@/components/board/DeleteBoardButton";
import { Id } from "../../../convex/_generated/dataModel";
import { SuggestFeatureButton } from "@/components/SuggestFeatureButton";
import { Footer } from "@/components/Footer";
import { useTheme } from "@/context/theme-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BoardGrid({ boards }: { boards: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {boards.map(
        (board) =>
          board && (
            <Link
              key={board._id}
              href={`/b/${board.slug ?? board._id}`}
              className="group bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-800 hover:border-stone-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
            >
              {board.thumbnailUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={board.thumbnailUrl}
                    alt={`${board.name} preview`}
                    className="w-full h-40 object-cover"
                  />
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <BoardIcon icon={board.icon} className="text-base flex-shrink-0" size={18} />
                      <span className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">
                        {board.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {board.memberCount}
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
                </>
              ) : (
                <>
                  {board.settings?.backgroundColor && board.settings.backgroundColor !== "#f9fafb" && (
                    <div className="h-2 w-full" style={{ backgroundColor: board.settings.backgroundColor }} />
                  )}
                  <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl flex-shrink-0">
                        <BoardIcon icon={board.icon} className="text-xl" size={22} />
                      </span>
                      <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 dark:text-stone-100 text-[15px] truncate">
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
                  <div className="px-5 pb-4 flex-1">
                    {board.recentNodes && board.recentNodes.length > 0 ? (
                      <ul className="space-y-1.5">
                        {board.recentNodes.map((node: { _id: string; type: string; content: string; metadata?: { title?: string }; title?: string }) => (
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
                                          const label = node.title || items.find((i: { text: string }) => i.text)?.text || "Checklist";
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
                  <div className="px-5 py-3 border-t border-stone-100 dark:border-gray-800 flex items-center justify-between">
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
                </>
              )}
            </Link>
          )
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const boards = useQuery(api.boards.getMyBoardsWithRecentNodes);
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-gray-950">
        <div className="animate-pulse text-muted-foreground font-[family-name:var(--font-poppins)]">
          Loading...
        </div>
      </div>
    );
  }

  const firstName = user.displayName?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/dump.png"
              alt="Dump"
              className="h-9"
            />
            <span className="font-[family-name:var(--font-dynapuff)] text-lg text-gray-800 dark:text-gray-100">
              Dump
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/changelog" className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              Changelog
            </Link>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="end">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-2 mb-1.5">Theme</p>
                {([
                  { value: "system" as const, label: "System", icon: Monitor },
                  { value: "light" as const, label: "Light", icon: Sun },
                  { value: "dark" as const, label: "Dark", icon: Moon },
                ]).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setThemeMode(option.value)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                      themeMode === option.value
                        ? "bg-accent font-medium"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
                <div className="my-1.5 border-t border-border" />
                <SuggestFeatureButton />
              </PopoverContent>
            </Popover>
            <CreateBoardDialog />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Hey {firstName} 👋
          </h1>
          <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400 dark:text-stone-500 mt-1">
            Your boards and recent activity
          </p>
        </div>

        {/* Board grid */}
        {boards === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-800 p-5 h-52 animate-pulse"
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
            <p className="font-[family-name:var(--font-poppins)] text-lg font-medium text-stone-600 dark:text-stone-300 mb-1">
              No boards yet
            </p>
            <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400 mb-6">
              Create your first board to start collecting links and notes
            </p>
            <CreateBoardDialog />
          </div>
        ) : (
          <>
            <BoardGrid boards={boards.filter((b) => b && b.role === "owner")} />
            {boards.some((b) => b && b.role !== "owner") && (
              <div className="mt-10">
                <h2 className="font-[family-name:var(--font-poppins)] text-sm font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-4">
                  Shared with me
                </h2>
                <BoardGrid boards={boards.filter((b) => b && b.role !== "owner")} />
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

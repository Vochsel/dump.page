"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Archive, Bot, Boxes, ExternalLink, FileText, HelpCircle, LayoutGrid, Lightbulb, List, Monitor, Moon, Plus, Rocket, Settings, Sun, Zap } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CreateBoardDialog } from "@/components/board/CreateBoardDialog";
import { BoardCard, BoardRow, type DashboardBoard } from "@/components/board/BoardCard";
import { UserMenu } from "@/components/auth/UserMenu";
import { SuggestFeatureButton } from "@/components/SuggestFeatureButton";
import { Footer } from "@/components/Footer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type DashboardViewMode = "grid" | "list";
type DashboardContextFilter = "all" | "default" | "skill" | "agent";

const CONTEXT_FILTERS: { value: DashboardContextFilter; label: string; icon: typeof Rocket }[] = [
  { value: "all", label: "All", icon: Boxes },
  { value: "default", label: "Projects", icon: Rocket },
  { value: "skill", label: "Skills", icon: Lightbulb },
  { value: "agent", label: "Agents", icon: Bot },
];

function BoardSection({
  title,
  boards,
  mode = "dashboard",
  viewMode,
}: {
  title: string;
  boards: DashboardBoard[];
  mode?: "dashboard" | "archived";
  viewMode: DashboardViewMode;
}) {
  if (boards.length === 0) return null;

  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-[family-name:var(--font-poppins)] text-sm font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-4">
        {title}
      </h2>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((board) => (
            <BoardCard key={board._id} board={board} mode={mode} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {boards.map((board) => (
            <BoardRow key={board._id} board={board} mode={mode} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const boards = useQuery(api.boards.getMyBoardsWithRecentNodes);
  const hasMcp = useQuery(api.mcpAuth.hasActiveMcpToken);
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [viewMode, setViewMode] = useLocalStorage<DashboardViewMode>(
    "dump-dashboard-view-mode",
    "grid"
  );
  const [contextFilter, setContextFilter] = useLocalStorage<DashboardContextFilter>(
    "dump-dashboard-context-filter",
    "default"
  );
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

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
  const sortedBoards =
    boards?.slice().sort((a, b) => b.updatedAt - a.updatedAt) ?? [];
  const filteredBoards =
    contextFilter === "all"
      ? sortedBoards
      : sortedBoards.filter(
          (board) => (board.settings?.contextType ?? "default") === contextFilter
        );
  const starredBoards = filteredBoards.filter((board) => board.starred);
  const ownedBoards = filteredBoards.filter(
    (board) => board.role === "owner" && !board.starred
  );
  const sharedBoards = filteredBoards.filter(
    (board) => board.role !== "owner" && !board.starred
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950">
      <header className="border-b border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <Button variant="outline" size="sm" asChild>
              <Link href="/help">
                <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                Help
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/changelog">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Changelog
              </Link>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="end">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-2 mb-1.5">
                  Theme
                </p>
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
                <Link
                  href="/archive"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent/50"
                >
                  <Archive className="h-3.5 w-3.5" />
                  View Archive
                </Link>
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
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Hey {firstName} 👋
            </h1>
            <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400 dark:text-stone-500 mt-1">
              Your boards and recent activity
            </p>
          </div>
          {boards && boards.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-0.5">
                {CONTEXT_FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setContextFilter(option.value)}
                    aria-pressed={contextFilter === option.value}
                    title={option.label}
                    className={`flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium transition-colors ${
                      contextFilter === option.value
                        ? "bg-accent text-stone-700 dark:text-stone-200"
                        : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    }`}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center rounded-md border border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  aria-label="Grid view"
                  title="Grid view"
                  className={`flex items-center justify-center h-7 w-7 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-accent text-stone-700 dark:text-stone-200"
                      : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  aria-label="List view"
                  title="List view"
                  className={`flex items-center justify-center h-7 w-7 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-accent text-stone-700 dark:text-stone-200"
                      : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {hasMcp === false ? (
          <Link
            href="/mcp"
            className="mb-8 flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
          >
            <Zap className="h-4 w-4 flex-shrink-0" />
            <span>Connect your AI assistant via MCP for the best experience</span>
            <ExternalLink className="h-3.5 w-3.5 ml-auto flex-shrink-0 opacity-60" />
          </Link>
        ) : null}

        {boards === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
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
              No active boards
            </p>
            <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400 mb-6">
              Create a board or restore one from Archive
            </p>
            <CreateBoardDialog />
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-[family-name:var(--font-poppins)] text-lg font-medium text-stone-600 dark:text-stone-300 mb-1">
              No {CONTEXT_FILTERS.find((f) => f.value === contextFilter)?.label.toLowerCase()} yet
            </p>
            <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400 mb-6">
              Create a new board from the {CONTEXT_FILTERS.find((f) => f.value === contextFilter)?.label} template
            </p>
            <CreateBoardDialog />
          </div>
        ) : (
          <>
            <BoardSection title="Starred" boards={starredBoards} viewMode={viewMode} />
            <BoardSection title="My Boards" boards={ownedBoards} viewMode={viewMode} />
            <BoardSection title="Shared With Me" boards={sharedBoards} viewMode={viewMode} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

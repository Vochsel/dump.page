"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Search, FileText, Link as LinkIcon, CheckSquare, ArrowRight } from "lucide-react";
import { BoardIcon } from "@/components/board/BoardIcon";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Search results (only when query is non-empty)
  const searchResults = useQuery(
    api.boards.globalSearch,
    query.trim().length >= 2 ? { query: query.trim() } : "skip"
  );

  // Recent boards (shown when query is empty)
  const recentBoards = useQuery(api.boards.getMyBoards);

  // Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build items list
  const items: Array<{
    type: "board" | "item";
    id: string;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    href: string;
  }> = [];

  if (query.trim().length >= 2 && searchResults) {
    for (const b of searchResults.boards) {
      items.push({
        type: "board",
        id: b._id,
        label: b.name,
        sublabel: "Board",
        icon: <BoardIcon icon={b.icon} size={16} />,
        href: `/b/${b.slug}`,
      });
    }
    for (const item of searchResults.items) {
      const label = item.title || item.metadata?.title ||
        (item.type === "link" ? item.content : item.content.replace(/<[^>]*>/g, "").slice(0, 60));
      const typeIcon = item.type === "link" ? <LinkIcon className="h-4 w-4 text-blue-500" /> :
        item.type === "checklist" ? <CheckSquare className="h-4 w-4 text-green-500" /> :
        <FileText className="h-4 w-4 text-yellow-500" />;
      items.push({
        type: "item",
        id: item._id,
        label,
        sublabel: item.boardName,
        icon: typeIcon,
        href: `/b/${item.boardSlug}?focusNode=${item._id}`,
      });
    }
  } else if (!query.trim() && recentBoards) {
    // Show recent boards sorted by updatedAt
    const sorted = [...recentBoards]
      .filter(Boolean)
      .sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0))
      .slice(0, 8);
    for (const b of sorted) {
      if (!b) continue;
      items.push({
        type: "board",
        id: b._id,
        label: b.name,
        sublabel: "Recent",
        icon: <BoardIcon icon={b.icon} size={16} />,
        href: `/b/${b.slug ?? b._id}`,
      });
    }
  }

  // Reset selection when items change
  useEffect(() => {
    setSelectedIdx(0);
  }, [items.length]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && items[selectedIdx]) {
      e.preventDefault();
      navigate(items[selectedIdx].href);
    }
  }, [items, selectedIdx, navigate]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selectedIdx] as HTMLElement;
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search boards and items..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
          {items.length === 0 && query.trim().length >= 2 && searchResults && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No results found</p>
          )}
          {items.length === 0 && !query.trim() && (
            <p className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wide">Recent boards</p>
          )}
          {!query.trim() && items.length === 0 && recentBoards && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No boards yet</p>
          )}
          {query.trim().length >= 2 && !searchResults && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center animate-pulse">Searching...</p>
          )}
          {!query.trim() && items.length > 0 && (
            <p className="px-4 py-1.5 text-[10px] text-gray-400 uppercase tracking-wide">Recent boards</p>
          )}
          {query.trim().length >= 2 && searchResults && searchResults.boards.length > 0 && (
            <p className="px-4 py-1.5 text-[10px] text-gray-400 uppercase tracking-wide">Boards</p>
          )}
          {items.map((item, idx) => {
            // Show "Items" heading before first item result
            const showItemsHeading = query.trim().length >= 2 && item.type === "item" &&
              (idx === 0 || items[idx - 1].type === "board");
            return (
              <div key={item.id}>
                {showItemsHeading && (
                  <p className="px-4 py-1.5 text-[10px] text-gray-400 uppercase tracking-wide mt-1">Items</p>
                )}
                <button
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    idx === selectedIdx
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>
                  </div>
                  {idx === selectedIdx && (
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
          <span>
            <kbd className="font-mono border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 mr-1">&uarr;&darr;</kbd>
            navigate
            <kbd className="font-mono border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 ml-2 mr-1">&crarr;</kbd>
            open
          </span>
          <span>
            <kbd className="font-mono border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 mr-1">&lcub;K</kbd>
            toggle
          </span>
        </div>
      </div>
    </div>
  );
}

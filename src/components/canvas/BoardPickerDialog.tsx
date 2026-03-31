"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LayoutGrid, Search } from "lucide-react";

interface BoardPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (board: { id: string; name: string; icon: string; slug: string; thumbnailUrl?: string | null }) => void;
  currentBoardId: string;
}

export function BoardPickerDialog({ open, onOpenChange, onSelect, currentBoardId }: BoardPickerDialogProps) {
  const [search, setSearch] = useState("");
  const boards = useQuery(api.boards.getMyBoards);

  const filtered = useMemo(() => {
    if (!boards) return [];
    // Exclude current board
    const available = boards.filter((b) => (b._id as string) !== currentBoardId);
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter((b) => b.name.toLowerCase().includes(q));
  }, [boards, search, currentBoardId]);

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSearch(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Add Board
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boards..."
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto -mx-2">
          {!boards && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading boards...
            </div>
          )}
          {boards && filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {search ? "No boards match your search" : "No other boards available"}
            </div>
          )}
          {filtered.map((board) => (
            <button
              key={board._id}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 rounded-md transition-colors"
              onClick={() => {
                onSelect({
                  id: board._id as string,
                  name: board.name,
                  icon: board.icon,
                  slug: board.slug,
                  thumbnailUrl: board.thumbnailUrl,
                });
                onOpenChange(false);
                setSearch("");
              }}
            >
              <span className="text-xl leading-none flex-shrink-0">{board.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{board.name}</div>
                <div className="text-xs text-muted-foreground">
                  {board.memberCount > 1 ? `${board.memberCount} members` : "Personal"}
                </div>
              </div>
              {board.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={board.thumbnailUrl}
                  alt=""
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

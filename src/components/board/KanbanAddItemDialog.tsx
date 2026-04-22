"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Type, CheckSquare, Link as LinkIcon, FileText, Eye, EyeOff } from "lucide-react";
import { useBoardOps } from "@/context/board-ops-context";
import type { BoardNode } from "@/context/board-ops-context";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function previewTitle(node: BoardNode): string {
  if (node.type === "text") {
    const s = stripHtml(node.content);
    return node.title || s.split("\n")[0].slice(0, 80) || "Empty note";
  }
  if (node.type === "checklist") {
    let items: Array<{ text: string }> = [];
    try { items = JSON.parse(node.content); } catch { /* ignore */ }
    return node.title || (items[0]?.text.slice(0, 60)) || "Empty checklist";
  }
  if (node.type === "link") {
    return node.metadata?.title || node.content;
  }
  if (node.type === "board") {
    return node.title || "Board";
  }
  return "Untitled";
}

function Icon({ type }: { type: BoardNode["type"] }) {
  const cls = "h-3.5 w-3.5 flex-shrink-0";
  if (type === "text") return <FileText className={`${cls} text-amber-500`} />;
  if (type === "checklist") return <CheckSquare className={`${cls} text-blue-500`} />;
  if (type === "link") return <LinkIcon className={`${cls} text-emerald-500`} />;
  return <FileText className={cls} />;
}

interface KanbanAddItemDialogProps {
  open: boolean;
  onClose: () => void;
  nodes: BoardNode[];
  onBoardNodeIds: Set<string>;
  onAddExisting: (nodeIds: string[]) => void;
  onCreateNew: (nodeId: string) => void;
  canEdit: boolean;
}

type NewKind = "text" | "checklist" | "link" | null;

export function KanbanAddItemDialog({
  open,
  onClose,
  nodes,
  onBoardNodeIds,
  onAddExisting,
  onCreateNew,
  canEdit,
}: KanbanAddItemDialogProps) {
  const { createNode, boardId, fetchLinkMetadata } = useBoardOps();
  const [search, setSearch] = useState("");
  const [newKind, setNewKind] = useState<NewKind>(null);
  const [draftText, setDraftText] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...nodes].sort((a, b) => {
      const aOn = onBoardNodeIds.has(a._id) ? 1 : 0;
      const bOn = onBoardNodeIds.has(b._id) ? 1 : 0;
      // Show off-board first (easier to re-add)
      if (aOn !== bOn) return aOn - bOn;
      return 0;
    });
    if (!q) return sorted;
    return sorted.filter((n) => {
      const t = previewTitle(n).toLowerCase();
      const c = n.content.toLowerCase();
      return t.includes(q) || c.includes(q);
    });
  }, [nodes, search, onBoardNodeIds]);

  const reset = () => {
    setSearch("");
    setNewKind(null);
    setDraftText("");
    setCreating(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!canEdit || creating || !newKind) return;
    const text = draftText.trim();
    if (!text && newKind !== "checklist") return;
    setCreating(true);
    try {
      let nodeId: string;
      if (newKind === "text") {
        nodeId = await createNode({
          boardId,
          type: "text",
          content: `<p>${escapeHtml(text)}</p>`,
          position: { x: 0, y: 0 },
        });
      } else if (newKind === "link") {
        nodeId = await createNode({
          boardId,
          type: "link",
          content: text,
          position: { x: 0, y: 0 },
        });
        void fetchLinkMetadata({ nodeId, url: text });
      } else {
        // checklist — if text provided, seed with one item
        const items = text
          ? [{ id: `i-${Date.now()}`, text, checked: false }]
          : [];
        nodeId = await createNode({
          boardId,
          type: "checklist",
          content: JSON.stringify(items),
          position: { x: 0, y: 0 },
        });
      }
      onCreateNew(nodeId);
      reset();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add item</DialogTitle>
        </DialogHeader>

        {newKind === null ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search existing items..."
                className="pl-9"
                autoFocus
              />
            </div>

            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setNewKind("text")}>
                  <Type className="h-3.5 w-3.5" />
                  New note
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setNewKind("checklist")}>
                  <CheckSquare className="h-3.5 w-3.5" />
                  Checklist
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setNewKind("link")}>
                  <LinkIcon className="h-3.5 w-3.5" />
                  Link
                </Button>
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto -mx-2">
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {search ? "No items match" : "No items on this board yet"}
                </div>
              )}
              {filtered.map((node) => {
                const onBoard = onBoardNodeIds.has(node._id);
                return (
                  <button
                    key={node._id}
                    onClick={() => onAddExisting([node._id])}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <Icon type={node.type} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{previewTitle(node)}</div>
                    </div>
                    <span
                      className={`text-[10px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded ${
                        onBoard
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                      }`}
                      title={onBoard ? "Already on kanban — will be moved" : "Not on kanban — will be added"}
                    >
                      {onBoard ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {onBoard ? "on board" : "hidden"}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button onClick={() => setNewKind(null)} className="hover:underline">
                ← Back
              </button>
              <span>·</span>
              <span className="flex items-center gap-1">
                {newKind === "text" && <><Type className="h-3.5 w-3.5" /> New note</>}
                {newKind === "checklist" && <><CheckSquare className="h-3.5 w-3.5" /> New checklist</>}
                {newKind === "link" && <><LinkIcon className="h-3.5 w-3.5" /> New link</>}
              </span>
            </div>
            <Input
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder={
                newKind === "link"
                  ? "https://example.com"
                  : newKind === "checklist"
                  ? "First item (optional)"
                  : "Note text..."
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNewKind(null)} disabled={creating}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                Create & add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

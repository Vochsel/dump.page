"use client";

import { useRef, useCallback, useState } from "react";
import { useBoardOps } from "@/context/board-ops-context";
import type { BoardNode } from "@/context/board-ops-context";
import { ExternalLink, FileText, CheckSquare, Link as LinkIcon, Maximize2 } from "lucide-react";
import { sfx } from "@/lib/sfx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function DraggableItem({
  node,
  canEdit,
  onDragEnd,
  onPreview,
}: {
  node: BoardNode;
  canEdit: boolean;
  onDragEnd: (nodeId: string, pos: { x: number; y: number }) => void;
  onPreview: (nodeId: string) => void;
}) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canEdit) return;
      e.preventDefault();
      const el = elRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: rect.left - parentRect.left,
        origY: rect.top - parentRect.top,
      };
      sfx.dragStart();

      const onMouseMove = (e: MouseEvent) => {
        if (!dragRef.current || !elRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        elRef.current.style.left = `${dragRef.current.origX + dx}px`;
        elRef.current.style.top = `${dragRef.current.origY + dy}px`;
      };

      const onMouseUp = (e: MouseEvent) => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const newX = dragRef.current.origX + dx;
        const newY = dragRef.current.origY + dy;
        dragRef.current = null;
        sfx.dragEnd();
        onDragEnd(node._id, { x: newX, y: newY });
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [canEdit, node._id, onDragEnd]
  );

  const pos = node.docPosition || { x: 0, y: 0 };

  return (
    <div
      ref={elRef}
      className="absolute group"
      style={{
        left: pos.x,
        top: pos.y,
        width: node.type === "link" ? 300 : 600,
        maxWidth: "calc(100vw - 32px)",
      }}
    >


      {node.type === "text" && (
        <div
          className={`py-3 px-4 -mx-4 rounded-xl border border-transparent transition-colors duration-300 ${canEdit ? "group-hover:border-blue-200 dark:group-hover:border-blue-800/50 cursor-grab active:cursor-grabbing" : ""}`}
          onMouseDown={canEdit ? onMouseDown : undefined}
        >
          {node.title && (
            <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-100">{node.title}</h3>
          )}
          {node.content ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: node.content }}
            />
          ) : (
            <p className="text-sm italic text-muted-foreground">Empty note</p>
          )}
        </div>
      )}

      {(node.type === "checklist" || node.type === "link") && (
      <div
        className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${canEdit ? "group-hover:border-blue-200 dark:group-hover:border-blue-800/50 cursor-grab active:cursor-grabbing" : ""}`}
        onMouseDown={canEdit ? onMouseDown : undefined}
      >
        <button
          onClick={() => onPreview(node._id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
          title="Preview"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>

        {node.type === "checklist" && (() => {
          let items: Array<{ id: string; text: string; checked: boolean }> = [];
          try { items = JSON.parse(node.content); } catch { /* skip */ }
          const checked = items.filter((i) => i.checked).length;
          const total = items.length;
          const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
          return (
            <div className="px-5 py-4">
              {node.title && (
                <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-100">{node.title}</h3>
              )}
              <div className="space-y-1 mb-3">
                {items.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="text-sm">{item.checked ? "☑" : "☐"}</span>
                    <span className={`text-sm ${item.checked ? "line-through opacity-50" : ""}`}>{item.text}</span>
                  </div>
                ))}
                {items.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{items.length - 5} more</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{pct}%</span>
              </div>
            </div>
          );
        })()}

        {node.type === "link" && (() => {
          let hostname = "";
          let favicon = node.metadata?.favicon;
          try { hostname = new URL(node.content).hostname.replace(/^www\./, ""); } catch { hostname = node.content; }
          if (!favicon) {
            try { favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`; } catch { /* skip */ }
          }
          return (
            <a
              href={node.content}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {node.metadata?.image && (
                <div className="w-full aspect-video overflow-hidden">
                  <img src={node.metadata.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="px-5 py-3 flex items-start gap-3">
                {favicon && (
                  <img src={favicon} alt="" className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {node.metadata?.title || hostname}
                  </p>
                  {node.metadata?.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{node.metadata.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    {hostname}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </p>
                </div>
              </div>
            </a>
          );
        })()}
      </div>
      )}
    </div>
  );
}

export function DocumentView({ boardName, canEdit = false }: { boardName: string; canEdit?: boolean }) {
  const { nodes: boardNodes, updateNode } = useBoardOps();
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);

  const nodes = (boardNodes ?? []).filter((n) => !n.collapsed);

  // Auto-layout nodes that don't have docPosition — center in column
  const COLUMN_WIDTH = 600;
  const layoutNodes = nodes.map((node, index) => {
    if (node.docPosition) return node;
    return {
      ...node,
      docPosition: { x: 0, y: index * 200 },
    };
  });

  const onDragEnd = useCallback(
    (nodeId: string, pos: { x: number; y: number }) => {
      updateNode({ nodeId, docPosition: pos });
    },
    [updateNode]
  );

  // Calculate container height
  const maxY = layoutNodes.reduce((max, n) => {
    const y = (n.docPosition?.y ?? 0) + 250;
    return Math.max(max, y);
  }, 600);

  const previewNode = previewNodeId ? nodes.find((n) => n._id === previewNodeId) : null;

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        This board is empty.
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full" style={{ minHeight: maxY }}>
        {/* Centered column */}
        <div className="max-w-[640px] mx-auto relative">
          {/* Board title */}
          <div className="pt-10 pb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{boardName}</h1>
          </div>

          {/* Draggable items */}
          {layoutNodes.map((node) => (
            <DraggableItem
              key={node._id}
              node={node}
              canEdit={canEdit}
              onDragEnd={onDragEnd}
              onPreview={setPreviewNodeId}
            />
          ))}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewNodeId !== null} onOpenChange={(open) => { if (!open) setPreviewNodeId(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] flex flex-col">
          {previewNode && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {previewNode.type === "text" && <FileText className="h-4 w-4" />}
                  {previewNode.type === "checklist" && <CheckSquare className="h-4 w-4" />}
                  {previewNode.type === "link" && <LinkIcon className="h-4 w-4" />}
                  {previewNode.title || previewNode.metadata?.title || previewNode.type}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                {previewNode.type === "text" && (
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: previewNode.content || "<p>Empty</p>" }} />
                )}
                {previewNode.type === "checklist" && (() => {
                  let items: Array<{ id: string; text: string; checked: boolean }> = [];
                  try { items = JSON.parse(previewNode.content); } catch { /* skip */ }
                  return (
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-2">
                          <input type="checkbox" checked={item.checked} readOnly className="h-3.5 w-3.5 rounded border-gray-300 mt-0.5" />
                          <span className={`text-sm ${item.checked ? "line-through opacity-50" : ""}`}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {previewNode.type === "link" && (
                  <div className="space-y-2">
                    <a href={previewNode.content} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      {previewNode.content}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {previewNode.metadata?.description && (
                      <p className="text-sm text-muted-foreground">{previewNode.metadata.description}</p>
                    )}
                    {previewNode.metadata?.image && (
                      <img src={previewNode.metadata.image} alt="" className="rounded-lg max-h-48 object-cover" />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

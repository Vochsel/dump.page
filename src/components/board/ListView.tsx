"use client";

import { useState } from "react";
import { useBoardOps } from "@/context/board-ops-context";
import { ExternalLink, FileText, CheckSquare, Link as LinkIcon, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function ListView() {
  const { nodes: boardNodes } = useBoardOps();
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);

  const nodes = boardNodes ?? [];
  const textNodes = nodes.filter((n) => n.type === "text");
  const linkNodes = nodes.filter((n) => n.type === "link");
  const checklistNodes = nodes.filter((n) => n.type === "checklist");

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        This board is empty.
      </div>
    );
  }

  const previewNode = previewNodeId ? nodes.find((n) => n._id === previewNodeId) : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {textNodes.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            <FileText className="h-4 w-4" />
            Notes ({textNodes.length})
          </h2>
          <div className="space-y-2">
            {textNodes.map((node) => {
              const stripped = stripHtml(node.content);
              return (
                <div
                  key={node._id}
                  className="group bg-yellow-50 dark:bg-amber-950/30 border border-yellow-200/60 dark:border-amber-800/40 rounded-lg px-4 py-3 flex items-start gap-3"
                >
                  <div className="min-w-0 flex-1">
                    {node.title && (
                      <h3 className="font-semibold text-sm text-yellow-900 dark:text-amber-100 mb-0.5">{node.title}</h3>
                    )}
                    <p className="text-sm text-yellow-800 dark:text-amber-200/80 line-clamp-2">
                      {stripped || <span className="italic text-yellow-600/50">Empty</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewNodeId(node._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-yellow-200/50 dark:hover:bg-amber-800/30 text-yellow-700 dark:text-amber-300 flex-shrink-0 mt-0.5"
                    title="Preview"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {checklistNodes.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            <CheckSquare className="h-4 w-4" />
            Checklists ({checklistNodes.length})
          </h2>
          <div className="space-y-2">
            {checklistNodes.map((node) => {
              let items: Array<{ id: string; text: string; checked: boolean }> = [];
              try { items = JSON.parse(node.content); } catch { /* skip */ }
              const checked = items.filter((i) => i.checked).length;
              const total = items.length;
              const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
              const label = node.title || (total > 0 ? `${total} items` : "Empty checklist");

              return (
                <div
                  key={node._id}
                  className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{label}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">{checked}/{total}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewNodeId(node._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0"
                    title="Preview"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {linkNodes.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            <LinkIcon className="h-4 w-4" />
            Links ({linkNodes.length})
          </h2>
          <div className="space-y-1.5">
            {linkNodes.map((node) => {
              let hostname = "";
              let favicon = node.metadata?.favicon;
              try { hostname = new URL(node.content).hostname.replace(/^www\./, ""); } catch { hostname = node.content; }
              if (!favicon) {
                try { favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`; } catch { /* skip */ }
              }
              return (
                <div
                  key={node._id}
                  className="group flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {favicon && (
                    <img src={favicon} alt="" className="h-4 w-4 flex-shrink-0 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  {!favicon && <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />}
                  <a
                    href={node.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1"
                  >
                    <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                      {node.metadata?.title || node.content}
                    </p>
                    {node.metadata?.description && (
                      <p className="text-xs text-gray-400 truncate">{node.metadata.description}</p>
                    )}
                    <p className="text-xs text-gray-400">{hostname}</p>
                  </a>
                  <button
                    onClick={(e) => { e.preventDefault(); setPreviewNodeId(node._id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0"
                    title="Preview"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
    </div>
  );
}

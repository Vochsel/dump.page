"use client";

import { useBoardOps } from "@/context/board-ops-context";
import { ExternalLink, FileText, CheckSquare, Link as LinkIcon } from "lucide-react";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function ListView() {
  const { nodes: boardNodes } = useBoardOps();

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

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {textNodes.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            <FileText className="h-4 w-4" />
            Notes ({textNodes.length})
          </h2>
          <div className="space-y-2">
            {textNodes.map((node) => (
              <div
                key={node._id}
                className="bg-yellow-50 dark:bg-amber-950/30 border border-yellow-200/60 dark:border-amber-800/40 rounded-lg px-4 py-3"
              >
                {node.title && (
                  <h3 className="font-semibold text-sm text-yellow-900 dark:text-amber-100 mb-1">{node.title}</h3>
                )}
                <p className="text-sm text-yellow-800 dark:text-amber-200/80 line-clamp-4">
                  {stripHtml(node.content) || <span className="italic text-yellow-600/50">Empty</span>}
                </p>
              </div>
            ))}
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
              return (
                <div
                  key={node._id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3"
                >
                  {node.title && (
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">{node.title}</h3>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <input type="checkbox" checked={item.checked} readOnly className="h-3.5 w-3.5 rounded border-gray-300 mt-0.5" />
                        <span className={`text-sm ${item.checked ? "line-through opacity-50" : ""}`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{checked}/{items.length} done</p>
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
              try { hostname = new URL(node.content).hostname.replace(/^www\./, ""); } catch { hostname = node.content; }
              return (
                <a
                  key={node._id}
                  href={node.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                      {node.metadata?.title || node.content}
                    </p>
                    {node.metadata?.description && (
                      <p className="text-xs text-gray-400 truncate">{node.metadata.description}</p>
                    )}
                    <p className="text-xs text-gray-400">{hostname}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

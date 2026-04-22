"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, CheckSquare, Link as LinkIcon, X, LayoutGrid } from "lucide-react";
import type { BoardNode } from "@/context/board-ops-context";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function getCardPreview(node: BoardNode): { title: string; subtitle?: string } {
  if (node.type === "text") {
    const stripped = stripHtml(node.content);
    const title = node.title || stripped.split("\n")[0].slice(0, 80) || "Empty note";
    const subtitle = node.title ? stripped.slice(0, 80) : undefined;
    return { title, subtitle };
  }
  if (node.type === "checklist") {
    let items: Array<{ checked: boolean; text: string }> = [];
    try { items = JSON.parse(node.content); } catch { /* ignore */ }
    const checked = items.filter((i) => i.checked).length;
    const total = items.length;
    const title = node.title || (total > 0 ? items[0].text.slice(0, 60) : "Empty checklist");
    const subtitle = total > 0 ? `${checked}/${total} done` : undefined;
    return { title, subtitle };
  }
  if (node.type === "link") {
    const title = node.metadata?.title || node.content;
    let hostname = "";
    try { hostname = new URL(node.content).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
    return { title, subtitle: hostname };
  }
  if (node.type === "board") {
    return { title: node.title || "Board", subtitle: "linked board" };
  }
  return { title: "Untitled" };
}

function TypeIcon({ type }: { type: BoardNode["type"] }) {
  const cls = "h-3.5 w-3.5 flex-shrink-0";
  if (type === "text") return <FileText className={`${cls} text-amber-500`} />;
  if (type === "checklist") return <CheckSquare className={`${cls} text-blue-500`} />;
  if (type === "link") return <LinkIcon className={`${cls} text-emerald-500`} />;
  if (type === "board") return <LayoutGrid className={`${cls} text-purple-500`} />;
  return null;
}

interface KanbanCardProps {
  node: BoardNode;
  dragging?: boolean;
}

export function KanbanCard({ node, dragging }: KanbanCardProps) {
  const { title, subtitle } = getCardPreview(node);
  let favicon: string | undefined;
  if (node.type === "link") {
    favicon = node.metadata?.favicon;
    if (!favicon) {
      try {
        const host = new URL(node.content).hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
      } catch { /* ignore */ }
    }
  }

  return (
    <div
      className={`group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2.5 py-2 shadow-sm ${
        dragging ? "shadow-lg ring-2 ring-blue-400/40" : "hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      <div className="flex items-start gap-2">
        {node.type === "link" && favicon ? (
          <img
            src={favicon}
            alt=""
            className="h-3.5 w-3.5 mt-0.5 rounded-sm flex-shrink-0"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="mt-0.5">
            <TypeIcon type={node.type} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-2 break-words">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SortableKanbanCardProps {
  node: BoardNode;
  canEdit: boolean;
  onRemove: () => void;
}

export function SortableKanbanCard({ node, canEdit, onRemove }: SortableKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card:${node._id}`,
    disabled: !canEdit,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/card" {...attributes} {...listeners}>
      <KanbanCard node={node} />
      {canEdit && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 transition-opacity p-0.5 rounded bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500"
          title="Remove from kanban"
          aria-label="Remove from kanban"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

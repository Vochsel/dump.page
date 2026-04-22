"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, CheckSquare, Link as LinkIcon, X, LayoutGrid } from "lucide-react";
import type { BoardNode } from "@/context/board-ops-context";
import type { KanbanTheme } from "./KanbanView";

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr|pre)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
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
  theme: KanbanTheme;
  dragging?: boolean;
}

export function KanbanCard({ node, theme, dragging }: KanbanCardProps) {
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
      className={`group rounded-md px-2.5 py-2 shadow-sm ${
        dragging ? "shadow-lg ring-2 ring-blue-400/40" : ""
      }`}
      style={{
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
      }}
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
          <p
            className="text-sm font-medium line-clamp-2 break-words"
            style={{ color: theme.emphText }}
          >
            {title}
          </p>
          {subtitle && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: theme.mutedText }}
            >
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
  theme: KanbanTheme;
  onRemove: () => void;
}

export function SortableKanbanCard({ node, canEdit, theme, onRemove }: SortableKanbanCardProps) {
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
      <KanbanCard node={node} theme={theme} />
      {canEdit && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 transition-opacity p-0.5 rounded border text-gray-400 hover:text-red-500"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
          title="Remove from kanban"
          aria-label="Remove from kanban"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

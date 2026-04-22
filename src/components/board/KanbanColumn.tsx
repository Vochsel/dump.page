"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, Trash2, GripVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KanbanColumn as KanbanColumnType, BoardNode } from "@/context/board-ops-context";
import { KanbanCard, SortableKanbanCard } from "./KanbanCard";
import type { KanbanTheme } from "./KanbanView";

interface KanbanColumnProps {
  column: KanbanColumnType;
  canEdit: boolean;
  nodeMap: Map<string, BoardNode>;
  theme: KanbanTheme;
  onRename: (title: string) => void;
  onDelete: () => void;
  onRemoveCard: (nodeId: string) => void;
  onAddItem: () => void;
  overlay?: boolean;
}

export function KanbanColumn({
  column,
  canEdit,
  nodeMap,
  theme,
  onRename,
  onDelete,
  onRemoveCard,
  onAddItem,
  overlay,
}: KanbanColumnProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const startEditingTitle = () => {
    setTitleDraft(column.title);
    setEditingTitle(true);
  };

  const sortable = useSortable({
    id: `col:${column.id}`,
    disabled: !canEdit || overlay,
  });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const { setNodeRef: setDropzoneRef, isOver: isDropzoneOver } = useDroppable({
    id: `dropzone:${column.id}`,
    disabled: overlay,
  });

  const style: React.CSSProperties = overlay
    ? {
        backgroundColor: theme.columnBg,
        border: `1px solid ${theme.columnBorder}`,
      }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        backgroundColor: theme.columnBg,
        border: `1px solid ${theme.columnBorder}`,
      };

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== column.title) {
      onRename(trimmed);
    } else {
      setTitleDraft(column.title);
    }
    setEditingTitle(false);
  };

  const cards = column.nodeIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is BoardNode => !!n);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 backdrop-blur-sm rounded-lg flex flex-col max-h-full"
    >
      <div
        className="flex items-center gap-1 px-2 py-2 border-b"
        style={{ borderColor: theme.columnBorder }}
      >
        {canEdit && (
          <button
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:opacity-80"
            style={{ color: theme.mutedText }}
            {...attributes}
            {...listeners}
            aria-label="Drag column"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        {editingTitle && canEdit ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitleDraft(column.title);
                setEditingTitle(false);
              }
            }}
            className="flex-1 text-sm font-semibold rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: theme.cardBg,
              color: theme.emphText,
              border: `1px solid ${theme.columnBorder}`,
            }}
          />
        ) : (
          <button
            onClick={() => canEdit && startEditingTitle()}
            className={`flex-1 text-left text-sm font-semibold px-1 py-1 rounded truncate ${
              canEdit ? "hover:opacity-80 cursor-text" : "cursor-default"
            }`}
            style={{ color: theme.emphText }}
            title={column.title}
          >
            {column.title}
          </button>
        )}
        <span className="text-xs font-mono px-1" style={{ color: theme.mutedText }}>
          {cards.length}
        </span>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded hover:opacity-80"
                style={{ color: theme.mutedText }}
                aria-label="Column options"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4" />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        ref={setDropzoneRef}
        className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2"
        style={{
          backgroundColor: isDropzoneOver ? "rgba(59, 130, 246, 0.08)" : undefined,
        }}
      >
        <SortableContext
          items={cards.map((n) => `card:${n._id}`)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((node) =>
            overlay ? (
              <KanbanCard key={node._id} node={node} theme={theme} />
            ) : (
              <SortableKanbanCard
                key={node._id}
                node={node}
                canEdit={canEdit}
                theme={theme}
                onRemove={() => onRemoveCard(node._id)}
              />
            )
          )}
        </SortableContext>
        {cards.length === 0 && !overlay && (
          <div className="text-xs italic text-center py-4" style={{ color: theme.mutedText, opacity: 0.7 }}>
            No items
          </div>
        )}
      </div>

      {canEdit && !overlay && (
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 text-xs transition-colors px-3 py-2 border-t rounded-b-lg hover:opacity-90"
          style={{
            color: theme.mutedText,
            borderColor: theme.columnBorder,
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </button>
      )}
    </div>
  );
}

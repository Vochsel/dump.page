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

interface KanbanColumnProps {
  column: KanbanColumnType;
  canEdit: boolean;
  nodeMap: Map<string, BoardNode>;
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
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
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
      className="flex-shrink-0 w-72 bg-gray-100/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-lg flex flex-col max-h-full"
    >
      <div className="flex items-center gap-1 px-2 py-2 border-b border-gray-200/70 dark:border-gray-800/70">
        {canEdit && (
          <button
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
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
            className="flex-1 text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={() => canEdit && startEditingTitle()}
            className={`flex-1 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 px-1 py-1 rounded truncate ${
              canEdit ? "hover:bg-gray-200/60 dark:hover:bg-gray-800/60 cursor-text" : "cursor-default"
            }`}
            title={column.title}
          >
            {column.title}
          </button>
        )}
        <span className="text-xs text-gray-400 font-mono px-1">{cards.length}</span>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-800/60 text-gray-500 dark:text-gray-400"
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
        className={`flex-1 min-h-0 overflow-y-auto p-2 space-y-2 ${
          isDropzoneOver ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
        }`}
      >
        <SortableContext
          items={cards.map((n) => `card:${n._id}`)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((node) =>
            overlay ? (
              <KanbanCard key={node._id} node={node} />
            ) : (
              <SortableKanbanCard
                key={node._id}
                node={node}
                canEdit={canEdit}
                onRemove={() => onRemoveCard(node._id)}
              />
            )
          )}
        </SortableContext>
        {cards.length === 0 && !overlay && (
          <div className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-4">
            No items
          </div>
        )}
      </div>

      {canEdit && !overlay && (
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition-colors px-3 py-2 border-t border-gray-200/70 dark:border-gray-800/70 rounded-b-lg"
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </button>
      )}
    </div>
  );
}

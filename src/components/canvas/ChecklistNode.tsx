"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { NodeProps } from "@xyflow/react";
import { Trash2, GripVertical, X } from "lucide-react";
import { useBoardOps } from "@/context/board-ops-context";

type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
};

import type { UndoAction } from "@/hooks/useUndoRedo";

type ChecklistNodeData = {
  content: string;
  title?: string;
  showTitle?: boolean;
  nodeId: string;
  canEdit: boolean;
  pushAction: (action: UndoAction) => void;
  deleteNodeWithUndo: (nodeId: string) => void;
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function parseItems(content: string): ChecklistItem[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return [];
}

export function ChecklistNode({ data }: NodeProps) {
  const { content, title, showTitle, nodeId, canEdit, pushAction, deleteNodeWithUndo } = data as unknown as ChecklistNodeData;
  const { updateNode } = useBoardOps();

  // Title editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title ?? "");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleValue(title ?? "");
  }, [title]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  const commitTitle = useCallback(() => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    const newTitle = trimmed || undefined;
    if (newTitle !== (title ?? undefined)) {
      updateNode({ nodeId, title: newTitle ?? "" });
    }
  }, [titleValue, title, nodeId, updateNode]);

  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const parsed = parseItems(content);
    return parsed.length > 0 ? parsed : [{ id: generateId(), text: "", checked: false }];
  });
  // Ref always tracks latest items so blur/effects never use stale closures
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const focusIdRef = useRef<string | null>(null);
  // Track whether any input is focused to skip external sync
  const hasFocusRef = useRef(false);

  // Sync from external content changes only when not editing
  useEffect(() => {
    if (hasFocusRef.current) return;
    const parsed = parseItems(content);
    if (parsed.length > 0) {
      setItems(parsed);
    }
  }, [content]);

  // Focus newly created items
  useEffect(() => {
    if (focusIdRef.current) {
      const el = inputRefs.current.get(focusIdRef.current);
      if (el) {
        el.focus();
        focusIdRef.current = null;
      }
    }
  });

  const persistNow = useCallback(
    (newItems: ChecklistItem[]) => {
      setItems(newItems);
      updateNode({ nodeId, content: JSON.stringify(newItems) });
    },
    [nodeId, updateNode]
  );

  const toggleCheck = useCallback(
    (id: string) => {
      const newItems = itemsRef.current.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      persistNow(newItems);
    },
    [persistNow]
  );

  const updateText = useCallback(
    (id: string, text: string) => {
      // Update local state only — persist on blur
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, text } : item))
      );
    },
    []
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    const newContent = JSON.stringify(itemsRef.current);
    // If focus is moving to another input within this checklist, stay in editing mode
    if (
      containerRef.current &&
      e.relatedTarget &&
      containerRef.current.contains(e.relatedTarget as Node)
    ) {
      // Internal focus transfer — persist but keep hasFocusRef true
      if (newContent !== content) {
        pushAction({ type: "edit", nodeId, oldContent: content, newContent });
      }
      updateNode({ nodeId, content: newContent });
      return;
    }
    hasFocusRef.current = false;
    if (newContent !== content) {
      pushAction({ type: "edit", nodeId, oldContent: content, newContent });
    }
    updateNode({ nodeId, content: newContent });
  }, [nodeId, updateNode, content, pushAction]);

  const addItemAfter = useCallback(
    (id: string) => {
      const cur = itemsRef.current;
      const idx = cur.findIndex((item) => item.id === id);
      const newItem: ChecklistItem = { id: generateId(), text: "", checked: false };
      const newItems = [...cur];
      newItems.splice(idx + 1, 0, newItem);
      focusIdRef.current = newItem.id;
      // Keep editing flag true across the focus transfer
      hasFocusRef.current = true;
      // Local-only update; the old input's blur will persist via ref
      setItems(newItems);
    },
    []
  );

  const deleteItem = useCallback(
    (id: string) => {
      const newItems = itemsRef.current.filter((item) => item.id !== id);
      if (newItems.length === 0) {
        const fresh = { id: generateId(), text: "", checked: false };
        persistNow([fresh]);
      } else {
        persistNow(newItems);
      }
    },
    [persistNow]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addItemAfter(id);
      }
      if (e.key === "Backspace") {
        const cur = itemsRef.current;
        const item = cur.find((i) => i.id === id);
        if (item && item.text === "" && cur.length > 1) {
          e.preventDefault();
          const idx = cur.findIndex((i) => i.id === id);
          const focusTarget = cur[idx - 1] || cur[idx + 1];
          if (focusTarget) {
            focusIdRef.current = focusTarget.id;
          }
          deleteItem(id);
        }
      }
    },
    [addItemAfter, deleteItem]
  );

  // DnD handlers — only triggered from the grip handle
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === dropIdx) {
        setDragIdx(null);
        setDragOverIdx(null);
        return;
      }
      const newItems = [...itemsRef.current];
      const [moved] = newItems.splice(dragIdx, 1);
      newItems.splice(dropIdx, 0, moved);
      setDragIdx(null);
      setDragOverIdx(null);
      persistNow(newItems);
    },
    [dragIdx, persistNow]
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);

  return (
    <div ref={containerRef} className="bg-white dark:bg-gray-900 rounded-sm shadow-md min-w-[220px] max-w-[360px] group border border-gray-200 dark:border-gray-700">
      {/* Title bar — only visible when showTitle is true */}
      {showTitle && (
        <div className="bg-gray-100/80 dark:bg-gray-800/60 px-3 py-1.5 rounded-t-sm border-b border-gray-200/80 dark:border-gray-700/60">
          {editingTitle && canEdit ? (
            <input
              ref={titleInputRef}
              className="nodrag nowheel w-full bg-transparent border-none outline-none text-xs font-semibold text-gray-700 dark:text-gray-200 placeholder:text-gray-400/40 dark:placeholder:text-gray-500/40"
              value={titleValue}
              placeholder=""
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") {
                  setTitleValue(title ?? "");
                  setEditingTitle(false);
                }
              }}
            />
          ) : (
            <div
              className={`text-xs font-semibold truncate min-h-[1em] ${
                title
                  ? "text-gray-700 dark:text-gray-200"
                  : ""
              } ${canEdit ? "cursor-text" : ""}`}
              onClick={() => canEdit && setEditingTitle(true)}
            >
              {title || ""}
            </div>
          )}
        </div>
      )}
      <div className="p-2 space-y-0.5">
        {items.map((item, idx) => (
          <div
            key={item.id}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-start gap-1 rounded px-1 py-0.5 group/item ${
              dragOverIdx === idx && dragIdx !== idx
                ? "border-t-2 border-gray-400"
                : "border-t-2 border-transparent"
            } ${dragIdx === idx ? "opacity-40" : ""}`}
          >
            {canEdit && (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                className="nodrag cursor-grab shrink-0 mt-0.5"
              >
                <GripVertical className="h-3 w-3 text-gray-400/60" />
              </div>
            )}
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => canEdit && toggleCheck(item.id)}
              disabled={!canEdit}
              className="nodrag h-3.5 w-3.5 rounded border-gray-300 text-gray-600 focus:ring-gray-500 shrink-0 cursor-pointer mt-0.5"
            />
            {canEdit ? (
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(item.id, el);
                  else inputRefs.current.delete(item.id);
                }}
                type="text"
                value={item.text}
                placeholder="New item..."
                tabIndex={0}
                onChange={(e) => updateText(item.id, e.target.value)}
                onFocus={() => { hasFocusRef.current = true; }}
                onBlur={handleBlur}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className={`nodrag nowheel flex-1 bg-transparent border-none outline-none text-sm px-1 py-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400/50 ${
                  item.checked ? "line-through opacity-50" : ""
                }`}
              />
            ) : (
              <span
                className={`flex-1 text-sm px-1 text-gray-900 dark:text-gray-100 break-words min-w-0 ${
                  item.checked ? "line-through opacity-50" : ""
                }`}
              >
                {item.text || <span className="text-gray-400/50 italic">Empty</span>}
              </span>
            )}
            {canEdit && (
              <button
                onClick={() => deleteItem(item.id)}
                className="nodrag opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 hover:bg-gray-200/50 rounded shrink-0 mt-0.5"
              >
                <X className="h-3 w-3 text-gray-600/60" />
              </button>
            )}
          </div>
        ))}
      </div>
      {canEdit && (
        <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => deleteNodeWithUndo(nodeId)}
            className="bg-destructive rounded-full p-1 shadow-sm hover:bg-destructive/90"
          >
            <Trash2 className="h-3 w-3 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

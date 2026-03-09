"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { NodeProps } from "@xyflow/react";
import { Trash2, GripVertical, X, ChevronsDownUp, ChevronsUpDown, Maximize2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useBoardOps } from "@/context/board-ops-context";
import confetti from "canvas-confetti";


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
  collapsed?: boolean;
  nodeId: string;
  canEdit: boolean;
  pushAction: (action: UndoAction) => void;
  deleteNodeWithUndo: (nodeId: string) => void;
  onPreview?: (nodeId: string) => void;
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function parseItems(content: string): { items: ChecklistItem[]; needsIdMigration: boolean } {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      let needsIdMigration = false;
      const items = parsed.map((item: Partial<ChecklistItem>) => {
        if (!item.id) needsIdMigration = true;
        return {
          id: item.id || generateId(),
          text: item.text ?? "",
          checked: item.checked ?? false,
        };
      });
      return { items, needsIdMigration };
    }
  } catch {
    // ignore
  }
  return { items: [], needsIdMigration: false };
}

export function ChecklistNode({ data }: NodeProps) {
  const { content, title, showTitle, collapsed, nodeId, canEdit, pushAction, deleteNodeWithUndo, onPreview } = data as unknown as ChecklistNodeData;
  const { updateNode } = useBoardOps();

  // Stable refs for context functions — prevents callback recreation on every node change
  const updateNodeRef = useRef(updateNode);
  updateNodeRef.current = updateNode;
  const stableUpdateNode = useCallback(
    (args: Parameters<typeof updateNode>[0]) => updateNodeRef.current(args),
    []
  );

  const pushActionRef = useRef(pushAction);
  pushActionRef.current = pushAction;
  const stablePushAction = useCallback(
    (action: UndoAction) => pushActionRef.current(action),
    []
  );

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
      stableUpdateNode({ nodeId, title: newTitle ?? "" });
    }
  }, [titleValue, title, nodeId, stableUpdateNode]);

  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const { items: parsed } = parseItems(content);
    return parsed.length > 0 ? parsed : [{ id: generateId(), text: "", checked: false }];
  });
  // Ref always tracks latest items so blur/effects never use stale closures
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // One-time migration: persist IDs for old checklists that lack them
  const didMigrateRef = useRef(false);
  useEffect(() => {
    if (didMigrateRef.current) return;
    const { needsIdMigration } = parseItems(content);
    if (needsIdMigration) {
      didMigrateRef.current = true;
      stableUpdateNode({ nodeId, content: JSON.stringify(itemsRef.current) });
    }
  }, [content, nodeId, stableUpdateNode]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const inputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const focusIdRef = useRef<string | null>(null);
  // Track whether any input is focused to skip external sync
  const hasFocusRef = useRef(false);
  const lastFocusedIdRef = useRef<string | null>(null);

  // Sync from external content changes only when not editing
  useEffect(() => {
    if (hasFocusRef.current) return;
    // Also check if any input inside the container is focused (covers edge cases)
    if (containerRef.current?.contains(document.activeElement)) return;
    const { items: parsed } = parseItems(content);
    if (parsed.length > 0) {
      setItems(parsed);
    }
  }, [content]);

  // Focus newly created items and auto-size textareas
  useEffect(() => {
    if (focusIdRef.current) {
      const el = inputRefs.current.get(focusIdRef.current);
      if (el) {
        el.focus();
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
        focusIdRef.current = null;
      }
    }
  });

  // Auto-size all textareas on mount and when items change
  useEffect(() => {
    inputRefs.current.forEach((el) => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    });
  }, [items]);

  // Focus restoration safety net — if focus dropped to body during re-render, restore it
  useEffect(() => {
    if (
      hasFocusRef.current &&
      lastFocusedIdRef.current &&
      document.activeElement === document.body
    ) {
      const el = inputRefs.current.get(lastFocusedIdRef.current);
      if (el) {
        el.focus();
      } else {
        hasFocusRef.current = false;
        lastFocusedIdRef.current = null;
      }
    }
  });

  const persistNow = useCallback(
    (newItems: ChecklistItem[]) => {
      setItems(newItems);
      stableUpdateNode({ nodeId, content: JSON.stringify(newItems) });
    },
    [nodeId, stableUpdateNode]
  );

  const toggleCheck = useCallback(
    (id: string) => {
      const newItems = itemsRef.current.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      persistNow(newItems);

      // Confetti when last item is checked
      if (newItems.length > 0 && newItems.every((i) => i.checked)) {
        const end = Date.now() + 600;
        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            disableForReducedMotion: true,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            disableForReducedMotion: true,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }
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
        stablePushAction({ type: "edit", nodeId, oldContent: content, newContent });
      }
      stableUpdateNode({ nodeId, content: newContent });
      return;
    }
    // Defer clearing hasFocusRef — during arrow navigation, the new textarea's
    // onFocus may not have fired yet. Use rAF so the new onFocus fires first.
    requestAnimationFrame(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        hasFocusRef.current = false;
        lastFocusedIdRef.current = null;
      }
    });
    if (newContent !== content) {
      stablePushAction({ type: "edit", nodeId, oldContent: content, newContent });
    }
    stableUpdateNode({ nodeId, content: newContent });
  }, [nodeId, stableUpdateNode, content, stablePushAction]);

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
      const oldContent = JSON.stringify(itemsRef.current);
      let finalItems: ChecklistItem[];
      const newItems = itemsRef.current.filter((item) => item.id !== id);
      if (newItems.length === 0) {
        finalItems = [{ id: generateId(), text: "", checked: false }];
      } else {
        finalItems = newItems;
      }
      persistNow(finalItems);
      stablePushAction({ type: "edit", nodeId, oldContent, newContent: JSON.stringify(finalItems) });
    },
    [persistNow, nodeId, stablePushAction]
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

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Calculate if checklist needs wider layout based on content
  const needsWide = items.some((i) => i.text.length > 35);
  const widthClass = needsWide ? "w-[480px]" : "w-[280px]";

  if (collapsed) {
    return (
      <div ref={containerRef} className={`bg-white dark:bg-gray-900 rounded-sm shadow-md ${widthClass} group border border-gray-200 dark:border-gray-700`}>
        {showTitle && title && (
          <div className="bg-gray-100/80 dark:bg-gray-800/60 px-3 py-1.5 rounded-t-sm border-b border-gray-200/80 dark:border-gray-700/60 flex items-center gap-1">
            <div className="flex-1 min-w-0 text-xs font-semibold truncate text-gray-700 dark:text-gray-200">{title}</div>
            <button
              className="nodrag flex-shrink-0 p-0.5 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors text-gray-500/50 hover:text-gray-600/70 dark:text-gray-400/50 dark:hover:text-gray-300/70"
              onClick={() => onPreview?.(nodeId)}
              title="Preview contents"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
            {canEdit && (
              <button
                className="nodrag flex-shrink-0 p-0.5 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors text-gray-500/50 hover:text-gray-600/70 dark:text-gray-400/50 dark:hover:text-gray-300/70"
                onClick={() => updateNode({ nodeId, collapsed: false })}
                title="Expand checklist"
              >
                <ChevronsUpDown className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        <div className="p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{checkedCount}/{totalCount} done</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
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

  return (
    <div ref={containerRef} className={`bg-white dark:bg-gray-900 rounded-sm shadow-md ${widthClass} group border border-gray-200 dark:border-gray-700`}>
      {/* Title bar — only visible when showTitle is true */}
      {showTitle && (
        <div className="bg-gray-100/80 dark:bg-gray-800/60 px-3 py-1.5 rounded-t-sm border-b border-gray-200/80 dark:border-gray-700/60 flex items-center gap-1">
          <div className="flex-1 min-w-0">
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
          {canEdit && (
            <button
              className="nodrag flex-shrink-0 p-0.5 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors text-gray-500/50 hover:text-gray-600/70 dark:text-gray-400/50 dark:hover:text-gray-300/70"
              onClick={() => updateNode({ nodeId, collapsed: !collapsed })}
              title={collapsed ? "Expand checklist" : "Collapse checklist"}
            >
              {collapsed ? <ChevronsUpDown className="h-3 w-3" /> : <ChevronsDownUp className="h-3 w-3" />}
            </button>
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
                className="nodrag cursor-grab shrink-0 flex items-center h-5"
              >
                <GripVertical className="h-3 w-3 text-gray-400/60" />
              </div>
            )}
            <span className="nodrag shrink-0 flex items-center h-5">
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => canEdit && toggleCheck(item.id)}
                disabled={!canEdit}
                className="h-4 w-4 rounded-[3px] border-gray-300 dark:border-gray-600 data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600 dark:data-[state=checked]:bg-gray-400 dark:data-[state=checked]:border-gray-400 cursor-pointer transition-all duration-150"
              />
            </span>
            {canEdit ? (
              <textarea
                ref={(el) => {
                  if (el) inputRefs.current.set(item.id, el);
                  else inputRefs.current.delete(item.id);
                }}
                value={item.text}
                placeholder="New item..."
                rows={1}
                tabIndex={0}
                onChange={(e) => {
                  updateText(item.id, e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onFocus={(e) => {
                  hasFocusRef.current = true;
                  lastFocusedIdRef.current = item.id;
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addItemAfter(item.id);
                  }
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.stopPropagation(); // Prevent React Flow from intercepting
                    const ta = e.currentTarget;
                    const val = ta.value;
                    const pos = ta.selectionStart;
                    // For multiline items, only jump to adjacent item when
                    // cursor is on the first line (ArrowUp) or last line (ArrowDown)
                    const atEdge = e.key === "ArrowUp"
                      ? !val.slice(0, pos).includes("\n")
                      : !val.slice(pos).includes("\n");
                    if (atEdge) {
                      const cur = itemsRef.current;
                      const curIdx = cur.findIndex((i) => i.id === item.id);
                      const targetIdx = e.key === "ArrowUp" ? curIdx - 1 : curIdx + 1;
                      if (targetIdx >= 0 && targetIdx < cur.length) {
                        e.preventDefault();
                        // Set focus flag BEFORE .focus() to prevent blur handler from clearing it
                        hasFocusRef.current = true;
                        const targetEl = inputRefs.current.get(cur[targetIdx].id);
                        if (targetEl) {
                          targetEl.focus();
                          if (e.key === "ArrowUp") {
                            const len = targetEl.value.length;
                            targetEl.setSelectionRange(len, len);
                          } else {
                            targetEl.setSelectionRange(0, 0);
                          }
                        }
                      }
                    }
                  }
                  if (e.key === "Backspace" || e.key === "Delete") {
                    const cur = itemsRef.current;
                    const curItem = cur.find((i) => i.id === item.id);
                    if (curItem && curItem.text === "") {
                      e.preventDefault();
                      e.stopPropagation();
                      if (cur.length > 1) {
                        const idx = cur.findIndex((i) => i.id === item.id);
                        const focusTarget = cur[idx - 1] || cur[idx + 1];
                        if (focusTarget) focusIdRef.current = focusTarget.id;
                        deleteItem(item.id);
                      }
                    } else if (e.key === "Delete") {
                      e.stopPropagation();
                    }
                  }
                }}
                className={`nodrag nowheel flex-1 bg-transparent border-none outline-none text-sm px-1 py-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400/50 resize-none overflow-hidden min-w-0 ${
                  item.checked ? "line-through opacity-50" : ""
                }`}
              />
            ) : (
              <span
                className={`flex-1 text-sm px-1 text-gray-900 dark:text-gray-100 break-words min-w-0 ${
                  item.checked ? "line-through opacity-50" : ""
                }`}
              >
                {item.text ? linkifyText(item.text) : <span className="text-gray-400/50 italic">Empty</span>}
              </span>
            )}
            {canEdit && (
              <button
                onClick={() => deleteItem(item.id)}
                className="nodrag opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 hover:bg-gray-200/50 rounded shrink-0 flex items-center h-5"
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

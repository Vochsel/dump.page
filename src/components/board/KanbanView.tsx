"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useBoardOps } from "@/context/board-ops-context";
import type { KanbanLayout, BoardNode } from "@/context/board-ops-context";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { KanbanAddItemDialog } from "./KanbanAddItemDialog";

interface KanbanViewProps {
  canEdit: boolean;
}

function makeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function findContainer(layout: KanbanLayout, nodeId: string): string | null {
  for (const col of layout.columns) {
    if (col.nodeIds.includes(nodeId)) return col.id;
  }
  return null;
}

export function KanbanView({ canEdit }: KanbanViewProps) {
  const { nodes, kanbanLayout, setKanbanLayout } = useBoardOps();
  const [addItemColumnId, setAddItemColumnId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Local optimistic copy of the layout for smooth drag interactions
  const [localLayout, setLocalLayout] = useState<KanbanLayout | null>(null);
  const displayLayout = useMemo<KanbanLayout | undefined>(() => {
    if (!localLayout) return kanbanLayout;
    if (!kanbanLayout) return localLayout;
    // Fall back to remote once it catches up (avoids stale local override)
    if (JSON.stringify(localLayout) === JSON.stringify(kanbanLayout)) return kanbanLayout;
    return localLayout;
  }, [localLayout, kanbanLayout]);

  // Seed a default "Unsorted" column on first visit if no layout exists yet
  useEffect(() => {
    if (!canEdit) return;
    if (initializedRef.current) return;
    if (!kanbanLayout || !nodes) return;
    if (kanbanLayout.columns.length > 0) {
      initializedRef.current = true;
      return;
    }
    if (nodes.length === 0) {
      initializedRef.current = true;
      return;
    }
    initializedRef.current = true;
    const initial: KanbanLayout = {
      columns: [
        {
          id: makeId(),
          title: "Unsorted",
          nodeIds: nodes.map((n) => n._id),
        },
      ],
    };
    void setKanbanLayout(initial);
  }, [kanbanLayout, nodes, setKanbanLayout, canEdit]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, BoardNode>();
    (nodes ?? []).forEach((n) => map.set(n._id, n));
    return map;
  }, [nodes]);

  const onBoardIds = useMemo(() => {
    const set = new Set<string>();
    (displayLayout?.columns ?? []).forEach((c) => c.nodeIds.forEach((id) => set.add(id)));
    return set;
  }, [displayLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const persist = (next: KanbanLayout) => {
    setLocalLayout(next);
    void setKanbanLayout(next);
  };

  const addColumn = () => {
    if (!canEdit || !displayLayout) return;
    const next: KanbanLayout = {
      columns: [...displayLayout.columns, { id: makeId(), title: "New column", nodeIds: [] }],
    };
    persist(next);
  };

  const renameColumn = (columnId: string, title: string) => {
    if (!displayLayout) return;
    const next: KanbanLayout = {
      columns: displayLayout.columns.map((c) => (c.id === columnId ? { ...c, title } : c)),
    };
    persist(next);
  };

  const deleteColumn = (columnId: string) => {
    if (!displayLayout) return;
    const next: KanbanLayout = {
      columns: displayLayout.columns.filter((c) => c.id !== columnId),
    };
    persist(next);
  };

  const removeCard = (columnId: string, nodeId: string) => {
    if (!displayLayout) return;
    const next: KanbanLayout = {
      columns: displayLayout.columns.map((c) =>
        c.id === columnId ? { ...c, nodeIds: c.nodeIds.filter((id) => id !== nodeId) } : c
      ),
    };
    persist(next);
  };

  const addToColumn = (columnId: string, nodeIds: string[]) => {
    if (!displayLayout) return;
    const toAdd = new Set(nodeIds);
    const cleaned: KanbanLayout = {
      columns: displayLayout.columns.map((c) => {
        if (c.id === columnId) {
          const existing = new Set(c.nodeIds);
          const added = nodeIds.filter((id) => !existing.has(id));
          return { ...c, nodeIds: [...c.nodeIds, ...added] };
        }
        return { ...c, nodeIds: c.nodeIds.filter((id) => !toAdd.has(id)) };
      }),
    };
    persist(cleaned);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith("col:")) {
      setActiveColumnId(id.slice(4));
    } else if (id.startsWith("card:")) {
      setActiveCardId(id.slice(5));
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!displayLayout) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith("card:")) return;

    const cardId = activeId.slice(5);
    const fromColumn = findContainer(displayLayout, cardId);
    if (!fromColumn) return;

    let toColumn: string | null = null;
    if (overId.startsWith("col:")) {
      toColumn = overId.slice(4);
    } else if (overId.startsWith("card:")) {
      toColumn = findContainer(displayLayout, overId.slice(5));
    } else if (overId.startsWith("dropzone:")) {
      toColumn = overId.slice(9);
    }

    if (!toColumn || toColumn === fromColumn) return;

    const next: KanbanLayout = {
      columns: displayLayout.columns.map((c) => {
        if (c.id === fromColumn) return { ...c, nodeIds: c.nodeIds.filter((id) => id !== cardId) };
        if (c.id === toColumn) {
          if (c.nodeIds.includes(cardId)) return c;
          return { ...c, nodeIds: [...c.nodeIds, cardId] };
        }
        return c;
      }),
    };
    setLocalLayout(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    setActiveColumnId(null);

    if (!displayLayout) return;
    const { active, over } = event;
    if (!over) {
      if (localLayout) void setKanbanLayout(localLayout);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("col:") && overId.startsWith("col:")) {
      const aId = activeId.slice(4);
      const oId = overId.slice(4);
      if (aId === oId) return;
      const aIdx = displayLayout.columns.findIndex((c) => c.id === aId);
      const oIdx = displayLayout.columns.findIndex((c) => c.id === oId);
      if (aIdx < 0 || oIdx < 0) return;
      const next: KanbanLayout = { columns: arrayMove(displayLayout.columns, aIdx, oIdx) };
      persist(next);
      return;
    }

    if (activeId.startsWith("card:")) {
      const cardId = activeId.slice(5);
      const fromColumn = findContainer(displayLayout, cardId);
      if (!fromColumn) return;

      let toColumn: string | null = null;
      let toIndex: number | null = null;

      if (overId.startsWith("col:")) {
        toColumn = overId.slice(4);
        const target = displayLayout.columns.find((c) => c.id === toColumn);
        toIndex = target ? target.nodeIds.length : 0;
      } else if (overId.startsWith("card:")) {
        const overCardId = overId.slice(5);
        toColumn = findContainer(displayLayout, overCardId);
        if (toColumn) {
          const target = displayLayout.columns.find((c) => c.id === toColumn);
          toIndex = target ? target.nodeIds.indexOf(overCardId) : 0;
        }
      } else if (overId.startsWith("dropzone:")) {
        toColumn = overId.slice(9);
        const target = displayLayout.columns.find((c) => c.id === toColumn);
        toIndex = target ? target.nodeIds.length : 0;
      }

      if (!toColumn || toIndex === null) return;

      const next: KanbanLayout = {
        columns: displayLayout.columns.map((c) => {
          if (c.id !== fromColumn && c.id !== toColumn) return c;
          if (fromColumn === toColumn && c.id === fromColumn) {
            const ids = c.nodeIds.filter((id) => id !== cardId);
            const clampedIdx = Math.min(Math.max(toIndex!, 0), ids.length);
            ids.splice(clampedIdx, 0, cardId);
            return { ...c, nodeIds: ids };
          }
          if (c.id === fromColumn) {
            return { ...c, nodeIds: c.nodeIds.filter((id) => id !== cardId) };
          }
          if (c.id === toColumn) {
            const ids = c.nodeIds.filter((id) => id !== cardId);
            const clampedIdx = Math.min(Math.max(toIndex!, 0), ids.length);
            ids.splice(clampedIdx, 0, cardId);
            return { ...c, nodeIds: ids };
          }
          return c;
        }),
      };
      persist(next);
    }
  };

  const loading = !nodes || !displayLayout;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  const columns = displayLayout.columns;
  const activeCardNode = activeCardId ? nodeMap.get(activeCardId) : null;
  const activeColumn = activeColumnId ? columns.find((c) => c.id === activeColumnId) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        >
          <div className="flex gap-3 items-start h-full px-4 pb-4">
            <SortableContext
              items={columns.map((c) => `col:${c.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  canEdit={canEdit}
                  nodeMap={nodeMap}
                  onRename={(title) => renameColumn(col.id, title)}
                  onDelete={() => deleteColumn(col.id)}
                  onRemoveCard={(nodeId) => removeCard(col.id, nodeId)}
                  onAddItem={() => setAddItemColumnId(col.id)}
                />
              ))}
            </SortableContext>

            {canEdit && (
              <button
                onClick={addColumn}
                className="flex-shrink-0 w-72 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-3 py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-white/50 dark:hover:bg-gray-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add column
              </button>
            )}
          </div>

          <DragOverlay>
            {activeCardNode ? (
              <div className="w-72">
                <KanbanCard node={activeCardNode} dragging />
              </div>
            ) : activeColumn ? (
              <div className="opacity-90">
                <KanbanColumn
                  column={activeColumn}
                  canEdit={false}
                  nodeMap={nodeMap}
                  onRename={() => {}}
                  onDelete={() => {}}
                  onRemoveCard={() => {}}
                  onAddItem={() => {}}
                  overlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {addItemColumnId && (
        <KanbanAddItemDialog
          open={true}
          onClose={() => setAddItemColumnId(null)}
          nodes={nodes ?? []}
          onBoardNodeIds={onBoardIds}
          onAddExisting={(ids) => {
            addToColumn(addItemColumnId, ids);
            setAddItemColumnId(null);
          }}
          onCreateNew={(nodeId) => {
            addToColumn(addItemColumnId, [nodeId]);
            setAddItemColumnId(null);
          }}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

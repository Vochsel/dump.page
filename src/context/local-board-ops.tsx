"use client";

import { ReactNode, useState, useCallback, useEffect, useRef } from "react";
import { BoardOpsContext, BoardOps, BoardNode, BoardEdge, KanbanLayout } from "./board-ops-context";

const STORAGE_KEY = "dump-local-board";
const EDGES_STORAGE_KEY = "dump-local-board-edges";
const KANBAN_STORAGE_KEY = "dump-local-board-kanban";

function loadNodes(): BoardNode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNodes(nodes: BoardNode[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  } catch {
    // localStorage full or unavailable
  }
}

function loadEdges(): BoardEdge[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EDGES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveEdges(edges: BoardEdge[]) {
  try {
    localStorage.setItem(EDGES_STORAGE_KEY, JSON.stringify(edges));
  } catch {
    // localStorage full or unavailable
  }
}

function loadKanban(): KanbanLayout {
  if (typeof window === "undefined") return { columns: [] };
  try {
    const raw = localStorage.getItem(KANBAN_STORAGE_KEY);
    if (!raw) return { columns: [] };
    return JSON.parse(raw);
  } catch {
    return { columns: [] };
  }
}

function saveKanban(layout: KanbanLayout) {
  try {
    localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearLocalBoard() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function LocalBoardOpsProvider({ children, seedNodes }: { children: ReactNode; seedNodes?: Omit<BoardNode, "_id" | "boardId">[] }) {
  const [nodes, setNodes] = useState<BoardNode[]>(() => {
    const existing = loadNodes();
    if (existing.length > 0) return existing;
    if (!seedNodes || seedNodes.length === 0) return [];
    return seedNodes.map((n) => ({
      _id: crypto.randomUUID(),
      boardId: "local",
      ...n,
    }));
  });
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const [edges, setEdges] = useState<BoardEdge[]>(() => loadEdges());
  const [kanbanLayout, setKanbanLayoutState] = useState<KanbanLayout>(() => loadKanban());

  // Persist on change
  useEffect(() => {
    saveNodes(nodes);
  }, [nodes]);

  useEffect(() => {
    saveEdges(edges);
  }, [edges]);

  useEffect(() => {
    saveKanban(kanbanLayout);
  }, [kanbanLayout]);

  const createNode: BoardOps["createNode"] = useCallback(async (args) => {
    const id = crypto.randomUUID();
    const node: BoardNode = {
      _id: id,
      boardId: "local",
      type: args.type,
      content: args.content,
      title: undefined,
      position: args.position,
      metadata: args.metadata,
    };
    setNodes((prev) => [...prev, node]);
    return id;
  }, []);

  const updateNode: BoardOps["updateNode"] = useCallback(async (args) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n._id !== args.nodeId) return n;
        return {
          ...n,
          ...(args.content !== undefined ? { content: args.content } : {}),
          ...(args.title !== undefined ? { title: args.title } : {}),
          ...(args.showTitle !== undefined ? { showTitle: args.showTitle } : {}),
          ...(args.collapsed !== undefined ? { collapsed: args.collapsed } : {}),
          ...(args.archived !== undefined ? { archived: args.archived } : {}),
          ...(args.docPosition !== undefined ? { docPosition: args.docPosition } : {}),
          ...(args.metadata !== undefined ? { metadata: args.metadata } : {}),
        };
      })
    );
    return null;
  }, []);

  const updateNodePosition: BoardOps["updateNodePosition"] = useCallback(async (args) => {
    setNodes((prev) =>
      prev.map((n) =>
        n._id === args.nodeId ? { ...n, position: args.position } : n
      )
    );
    return null;
  }, []);

  const deleteNode: BoardOps["deleteNode"] = useCallback(async (args) => {
    setNodes((prev) => prev.filter((n) => n._id !== args.nodeId));
    // Cascade-delete edges referencing this node
    setEdges((prev) => prev.filter((e) => e.source !== args.nodeId && e.target !== args.nodeId));
    return null;
  }, []);

  const createEdge: BoardOps["createEdge"] = useCallback(async (args) => {
    const id = crypto.randomUUID();
    const edge: BoardEdge = {
      _id: id,
      boardId: "local",
      source: args.source,
      target: args.target,
    };
    setEdges((prev) => [...prev, edge]);
    return id;
  }, []);

  const updateEdge: BoardOps["updateEdge"] = useCallback(async (args) => {
    setEdges((prev) =>
      prev.map((e) => {
        if (e._id !== args.edgeId) return e;
        return {
          ...e,
          ...(args.label !== undefined ? { label: args.label } : {}),
        };
      })
    );
    return null;
  }, []);

  const deleteEdge: BoardOps["deleteEdge"] = useCallback(async (args) => {
    setEdges((prev) => prev.filter((e) => e._id !== args.edgeId));
    return null;
  }, []);

  const fetchLinkMetadata: BoardOps["fetchLinkMetadata"] = useCallback(async (args) => {
    try {
      const res = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(args.url)}`);
      if (!res.ok) {
        setNodes((prev) =>
          prev.map((n) => (n._id === args.nodeId ? { ...n, metadata: {} } : n))
        );
        return;
      }
      const metadata = await res.json();
      setNodes((prev) =>
        prev.map((n) => (n._id === args.nodeId ? { ...n, metadata } : n))
      );
    } catch {
      setNodes((prev) =>
        prev.map((n) => (n._id === args.nodeId ? { ...n, metadata: {} } : n))
      );
    }
  }, []);

  const setKanbanLayout: BoardOps["setKanbanLayout"] = useCallback(async (layout) => {
    setKanbanLayoutState(layout);
  }, []);

  const ops: BoardOps = {
    nodes,
    boardId: "local",
    createNode,
    updateNode,
    updateNodePosition,
    deleteNode,
    fetchLinkMetadata,
    edges,
    createEdge,
    updateEdge,
    deleteEdge,
    kanbanLayout,
    setKanbanLayout,
  };

  return (
    <BoardOpsContext.Provider value={ops}>
      {children}
    </BoardOpsContext.Provider>
  );
}

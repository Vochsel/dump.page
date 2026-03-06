"use client";

import { ReactNode, useState, useCallback, useEffect, useRef } from "react";
import { BoardOpsContext, BoardOps, BoardNode } from "./board-ops-context";

const STORAGE_KEY = "dump-local-board";

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

export function clearLocalBoard() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function LocalBoardOpsProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<BoardNode[]>(() => loadNodes());
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Persist on change
  useEffect(() => {
    saveNodes(nodes);
  }, [nodes]);

  const createNode: BoardOps["createNode"] = useCallback(async (args) => {
    const id = crypto.randomUUID();
    const node: BoardNode = {
      _id: id,
      boardId: "local",
      type: args.type,
      content: args.content,
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

  const ops: BoardOps = {
    nodes,
    boardId: "local",
    createNode,
    updateNode,
    updateNodePosition,
    deleteNode,
    fetchLinkMetadata,
  };

  return (
    <BoardOpsContext.Provider value={ops}>
      {children}
    </BoardOpsContext.Provider>
  );
}

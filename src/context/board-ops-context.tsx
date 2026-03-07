"use client";

import { createContext, useContext } from "react";

export type Position = { x: number; y: number };

export type Metadata = {
  title?: string;
  favicon?: string;
  description?: string;
  image?: string;
};

export type BoardNode = {
  _id: string;
  boardId: string;
  type: "text" | "link" | "checklist";
  content: string;
  title?: string;
  showTitle?: boolean;
  collapsed?: boolean;
  position: Position;
  docPosition?: Position;
  metadata?: Metadata;
};

export interface BoardOps {
  nodes: BoardNode[] | undefined;
  boardId: string;
  createNode: (args: {
    boardId: string;
    type: "text" | "link" | "checklist";
    content: string;
    position: Position;
    metadata?: Metadata;
  }) => Promise<string>;
  updateNode: (args: {
    nodeId: string;
    content?: string;
    title?: string;
    showTitle?: boolean;
    collapsed?: boolean;
    archived?: boolean;
    docPosition?: Position;
    metadata?: Metadata;
  }) => Promise<null>;
  updateNodePosition: (args: {
    nodeId: string;
    position: Position;
  }) => Promise<null>;
  deleteNode: (args: { nodeId: string }) => Promise<null>;
  fetchLinkMetadata: (args: { nodeId: string; url: string }) => Promise<void>;
}

export const BoardOpsContext = createContext<BoardOps | null>(null);

export function useBoardOps(): BoardOps {
  const ctx = useContext(BoardOpsContext);
  if (!ctx) throw new Error("useBoardOps must be used within a BoardOpsProvider");
  return ctx;
}

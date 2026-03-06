import { useCallback, useRef, useState } from "react";
import type { Position, Metadata, BoardNode } from "@/context/board-ops-context";

type NodeSnapshot = {
  boardId: string;
  type: "text" | "link" | "checklist";
  content: string;
  position: Position;
  metadata?: Metadata;
};

export type UndoAction =
  | { type: "create"; nodeId: string }
  | { type: "delete"; deletedNodeId: string; snapshot: NodeSnapshot }
  | { type: "move"; nodeId: string; oldPosition: Position; newPosition: Position }
  | { type: "edit"; nodeId: string; oldContent: string; newContent: string; oldMetadata?: Metadata; newMetadata?: Metadata };

const MAX_HISTORY = 50;

interface UseUndoRedoArgs {
  convexNodes: BoardNode[] | undefined;
  createNode: (args: {
    boardId: string;
    type: "text" | "link" | "checklist";
    content: string;
    position: Position;
    metadata?: Metadata;
  }) => Promise<string>;
  deleteNode: (args: { nodeId: string }) => Promise<null>;
  updateNode: (args: { nodeId: string; content?: string; metadata?: Metadata }) => Promise<null>;
  updateNodePosition: (args: { nodeId: string; position: Position }) => Promise<null>;
}

export function useUndoRedo({
  convexNodes,
  createNode,
  deleteNode,
  updateNode,
  updateNodePosition,
}: UseUndoRedoArgs) {
  const [past, setPast] = useState<UndoAction[]>([]);
  const [future, setFuture] = useState<UndoAction[]>([]);
  const isExecutingRef = useRef(false);

  const pushAction = useCallback((action: UndoAction) => {
    setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), action]);
    setFuture([]);
  }, []);

  const undo = useCallback(async () => {
    if (isExecutingRef.current || past.length === 0) return;
    isExecutingRef.current = true;

    const action = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));

    try {
      switch (action.type) {
        case "create": {
          const node = convexNodes?.find((n) => n._id === action.nodeId);
          if (!node) break;
          const snapshot: NodeSnapshot = {
            boardId: node.boardId,
            type: node.type,
            content: node.content,
            position: node.position,
            metadata: node.metadata,
          };
          await deleteNode({ nodeId: action.nodeId });
          setFuture((prev) => [...prev, { type: "delete", deletedNodeId: action.nodeId, snapshot }]);
          break;
        }
        case "delete": {
          const newId = await createNode({
            boardId: action.snapshot.boardId,
            type: action.snapshot.type,
            content: action.snapshot.content,
            position: action.snapshot.position,
            metadata: action.snapshot.metadata,
          });
          setFuture((prev) => [...prev, { type: "create", nodeId: newId }]);
          break;
        }
        case "move": {
          await updateNodePosition({ nodeId: action.nodeId, position: action.oldPosition });
          setFuture((prev) => [...prev, {
            type: "move",
            nodeId: action.nodeId,
            oldPosition: action.newPosition,
            newPosition: action.oldPosition,
          }]);
          break;
        }
        case "edit": {
          const updateArgs: { nodeId: string; content?: string; metadata?: Metadata } = {
            nodeId: action.nodeId,
          };
          if (action.oldContent !== action.newContent) {
            updateArgs.content = action.oldContent;
          }
          if (action.oldMetadata !== undefined) {
            updateArgs.metadata = action.oldMetadata;
          }
          await updateNode(updateArgs);
          setFuture((prev) => [...prev, {
            type: "edit",
            nodeId: action.nodeId,
            oldContent: action.newContent,
            newContent: action.oldContent,
            oldMetadata: action.newMetadata,
            newMetadata: action.oldMetadata,
          }]);
          break;
        }
      }
    } catch {
      // Node may have been deleted by collaborator — silently skip
    } finally {
      isExecutingRef.current = false;
    }
  }, [past, convexNodes, createNode, deleteNode, updateNode, updateNodePosition]);

  const redo = useCallback(async () => {
    if (isExecutingRef.current || future.length === 0) return;
    isExecutingRef.current = true;

    const action = future[future.length - 1];
    setFuture((prev) => prev.slice(0, -1));

    try {
      switch (action.type) {
        case "create": {
          const node = convexNodes?.find((n) => n._id === action.nodeId);
          if (!node) break;
          const snapshot: NodeSnapshot = {
            boardId: node.boardId,
            type: node.type,
            content: node.content,
            position: node.position,
            metadata: node.metadata,
          };
          await deleteNode({ nodeId: action.nodeId });
          setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { type: "delete", deletedNodeId: action.nodeId, snapshot }]);
          break;
        }
        case "delete": {
          const newId = await createNode({
            boardId: action.snapshot.boardId,
            type: action.snapshot.type,
            content: action.snapshot.content,
            position: action.snapshot.position,
            metadata: action.snapshot.metadata,
          });
          setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), { type: "create", nodeId: newId }]);
          break;
        }
        case "move": {
          await updateNodePosition({ nodeId: action.nodeId, position: action.oldPosition });
          setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), {
            type: "move",
            nodeId: action.nodeId,
            oldPosition: action.newPosition,
            newPosition: action.oldPosition,
          }]);
          break;
        }
        case "edit": {
          const updateArgs: { nodeId: string; content?: string; metadata?: Metadata } = {
            nodeId: action.nodeId,
          };
          if (action.oldContent !== action.newContent) {
            updateArgs.content = action.oldContent;
          }
          if (action.oldMetadata !== undefined) {
            updateArgs.metadata = action.oldMetadata;
          }
          await updateNode(updateArgs);
          setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), {
            type: "edit",
            nodeId: action.nodeId,
            oldContent: action.newContent,
            newContent: action.oldContent,
            oldMetadata: action.newMetadata,
            newMetadata: action.oldMetadata,
          }]);
          break;
        }
      }
    } catch {
      // Silently skip failed operations
    } finally {
      isExecutingRef.current = false;
    }
  }, [future, convexNodes, createNode, deleteNode, updateNode, updateNodePosition]);

  return {
    pushAction,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

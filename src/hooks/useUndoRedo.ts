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
  | { type: "edit"; nodeId: string; oldContent: string; newContent: string; oldMetadata?: Metadata; newMetadata?: Metadata }
  | { type: "createEdge"; edgeId: string; source: string; target: string }
  | { type: "deleteEdge"; edgeId: string; source: string; target: string }
  | { type: "batch"; actions: UndoAction[] };

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
  boardId: string;
  createEdge: (args: { boardId: string; source: string; target: string }) => Promise<string>;
  deleteEdge: (args: { edgeId: string }) => Promise<null>;
}

export function useUndoRedo({
  convexNodes,
  createNode,
  deleteNode,
  updateNode,
  updateNodePosition,
  boardId,
  createEdge,
  deleteEdge,
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
      const reverseAction = await executeUndo(action);
      if (reverseAction) {
        setFuture((prev) => [...prev, reverseAction]);
      }
    } catch {
      // Node may have been deleted by collaborator — silently skip
    } finally {
      isExecutingRef.current = false;
      // Blur any focused input so subsequent Cmd+Z continues canvas undo
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [past, convexNodes, createNode, deleteNode, updateNode, updateNodePosition]);

  const executeUndo = useCallback(async (action: UndoAction): Promise<UndoAction | null> => {
    switch (action.type) {
      case "create": {
        const node = convexNodes?.find((n) => n._id === action.nodeId);
        if (!node) return null;
        const snapshot: NodeSnapshot = {
          boardId: node.boardId,
          type: node.type,
          content: node.content,
          position: node.position,
          metadata: node.metadata,
        };
        await deleteNode({ nodeId: action.nodeId });
        return { type: "delete", deletedNodeId: action.nodeId, snapshot };
      }
      case "delete": {
        const newId = await createNode({
          boardId: action.snapshot.boardId,
          type: action.snapshot.type,
          content: action.snapshot.content,
          position: action.snapshot.position,
          metadata: action.snapshot.metadata,
        });
        return { type: "create", nodeId: newId };
      }
      case "move": {
        await updateNodePosition({ nodeId: action.nodeId, position: action.oldPosition });
        return {
          type: "move",
          nodeId: action.nodeId,
          oldPosition: action.newPosition,
          newPosition: action.oldPosition,
        };
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
        // Fire-and-forget: edit undo is optimistic — local state updates
        // via Convex reactive query, mutation runs in background
        updateNode(updateArgs);
        return {
          type: "edit",
          nodeId: action.nodeId,
          oldContent: action.newContent,
          newContent: action.oldContent,
          oldMetadata: action.newMetadata,
          newMetadata: action.oldMetadata,
        };
      }
      case "createEdge": {
        await deleteEdge({ edgeId: action.edgeId });
        return { type: "deleteEdge", edgeId: action.edgeId, source: action.source, target: action.target };
      }
      case "deleteEdge": {
        const newEdgeId = await createEdge({ boardId, source: action.source, target: action.target });
        return { type: "createEdge", edgeId: newEdgeId, source: action.source, target: action.target };
      }
      case "batch": {
        const reverseActions: UndoAction[] = [];
        for (const sub of action.actions) {
          const rev = await executeUndo(sub);
          if (rev) reverseActions.push(rev);
        }
        return { type: "batch", actions: reverseActions.reverse() };
      }
    }
  }, [convexNodes, createNode, deleteNode, updateNode, updateNodePosition, boardId, createEdge, deleteEdge]);

  const redo = useCallback(async () => {
    if (isExecutingRef.current || future.length === 0) return;
    isExecutingRef.current = true;

    const action = future[future.length - 1];
    setFuture((prev) => prev.slice(0, -1));

    try {
      // Redo is just undoing the reverse action
      const reverseAction = await executeUndo(action);
      if (reverseAction) {
        setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), reverseAction]);
      }
    } catch {
      // Silently skip failed operations
    } finally {
      isExecutingRef.current = false;
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [future, executeUndo]);

  return {
    pushAction,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

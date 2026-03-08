"use client";

import { ReactNode, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { BoardOpsContext, BoardOps, BoardNode } from "./board-ops-context";

interface ConvexBoardOpsProviderProps {
  boardId: Id<"boards">;
  shareToken?: string;
  children: ReactNode;
}

export function ConvexBoardOpsProvider({ boardId, shareToken, children }: ConvexBoardOpsProviderProps) {
  const convexNodes = useQuery(api.nodes.getNodesByBoard, { boardId, shareToken });
  const createNodeMutation = useMutation(api.nodes.createNode);
  const updateNodeMutation = useMutation(api.nodes.updateNode);
  const updateNodePositionMutation = useMutation(api.nodes.updateNodePosition);
  const deleteNodeMutation = useMutation(api.nodes.deleteNode);
  const fetchMetadataMutation = useMutation(api.nodes.requestFetchLinkMetadata);

  const nodes: BoardNode[] | undefined = useMemo(() => {
    if (!convexNodes) return undefined;
    return convexNodes.map((n) => ({
      _id: n._id as string,
      boardId: n.boardId as string,
      type: n.type,
      content: n.content,
      title: n.title,
      showTitle: n.showTitle,
      collapsed: n.collapsed,
      position: n.position,
      docPosition: n.docPosition,
      metadata: n.metadata,
    }));
  }, [convexNodes]);

  const ops: BoardOps = useMemo(
    () => ({
      nodes,
      boardId: boardId as string,
      createNode: async (args) => {
        const id = await createNodeMutation({
          boardId: args.boardId as Id<"boards">,
          type: args.type,
          content: args.content,
          position: args.position,
          metadata: args.metadata,
        });
        return id as string;
      },
      updateNode: async (args) => {
        await updateNodeMutation({
          nodeId: args.nodeId as Id<"nodes">,
          content: args.content,
          title: args.title,
          showTitle: args.showTitle,
          collapsed: args.collapsed,
          archived: args.archived,
          docPosition: args.docPosition,
          metadata: args.metadata,
        });
        return null;
      },
      updateNodePosition: async (args) => {
        await updateNodePositionMutation({
          nodeId: args.nodeId as Id<"nodes">,
          position: args.position,
        });
        return null;
      },
      deleteNode: async (args) => {
        await deleteNodeMutation({
          nodeId: args.nodeId as Id<"nodes">,
        });
        return null;
      },
      fetchLinkMetadata: async (args) => {
        await fetchMetadataMutation({
          nodeId: args.nodeId as Id<"nodes">,
          url: args.url,
        });
      },
    }),
    [nodes, boardId, createNodeMutation, updateNodeMutation, updateNodePositionMutation, deleteNodeMutation, fetchMetadataMutation]
  );

  return (
    <BoardOpsContext.Provider value={ops}>
      {children}
    </BoardOpsContext.Provider>
  );
}

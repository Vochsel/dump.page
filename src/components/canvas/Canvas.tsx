"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  SelectionMode,
  Node,
  NodeChange,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import type { BoardSettingsData } from "@/components/board/BoardSettings";
import "@xyflow/react/dist/style.css";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TextNode } from "./TextNode";
import { LinkNode } from "./LinkNode";
import { Toolbar } from "./Toolbar";

import { darkenHex } from "@/lib/utils";

const nodeTypes: NodeTypes = {
  text: TextNode,
  link: LinkNode,
};

const URL_REGEX = /^https?:\/\/.+/i;
const LOOSE_URL_REGEX = /^(https?:\/\/|www\.)\S+\.\S+/i;

interface CanvasInnerProps {
  boardId: Id<"boards">;
  canEdit: boolean;
  settings: BoardSettingsData;
}

function CanvasInner({ boardId, canEdit, settings }: CanvasInnerProps) {
  const convexNodes = useQuery(api.nodes.getNodesByBoard, { boardId });
  const updateNodePosition = useMutation(api.nodes.updateNodePosition);
  const createNode = useMutation(api.nodes.createNode);
  const fetchMetadata = useAction(api.nodes.fetchLinkMetadata);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Local node state for optimistic updates
  const [localNodes, setLocalNodes] = useState<Node[]>([]);

  // Sync from Convex → local, but preserve positions of nodes being dragged
  const draggingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!convexNodes) return;
    setLocalNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return convexNodes.map((n) => {
        const existing = prevMap.get(n._id);
        // If currently dragging this node, keep local position
        const position = draggingRef.current.has(n._id) && existing
          ? existing.position
          : n.position;
        return {
          id: n._id,
          type: n.type,
          position,
          data: {
            content: n.content,
            nodeId: n._id,
            canEdit,
            metadata: n.metadata,
            metadataLoading: n.type === "link" && n.metadata === undefined,
          },
        };
      });
    });
  }, [convexNodes, canEdit]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!canEdit) return;

      setLocalNodes((nds) => {
        let updated = [...nds];
        for (const change of changes) {
          if (change.type === "position") {
            if (change.dragging) {
              draggingRef.current.add(change.id);
            }
            if (change.position) {
              updated = updated.map((n) =>
                n.id === change.id ? { ...n, position: change.position! } : n
              );
            }
            // On drag end, persist to Convex
            if (change.dragging === false && change.position) {
              draggingRef.current.delete(change.id);
              updateNodePosition({
                nodeId: change.id as Id<"nodes">,
                position: { x: change.position.x, y: change.position.y },
              });
            }
          } else if (change.type === "dimensions" && change.dimensions) {
            updated = updated.map((n) =>
              n.id === change.id
                ? { ...n, measured: { ...n.measured, ...change.dimensions } }
                : n
            );
          } else if (change.type === "select") {
            updated = updated.map((n) =>
              n.id === change.id ? { ...n, selected: change.selected } : n
            );
          }
        }
        return updated;
      });
    },
    [canEdit, updateNodePosition]
  );

  // Track mouse position for paste
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Paste handler: detect URL vs text, create node at mouse position
  useEffect(() => {
    if (!canEdit) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste when editing a text input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;

      e.preventDefault();

      const pos = screenToFlowPosition(mousePosRef.current);
      const isUrl = URL_REGEX.test(text) || LOOSE_URL_REGEX.test(text);

      if (isUrl) {
        let url = text;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
        }
        createNode({
          boardId,
          type: "link",
          content: url,
          position: { x: pos.x - 140, y: pos.y - 30 },
        }).then((nodeId) => {
          fetchMetadata({ nodeId, url });
        });
      } else {
        createNode({
          boardId,
          type: "text",
          content: text,
          position: { x: pos.x - 120, y: pos.y - 40 },
        });
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [canEdit, boardId, createNode, fetchMetadata, screenToFlowPosition]);

  // "f" key: fit selected nodes, or all nodes if none selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;
      if (e.key !== "f") return;

      const selected = localNodes.filter((n) => n.selected);
      if (selected.length > 0) {
        fitView({ nodes: selected, padding: 0.5, duration: 300 });
      } else {
        fitView({ padding: 0.5, duration: 300 });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [localNodes, fitView]);

  const bgPattern = settings.backgroundPattern ?? "dots";
  const bgColor = settings.backgroundColor ?? "#f9fafb";
  const controlsVariant = settings.controlsVariant ?? "default";

  const lineColor = darkenHex(bgColor, 0.08);
  const lineColorFaint = darkenHex(bgColor, 0.05);

  const renderBackground = () => {
    if (bgPattern === "dots") {
      return <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color={lineColor} />;
    }
    if (bgPattern === "paper") {
      return (
        <>
          <Background id="minor" variant={BackgroundVariant.Lines} gap={10} size={0.5} color={lineColorFaint} />
          <Background id="major" variant={BackgroundVariant.Lines} gap={50} size={1} color={lineColor} />
        </>
      );
    }
    if (bgPattern === "boxes") {
      return <Background variant={BackgroundVariant.Lines} gap={20} size={0.5} color={lineColor} />;
    }
    return null; // "blank"
  };

  return (
    <div className="w-full h-full relative" onMouseMove={onMouseMove}>
      <ReactFlow
        nodes={localNodes}
        edges={[]}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={canEdit}
        nodesConnectable={false}
        selectionMode={SelectionMode.Partial}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        minZoom={0.1}
        maxZoom={2}
        panOnScroll={controlsVariant === "default"}
        zoomOnScroll={controlsVariant !== "default"}
        proOptions={{ hideAttribution: true }}
        style={{ backgroundColor: bgColor }}
      >
        {renderBackground()}
        {controlsVariant === "default" && <Controls />}
        {canEdit && <Toolbar boardId={boardId} />}
      </ReactFlow>
    </div>
  );
}

interface CanvasProps {
  boardId: Id<"boards">;
  canEdit: boolean;
  settings?: BoardSettingsData;
}

export function Canvas({ boardId, canEdit, settings = {} }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner boardId={boardId} canEdit={canEdit} settings={settings} />
    </ReactFlowProvider>
  );
}

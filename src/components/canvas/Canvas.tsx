"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  SelectionMode,
  Node,
  NodeChange,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import type { BoardSettingsData } from "@/components/board/BoardSettings";
import "@xyflow/react/dist/style.css";
import { TextNode } from "./TextNode";
import { LinkNode } from "./LinkNode";
import { ChecklistNode } from "./ChecklistNode";
import { Toolbar } from "./Toolbar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Type, Link, Plus, CheckSquare, Copy, CopyPlus, Trash2, Upload, Pencil, Volume2, VolumeOff } from "lucide-react";

import { darkenHex } from "@/lib/utils";
import { useUndoRedo, UndoAction } from "@/hooks/useUndoRedo";
import { useBoardOps } from "@/context/board-ops-context";
import { sfx } from "@/lib/sfx";

const nodeTypes: NodeTypes = {
  text: TextNode,
  link: LinkNode,
  checklist: ChecklistNode,
};

const URL_REGEX = /^https?:\/\/.+/i;
const LOOSE_URL_REGEX = /^(https?:\/\/|www\.)\S+\.\S+/i;

interface CanvasInnerProps {
  canEdit: boolean;
  settings: BoardSettingsData;
}

function CanvasInner({ canEdit, settings }: CanvasInnerProps) {
  const { nodes: boardNodes, boardId, createNode, updateNode, updateNodePosition, deleteNode, fetchLinkMetadata: fetchMetadata } = useBoardOps();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const mousePosRef = useRef({ x: 0, y: 0 });
  const contextMenuPosRef = useRef({ x: 0, y: 0 });

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Mute state
  const [isMuted, setIsMuted] = useState(() => sfx.isMuted());

  // Node context menu state
  const [nodeMenu, setNodeMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);

  // Rename dialog state
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Undo/Redo
  const { pushAction, undo, redo, canUndo, canRedo } = useUndoRedo({
    convexNodes: boardNodes,
    createNode,
    deleteNode,
    updateNode,
    updateNodePosition,
  });

  // Track optimistically deleted node IDs so they stay hidden until server catches up
  const [optimisticDeletes, setOptimisticDeletes] = useState<Set<string>>(new Set());

  const deleteNodeWithUndo = useCallback(
    (nodeId: string) => {
      const node = boardNodes?.find((n) => n._id === nodeId);
      if (!node) {
        deleteNode({ nodeId });
        return;
      }
      pushAction({
        type: "delete",
        deletedNodeId: nodeId,
        snapshot: {
          boardId: node.boardId,
          type: node.type,
          content: node.content,
          position: node.position,
          metadata: node.metadata,
        },
      });
      sfx.delete();
      // Optimistically remove from UI
      setOptimisticDeletes((prev) => new Set(prev).add(nodeId));
      setLocalNodes((prev) => prev.filter((n) => n.id !== nodeId));
      // Fire and forget — server sync will confirm
      deleteNode({ nodeId }).finally(() => {
        setOptimisticDeletes((prev) => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      });
    },
    [boardNodes, deleteNode, pushAction]
  );

  // Local node state for optimistic updates
  const [localNodes, setLocalNodes] = useState<Node[]>([]);

  // Sync from source → local, but preserve positions of nodes being dragged
  const draggingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!boardNodes) return;
    setLocalNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return boardNodes.filter((n) => !optimisticDeletes.has(n._id)).map((n) => {
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
            pushAction,
            deleteNodeWithUndo,
          },
        };
      });
    });
  }, [boardNodes, canEdit, pushAction, deleteNodeWithUndo, optimisticDeletes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!canEdit) return;

      setLocalNodes((nds) => {
        let updated = [...nds];
        for (const change of changes) {
          if (change.type === "position") {
            if (change.dragging && !draggingRef.current.has(change.id)) {
              sfx.dragStart();
            }
            if (change.dragging) {
              draggingRef.current.add(change.id);
            }
            if (change.position) {
              updated = updated.map((n) =>
                n.id === change.id ? { ...n, position: change.position! } : n
              );
            }
            // On drag end, persist
            if (change.dragging === false && change.position) {
              draggingRef.current.delete(change.id);
              sfx.dragEnd();
              const nodeId = change.id;
              const sourceNode = boardNodes?.find((n) => n._id === nodeId);
              const oldPosition = sourceNode?.position ?? change.position;
              const newPosition = { x: change.position.x, y: change.position.y };
              pushAction({
                type: "move",
                nodeId,
                oldPosition: { x: oldPosition.x, y: oldPosition.y },
                newPosition,
              });
              updateNodePosition({ nodeId, position: newPosition });
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
    [canEdit, updateNodePosition, boardNodes, pushAction]
  );

  // Drag-and-drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

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
          pushAction({ type: "create", nodeId });
          sfx.add();
          fetchMetadata({ nodeId, url });
        });
      } else {
        createNode({
          boardId,
          type: "text",
          content: text,
          position: { x: pos.x - 120, y: pos.y - 40 },
        }).then((nodeId) => {
          pushAction({ type: "create", nodeId });
          sfx.add();
        });
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [canEdit, boardId, createNode, fetchMetadata, screenToFlowPosition, pushAction]);

  // Drag-and-drop handlers for external files and links
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      if (!canEdit) return;

      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      // Check for dropped URL (from browser address bar, bookmark, or link drag)
      const uriList = e.dataTransfer.getData("text/uri-list");
      const plainText = e.dataTransfer.getData("text/plain")?.trim();

      if (uriList) {
        // text/uri-list can contain multiple URLs separated by newlines
        const urls = uriList.split("\n").filter((line) => line.trim() && !line.startsWith("#"));
        let offsetY = 0;
        for (const rawUrl of urls) {
          const url = rawUrl.trim();
          if (!url) continue;
          const nodePos = { x: pos.x - 140, y: pos.y - 30 + offsetY };
          createNode({
            boardId,
            type: "link",
            content: url,
            position: nodePos,
          }).then((nodeId) => {
            pushAction({ type: "create", nodeId });
            sfx.add();
            fetchMetadata({ nodeId, url });
          });
          offsetY += 80;
        }
        return;
      }

      // Check for dropped files (.txt, .md, .markdown)
      const files = Array.from(e.dataTransfer.files);
      const textFiles = files.filter((f) => {
        const name = f.name.toLowerCase();
        return (
          name.endsWith(".txt") ||
          name.endsWith(".md") ||
          name.endsWith(".markdown") ||
          f.type === "text/plain" ||
          f.type === "text/markdown"
        );
      });

      if (textFiles.length > 0) {
        let offsetY = 0;
        for (const file of textFiles) {
          const text = await file.text();
          if (!text.trim()) continue;
          const nodePos = { x: pos.x - 120, y: pos.y - 40 + offsetY };
          const nodeId = await createNode({
            boardId,
            type: "text",
            content: text,
            position: nodePos,
          });
          pushAction({ type: "create", nodeId });
          sfx.add();
          offsetY += 120;
        }
        return;
      }

      // Fallback: plain text that looks like a URL
      if (plainText && (URL_REGEX.test(plainText) || LOOSE_URL_REGEX.test(plainText))) {
        let url = plainText;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
        }
        createNode({
          boardId,
          type: "link",
          content: url,
          position: { x: pos.x - 140, y: pos.y - 30 },
        }).then((nodeId) => {
          pushAction({ type: "create", nodeId });
          sfx.add();
          fetchMetadata({ nodeId, url });
        });
        return;
      }

      // Fallback: plain text (non-URL)
      if (plainText) {
        createNode({
          boardId,
          type: "text",
          content: plainText,
          position: { x: pos.x - 120, y: pos.y - 40 },
        }).then((nodeId) => {
          pushAction({ type: "create", nodeId });
          sfx.add();
        });
      }
    },
    [canEdit, boardId, createNode, fetchMetadata, screenToFlowPosition, pushAction]
  );

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

  // Cmd+Z / Cmd+Shift+Z for undo/redo
  useEffect(() => {
    if (!canEdit) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, undo, redo]);

  // Context menu handlers
  const addTextNodeAtCursor = useCallback(() => {
    const pos = screenToFlowPosition(contextMenuPosRef.current);
    createNode({
      boardId,
      type: "text",
      content: "",
      position: { x: pos.x - 90, y: pos.y - 20 },
    }).then((nodeId) => { pushAction({ type: "create", nodeId }); sfx.add(); });
  }, [boardId, createNode, screenToFlowPosition, pushAction]);

  const addChecklistNodeAtCursor = useCallback(() => {
    const pos = screenToFlowPosition(contextMenuPosRef.current);
    createNode({
      boardId,
      type: "checklist",
      content: "[]",
      position: { x: pos.x - 110, y: pos.y - 20 },
    }).then((nodeId) => { pushAction({ type: "create", nodeId }); sfx.add(); });
  }, [boardId, createNode, screenToFlowPosition, pushAction]);

  const addLinkNodeAtCursor = useCallback(() => {
    setLinkUrl("");
    setLinkDialogOpen(true);
  }, []);

  const handleLinkSubmit = useCallback(() => {
    let url = linkUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    const pos = screenToFlowPosition(contextMenuPosRef.current);
    createNode({
      boardId,
      type: "link",
      content: url,
      position: { x: pos.x - 140, y: pos.y - 30 },
    }).then((nodeId) => {
      pushAction({ type: "create", nodeId });
      sfx.add();
      fetchMetadata({ nodeId, url });
    });
    setLinkDialogOpen(false);
    setLinkUrl("");
  }, [linkUrl, boardId, createNode, fetchMetadata, screenToFlowPosition, pushAction]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    contextMenuPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault();
      e.stopPropagation();
      setNodeMenu({ nodeId: node.id, x: e.clientX, y: e.clientY });
    },
    []
  );

  const closeNodeMenu = useCallback(() => setNodeMenu(null), []);

  const handleNodeCopy = useCallback(() => {
    if (!nodeMenu) return;
    const node = localNodes.find((n) => n.id === nodeMenu.nodeId);
    if (!node) return;
    const data = node.data as { content?: string; metadata?: { title?: string } };
    const text = data.metadata?.title || data.content || "";
    // Strip HTML tags for text nodes
    const plain = text.replace(/<[^>]*>/g, "");
    navigator.clipboard.writeText(plain);
    setNodeMenu(null);
  }, [nodeMenu, localNodes]);

  const handleNodeDuplicate = useCallback(() => {
    if (!nodeMenu) return;
    const node = localNodes.find((n) => n.id === nodeMenu.nodeId);
    if (!node) return;
    const data = node.data as { content?: string };
    createNode({
      boardId,
      type: node.type as "text" | "link" | "checklist",
      content: data.content || "",
      position: { x: node.position.x + 30, y: node.position.y + 30 },
    }).then((newNodeId) => {
      pushAction({ type: "create", nodeId: newNodeId });
      sfx.add();
      if (node.type === "link" && data.content) {
        fetchMetadata({ nodeId: newNodeId, url: data.content });
      }
    });
    setNodeMenu(null);
  }, [nodeMenu, localNodes, boardId, createNode, fetchMetadata, pushAction]);

  const handleNodeDelete = useCallback(() => {
    if (!nodeMenu) return;
    deleteNodeWithUndo(nodeMenu.nodeId);
    setNodeMenu(null);
  }, [nodeMenu, deleteNodeWithUndo]);

  const handleNodeRename = useCallback(() => {
    if (!nodeMenu) return;
    const node = localNodes.find((n) => n.id === nodeMenu.nodeId);
    if (!node) return;
    const data = node.data as { metadata?: { title?: string } };
    setRenameValue(data.metadata?.title || "");
    setRenameNodeId(nodeMenu.nodeId);
    setNodeMenu(null);
  }, [nodeMenu, localNodes]);

  const handleRenameSubmit = useCallback(() => {
    if (!renameNodeId) return;
    const newTitle = renameValue.trim();
    if (!newTitle) return;
    const source = boardNodes?.find((n) => n._id === renameNodeId);
    const oldMetadata = source?.metadata ? { ...source.metadata } : undefined;
    const newMetadata = { ...source?.metadata, title: newTitle };
    pushAction({
      type: "edit",
      nodeId: renameNodeId,
      oldContent: source?.content || "",
      newContent: source?.content || "",
      oldMetadata,
      newMetadata,
    });
    updateNode({ nodeId: renameNodeId, metadata: newMetadata });
    setRenameNodeId(null);
  }, [renameNodeId, renameValue, boardNodes, pushAction, updateNode]);

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

  const flowContent = (
    <ReactFlow
      nodes={localNodes}
      edges={[]}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      nodesDraggable={canEdit}
      nodesConnectable={false}
      onNodeContextMenu={canEdit ? onNodeContextMenu : undefined}
      onPaneClick={closeNodeMenu}
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
      {canEdit && (
        <Toolbar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onNodeCreated={(nodeId) => { pushAction({ type: "create", nodeId }); sfx.add(); }}
        />
      )}
    </ReactFlow>
  );

  const muteButton = (
    <button
      onClick={() => {
        if (isMuted) { sfx.unmute(); } else { sfx.mute(); }
        setIsMuted(!isMuted);
      }}
      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-white transition-colors text-gray-500 hover:text-gray-700"
      title={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );

  if (!canEdit) {
    return (
      <div className="w-full h-full relative" onMouseMove={onMouseMove}>
        {flowContent}
        {muteButton}
      </div>
    );
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="w-full h-full relative"
            onMouseMove={onMouseMove}
            onContextMenu={handleContextMenu}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {flowContent}
            {isDragOver && (
              <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-blue-500/10 border-2 border-dashed border-blue-400 rounded-lg">
                <div className="flex flex-col items-center gap-2 text-blue-600 bg-white/90 px-6 py-4 rounded-xl shadow-lg">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm font-medium">Drop links or text files here</span>
                </div>
              </div>
            )}
            {muteButton}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={addTextNodeAtCursor}>
            <Type className="h-4 w-4 mr-2" />
            Add Text
          </ContextMenuItem>
          <ContextMenuItem onClick={addLinkNodeAtCursor}>
            <Link className="h-4 w-4 mr-2" />
            Add Link
          </ContextMenuItem>
          <ContextMenuItem onClick={addChecklistNodeAtCursor}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Add Checklist
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {nodeMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeNodeMenu} onContextMenu={(e) => { e.preventDefault(); closeNodeMenu(); }} />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
            style={{ left: nodeMenu.x, top: nodeMenu.y }}
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={handleNodeCopy}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy to clipboard
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={handleNodeDuplicate}
            >
              <CopyPlus className="h-3.5 w-3.5" />
              Duplicate
            </button>
            {localNodes.find((n) => n.id === nodeMenu.nodeId)?.type === "link" && (
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={handleNodeRename}
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
            )}
            <div className="my-1 border-t border-gray-100" />
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={handleNodeDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Link
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLinkSubmit();
            }}
            className="flex gap-2"
          >
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              autoFocus
            />
            <Button type="submit" disabled={!linkUrl.trim()}>
              Add
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renameNodeId !== null} onOpenChange={(open) => { if (!open) setRenameNodeId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Link</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRenameSubmit();
            }}
            className="flex gap-2"
          >
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Link title"
              autoFocus
            />
            <Button type="submit" disabled={!renameValue.trim()}>
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CanvasProps {
  canEdit: boolean;
  settings?: BoardSettingsData;
}

export function Canvas({ canEdit, settings = {} }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner canEdit={canEdit} settings={settings} />
    </ReactFlowProvider>
  );
}

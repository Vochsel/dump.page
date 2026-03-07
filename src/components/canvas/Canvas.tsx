"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  SelectionMode,
  Node,
  NodeChange,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { type BoardSettingsData, resolveBgColor } from "@/components/board/BoardSettings";
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
import { Type, Link, Plus, CheckSquare, Copy, CopyPlus, Trash2, Upload, Pencil, Volume2, VolumeOff, PanelTop, ChevronsUpDown, ExternalLink, Sun, Moon, Settings2, Archive, Grid3X3, Map as MapIcon, ListChecks } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { useTheme } from "@/context/theme-context";

import { darkenHex, lightenHex } from "@/lib/utils";
import { useUndoRedo, UndoAction } from "@/hooks/useUndoRedo";
import { useBoardOps } from "@/context/board-ops-context";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { sfx } from "@/lib/sfx";
import { QuickTips } from "@/components/board/QuickTips";
import { inferUrlMetadata } from "@/lib/url-metadata";

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
  boardSlug?: string;
  shareToken?: string;
}

function CanvasInner({ canEdit, settings, boardSlug, shareToken }: CanvasInnerProps) {
  const { nodes: boardNodes, boardId, createNode, updateNode, updateNodePosition, deleteNode, fetchLinkMetadata: fetchMetadata } = useBoardOps();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const mousePosRef = useRef({ x: 0, y: 0 });
  const contextMenuPosRef = useRef({ x: 0, y: 0 });

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [editLinkNodeId, setEditLinkNodeId] = useState<string | null>(null);

  // Theme
  const { resolved: theme, setMode: setThemeMode, mode: themeMode } = useTheme();

  // Mute state
  const [isMuted, setIsMuted] = useState(() => sfx.isMuted());

  // Client preferences
  const [snapToGrid, setSnapToGrid] = useLocalStorage("dump-snap-to-grid", false);
  const [controlsVariant, setControlsVariant] = useLocalStorage<"default" | "map">("dump-controls-variant", "default");
  const [showMinimap, setShowMinimap] = useLocalStorage("dump-show-minimap", false);

  // Archive panel
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archivedNodes = useConvexQuery(
    api.nodes.getArchivedNodesByBoard,
    archiveOpen ? { boardId: boardId as Id<"boards"> } : "skip"
  );
  const unarchiveMutation = useConvexMutation(api.nodes.unarchiveNode);

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
            title: n.title,
            showTitle: n.showTitle ?? (n.type === "checklist" ? true : undefined),
            collapsed: n.collapsed ?? false,
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
      // Don't intercept paste when editing a text input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("[contenteditable]")
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
        const inferred = inferUrlMetadata(url);
        createNode({
          boardId,
          type: "link",
          content: url,
          position: { x: pos.x - 140, y: pos.y - 30 },
          metadata: inferred ? { title: inferred.title, description: inferred.description } : undefined,
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
  // Skip when drag originates from internal checklist reorder
  const isExternalDrag = useCallback((e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types);
    return types.includes("Files") || types.includes("text/uri-list");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isExternalDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, [isExternalDrag]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!isExternalDrag(e)) return;
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, [isExternalDrag]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isExternalDrag(e)) return;
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, [isExternalDrag]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!isExternalDrag(e)) return;
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
          const inferred = inferUrlMetadata(url);
          createNode({
            boardId,
            type: "link",
            content: url,
            position: nodePos,
            metadata: inferred ? { title: inferred.title, description: inferred.description } : undefined,
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
        const inferred = inferUrlMetadata(url);
        createNode({
          boardId,
          type: "link",
          content: url,
          position: { x: pos.x - 140, y: pos.y - 30 },
          metadata: inferred ? { title: inferred.title, description: inferred.description } : undefined,
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
    [canEdit, boardId, createNode, fetchMetadata, screenToFlowPosition, pushAction, isExternalDrag]
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
        const padding = selected.length <= 3 ? 0.8 : 0.3;
        fitView({ nodes: selected, padding, duration: 300 });
      } else {
        const total = localNodes.length;
        const padding = total <= 3 ? 0.8 : total <= 10 ? 0.4 : 0.15;
        fitView({ padding, duration: 300 });
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
    setEditLinkNodeId(null);
    setLinkUrl("");
    setLinkDialogOpen(true);
  }, []);

  const handleLinkSubmit = useCallback(() => {
    let url = linkUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    if (editLinkNodeId) {
      // Edit existing link
      const source = boardNodes?.find((n) => n._id === editLinkNodeId);
      if (source) {
        pushAction({
          type: "edit",
          nodeId: editLinkNodeId,
          oldContent: source.content,
          newContent: url,
          oldMetadata: source.metadata ? { ...source.metadata } : undefined,
          newMetadata: undefined,
        });
        updateNode({ nodeId: editLinkNodeId, content: url, metadata: {} });
        fetchMetadata({ nodeId: editLinkNodeId, url });
      }
    } else {
      // Add new link
      const pos = screenToFlowPosition(contextMenuPosRef.current);
      const inferred = inferUrlMetadata(url);
      createNode({
        boardId,
        type: "link",
        content: url,
        position: { x: pos.x - 140, y: pos.y - 30 },
        metadata: inferred ? { title: inferred.title, description: inferred.description } : undefined,
      }).then((nodeId) => {
        pushAction({ type: "create", nodeId });
        sfx.add();
        fetchMetadata({ nodeId, url });
      });
    }
    setLinkDialogOpen(false);
    setEditLinkNodeId(null);
    setLinkUrl("");
  }, [linkUrl, editLinkNodeId, boardId, boardNodes, createNode, fetchMetadata, screenToFlowPosition, pushAction, updateNode]);

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
    const source = boardNodes?.find((n) => n._id === nodeMenu.nodeId);
    const data = node.data as { content?: string; title?: string };
    createNode({
      boardId,
      type: node.type as "text" | "link" | "checklist",
      content: data.content || "",
      position: { x: node.position.x + 30, y: node.position.y + 30 },
    }).then((newNodeId) => {
      pushAction({ type: "create", nodeId: newNodeId });
      sfx.add();
      // Carry over title, showTitle, and collapsed preferences
      const updates: Record<string, unknown> = {};
      if (data.title) updates.title = data.title;
      if (source?.showTitle) updates.showTitle = source.showTitle;
      if (source?.collapsed) updates.collapsed = source.collapsed;
      if (Object.keys(updates).length > 0) {
        updateNode({ nodeId: newNodeId, ...updates } as Parameters<typeof updateNode>[0]);
      }
      if (node.type === "link" && data.content) {
        fetchMetadata({ nodeId: newNodeId, url: data.content });
      }
    });
    setNodeMenu(null);
  }, [nodeMenu, localNodes, boardNodes, boardId, createNode, fetchMetadata, pushAction, updateNode]);

  const handleNodeArchive = useCallback(() => {
    if (!nodeMenu) return;
    updateNode({ nodeId: nodeMenu.nodeId, archived: true });
    setNodeMenu(null);
    toast("Item archived");
  }, [nodeMenu, updateNode]);

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

  const handleNodeEditLink = useCallback(() => {
    if (!nodeMenu) return;
    const node = localNodes.find((n) => n.id === nodeMenu.nodeId);
    if (!node) return;
    const data = node.data as { content?: string };
    setEditLinkNodeId(nodeMenu.nodeId);
    setLinkUrl(data.content || "");
    setLinkDialogOpen(true);
    setNodeMenu(null);
  }, [nodeMenu, localNodes]);

  const handleNodeCopyLink = useCallback(() => {
    if (!nodeMenu || !boardSlug) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let url = `${origin}/b/${boardSlug}/${nodeMenu.nodeId}`;
    if (shareToken) url += `?token=${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Item link copied to clipboard");
    });
    setNodeMenu(null);
  }, [nodeMenu, boardSlug, shareToken]);

  const handleNodeToggleTitle = useCallback(() => {
    if (!nodeMenu) return;
    const node = boardNodes?.find((n) => n._id === nodeMenu.nodeId);
    if (!node) return;
    updateNode({ nodeId: nodeMenu.nodeId, showTitle: !node.showTitle });
    setNodeMenu(null);
  }, [nodeMenu, boardNodes, updateNode]);

  const handleNodeToggleCollapse = useCallback(() => {
    if (!nodeMenu) return;
    const node = boardNodes?.find((n) => n._id === nodeMenu.nodeId);
    if (!node) return;
    updateNode({ nodeId: nodeMenu.nodeId, collapsed: !node.collapsed });
    setNodeMenu(null);
  }, [nodeMenu, boardNodes, updateNode]);

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
  const bgColorRaw = settings.backgroundColor ?? "#f9fafb";

  const isDark = theme === "dark";
  const bgColor = resolveBgColor(bgColorRaw, isDark);
  const lineColor = isDark ? lightenHex(bgColor, 0.08) : darkenHex(bgColor, 0.08);
  const lineColorFaint = isDark ? lightenHex(bgColor, 0.05) : darkenHex(bgColor, 0.05);

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
      snapToGrid={snapToGrid}
      snapGrid={[20, 20]}
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
      style={{ backgroundColor: bgColor, overscrollBehaviorX: "none" }}
    >
      {renderBackground()}
      {showMinimap && (
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          className="!mb-16 !mr-2"
          bgColor={isDark ? "#1f1f1f" : "#ffffff"}
          maskColor={isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)"}
          nodeColor={isDark ? "#525252" : "#d4d4d4"}
          style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}
        />
      )}
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

  const bottomButtons = (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5">
      <button
        onClick={() => {
          if (isMuted) { sfx.unmute(); } else { sfx.mute(); }
          setIsMuted(!isMuted);
        }}
        className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        title={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <button
        onClick={() => {
          const next = themeMode === "system"
            ? (theme === "dark" ? "light" : "dark")
            : themeMode === "dark" ? "light" : themeMode === "light" ? "system" : "dark";
          setThemeMode(next);
        }}
        className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        title={`Theme: ${themeMode} (${theme})`}
      >
        {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="Preferences"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" side="top" align="start">
          <label className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 cursor-pointer">
            <span>Snap to grid</span>
            <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
          </label>
          <label className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/50 cursor-pointer">
            <span>Minimap</span>
            <Switch checked={showMinimap} onCheckedChange={setShowMinimap} />
          </label>
          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
          <p className="px-2 pt-1 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Controls</p>
          <div className="flex gap-1 px-1">
            <button
              onClick={() => setControlsVariant("default")}
              className={`flex items-center gap-1.5 flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                controlsVariant === "default" ? "bg-accent font-medium" : "hover:bg-accent/50"
              }`}
            >
              <Grid3X3 className="h-3 w-3" />
              Design
            </button>
            <button
              onClick={() => setControlsVariant("map")}
              className={`flex items-center gap-1.5 flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                controlsVariant === "map" ? "bg-accent font-medium" : "hover:bg-accent/50"
              }`}
            >
              <MapIcon className="h-3 w-3" />
              Map
            </button>
          </div>
          {canEdit && (
            <>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button
                onClick={() => setArchiveOpen(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/50"
              >
                <Archive className="h-3.5 w-3.5" />
                Archived items
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );

  if (!canEdit) {
    return (
      <div className="w-full h-full relative" onMouseMove={onMouseMove}>
        {flowContent}
        {bottomButtons}

        <QuickTips />
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
            {bottomButtons}
    
            <QuickTips />
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
          {(() => {
            const selected = localNodes.filter((n) => n.selected && n.type === "text");
            if (selected.length < 2) return null;
            return (
              <ContextMenuItem onClick={() => {
                // Convert selected text nodes into a single checklist
                const items = selected.map((n) => {
                  const data = n.data as { content?: string };
                  const text = (data.content || "").replace(/<[^>]*>/g, "").trim();
                  return { id: Math.random().toString(36).slice(2, 9), text, checked: false };
                });
                const pos = selected[0].position;
                createNode({
                  boardId,
                  type: "checklist",
                  content: JSON.stringify(items),
                  position: { x: pos.x, y: pos.y },
                }).then((newNodeId) => {
                  pushAction({ type: "create", nodeId: newNodeId });
                  sfx.add();
                  // Delete original text nodes
                  for (const n of selected) {
                    deleteNode({ nodeId: n.id });
                  }
                });
              }}>
                <ListChecks className="h-4 w-4 mr-2" />
                Merge to checklist
              </ContextMenuItem>
            );
          })()}
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
              Copy content
            </button>
            {boardSlug && (
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={handleNodeCopyLink}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Copy link to this
              </button>
            )}
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={handleNodeDuplicate}
            >
              <CopyPlus className="h-3.5 w-3.5" />
              Duplicate
            </button>
            {localNodes.find((n) => n.id === nodeMenu.nodeId)?.type === "link" && (
              <>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={handleNodeEditLink}
                >
                  <Link className="h-3.5 w-3.5" />
                  Edit link
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={handleNodeRename}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rename
                </button>
              </>
            )}
            {(() => {
              const nodeType = localNodes.find((n) => n.id === nodeMenu.nodeId)?.type;
              if (nodeType !== "text" && nodeType !== "checklist") return null;
              const source = boardNodes?.find((n) => n._id === nodeMenu.nodeId);
              return (
                <>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={handleNodeToggleTitle}
                  >
                    <PanelTop className="h-3.5 w-3.5" />
                    {source?.showTitle ? "Hide title bar" : "Show title bar"}
                  </button>
                  {(nodeType === "text" || nodeType === "checklist") && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={handleNodeToggleCollapse}
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                      {source?.collapsed ? "Expand" : "Collapse"}
                    </button>
                  )}
                </>
              );
            })()}
            <div className="my-1 border-t border-gray-100" />
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={handleNodeArchive}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
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

      <Dialog open={linkDialogOpen} onOpenChange={(open) => { setLinkDialogOpen(open); if (!open) setEditLinkNodeId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editLinkNodeId ? (
                <><Link className="h-4 w-4" />Edit Link</>
              ) : (
                <><Plus className="h-4 w-4" />Add Link</>
              )}
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
              {editLinkNodeId ? "Save" : "Add"}
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

      {/* Archive panel */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-md max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archived Items
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {archivedNodes === undefined ? (
              <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
            ) : archivedNodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No archived items.</p>
            ) : (
              archivedNodes.map((node) => (
                <div
                  key={node._id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground uppercase">{node.type}</span>
                    <p className="text-sm truncate text-gray-700 dark:text-gray-300">
                      {node.type === "link"
                        ? node.metadata?.title || node.content.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
                        : node.type === "checklist"
                          ? node.title || "Checklist"
                          : node.content.replace(/<[^>]*>/g, "").slice(0, 80)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs"
                    onClick={async () => {
                      await unarchiveMutation({ nodeId: node._id });
                      toast("Item restored");
                    }}
                  >
                    Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CanvasProps {
  canEdit: boolean;
  settings?: BoardSettingsData;
  boardSlug?: string;
  shareToken?: string;
}

export function Canvas({ canEdit, settings = {}, boardSlug, shareToken }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner canEdit={canEdit} settings={settings} boardSlug={boardSlug} shareToken={shareToken} />
    </ReactFlowProvider>
  );
}

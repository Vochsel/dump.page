"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Type, Link, Plus, Minus, CheckSquare, Undo2, Redo2, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useBoardOps } from "@/context/board-ops-context";

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNodeCreated: (nodeId: string) => void;
}

const URL_LIKE = /^(https?:\/\/|www\.)\S+|^\S+\.\S+/i;

export function Toolbar({ canUndo, canRedo, onUndo, onRedo, onNodeCreated }: ToolbarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const { createNode, fetchLinkMetadata: fetchMetadata, boardId } = useBoardOps();
  const { screenToFlowPosition, fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();
  const { zoom } = useViewport();

  const getCenter = () => {
    return screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  };

  const addTextNode = async () => {
    const pos = getCenter();
    const nodeId = await createNode({
      boardId,
      type: "text",
      content: "",
      position: { x: pos.x - 140, y: pos.y - 60 },
    });
    onNodeCreated(nodeId);
  };

  const addChecklistNode = async () => {
    const pos = getCenter();
    const nodeId = await createNode({
      boardId,
      type: "checklist",
      content: "[]",
      position: { x: pos.x - 110, y: pos.y - 60 },
    });
    onNodeCreated(nodeId);
  };

  const addLinkNode = async () => {
    const input = linkUrl.trim();
    if (!input) return;

    let url: string;
    let searchMeta: { title?: string; description?: string } | null = null;

    if (URL_LIKE.test(input)) {
      url = input.startsWith("http://") || input.startsWith("https://")
        ? input
        : "https://" + input;
    } else {
      // Not a URL — search for it
      setSearching(true);
      try {
        const res = await fetch(`/api/search-url?q=${encodeURIComponent(input)}`);
        const data = await res.json();
        if (!data.url) {
          setSearching(false);
          return;
        }
        url = data.url;
        if (data.title || data.description) {
          searchMeta = { title: data.title, description: data.description };
        }
      } catch {
        setSearching(false);
        return;
      }
      setSearching(false);
    }

    const pos = getCenter();
    const nodeId = await createNode({
      boardId,
      type: "link",
      content: url,
      position: { x: pos.x - 140, y: pos.y - 60 },
      metadata: searchMeta ?? undefined,
    });
    onNodeCreated(nodeId);
    setLinkUrl("");
    setLinkOpen(false);
    // Skip fetchMetadata if we already have search result metadata
    if (!searchMeta) {
      fetchMetadata({ nodeId, url });
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-card border rounded-lg shadow-lg p-2">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo} title="Undo (Cmd+Z)">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
        <Redo2 className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border" />
      <Button variant="ghost" size="sm" className="gap-2" onClick={addTextNode}>
        <Type className="h-4 w-4" />
        Text
      </Button>
      <Button variant="ghost" size="sm" className="gap-2" onClick={addChecklistNode}>
        <CheckSquare className="h-4 w-4" />
        Checklist
      </Button>
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLinkOpen(true)}>
        <Link className="h-4 w-4" />
        Link
      </Button>
      <div className="w-px h-6 bg-border" />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut({ duration: 200 })} title="Zoom out">
        <Minus className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 min-w-[48px] px-2 text-xs tabular-nums" title="Zoom options">
            {Math.round(zoom * 100)}%
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" side="top" align="center">
          <button
            onClick={() => fitView({ padding: 0.5, duration: 300 })}
            className="w-full px-3 py-1.5 text-sm text-left rounded-md hover:bg-accent"
          >
            Zoom to fit
          </button>
          {[50, 100, 150, 200].map((pct) => (
            <button
              key={pct}
              onClick={() => zoomTo(pct / 100, { duration: 200 })}
              className="w-full px-3 py-1.5 text-sm text-left rounded-md hover:bg-accent"
            >
              {pct}%
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn({ duration: 200 })} title="Zoom in">
        <Plus className="h-4 w-4" />
      </Button>
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Paste a URL to add it as a card on the board.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="URL or search term"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLinkNode()}
              disabled={searching}
              autoFocus
            />
            <Button onClick={addLinkNode} disabled={searching || !linkUrl.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a URL or type a search term to find and add the top result.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

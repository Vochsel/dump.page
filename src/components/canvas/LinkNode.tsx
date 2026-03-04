"use client";

import { useState, useCallback } from "react";
import { NodeProps } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ExternalLink, Trash2, Pencil } from "lucide-react";
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

type LinkNodeData = {
  content: string;
  nodeId: Id<"nodes">;
  canEdit: boolean;
  metadataLoading: boolean;
  metadata?: {
    title?: string;
    favicon?: string;
    description?: string;
  };
};

function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "";
  }
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-muted ${className ?? ""}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
    </div>
  );
}

export function LinkNode({ data }: NodeProps) {
  const { content, nodeId, canEdit, metadata, metadataLoading } =
    data as unknown as LinkNodeData;
  const deleteNode = useMutation(api.nodes.deleteNode);
  const updateNode = useMutation(api.nodes.updateNode);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  let hostname = "";
  try {
    hostname = new URL(content).hostname.replace(/^www\./, "");
  } catch {
    hostname = content;
  }

  const faviconUrl = metadata?.favicon || getFaviconUrl(content);
  const title = metadata?.title;
  const description = metadata?.description;

  const openRename = useCallback(() => {
    setRenameValue(title || "");
    setRenameOpen(true);
  }, [title]);

  const handleRename = useCallback(() => {
    const newTitle = renameValue.trim();
    if (!newTitle) return;
    updateNode({
      nodeId,
      metadata: {
        ...metadata,
        title: newTitle,
      },
    });
    setRenameOpen(false);
  }, [renameValue, nodeId, metadata, updateNode]);

  const nodeContent = (
    <div className="bg-card border rounded-lg shadow-sm w-[280px] group">
      <a
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 hover:bg-muted/50 transition-colors rounded-lg"
      >
        {/* Hostname row — always visible */}
        <div className="flex items-center gap-2 mb-1.5">
          {faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconUrl}
              alt=""
              className="w-4 h-4 flex-shrink-0 rounded-sm"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = "none";
                img.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <ExternalLink
            className={`h-4 w-4 text-muted-foreground flex-shrink-0 ${faviconUrl ? "hidden" : ""}`}
          />
          <span className="text-xs text-muted-foreground truncate">
            {hostname}
          </span>
        </div>

        {/* Loading shimmer */}
        {metadataLoading && (
          <div className="space-y-2">
            <Shimmer className="h-4 w-[85%]" />
            <Shimmer className="h-3 w-[60%]" />
          </div>
        )}

        {/* Loaded content */}
        {!metadataLoading && title && (
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {title}
          </p>
        )}
        {!metadataLoading && description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
            {description}
          </p>
        )}
        {!metadataLoading && !title && !description && (
          <p className="text-sm font-medium truncate">{content}</p>
        )}
      </a>
      {canEdit && (
        <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode({ nodeId });
            }}
            className="bg-destructive rounded-full p-1 shadow-sm hover:bg-destructive/90"
          >
            <Trash2 className="h-3 w-3 text-white" />
          </button>
        </div>
      )}
    </div>
  );

  if (!canEdit) return nodeContent;

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {nodeContent}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          <ContextMenuItem onClick={openRename}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Link</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
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

"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { LayoutGrid, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

type BoardNodeData = {
  content: string; // linked board ID
  nodeId: string;
  canEdit: boolean;
  collapsed?: boolean;
  metadata?: {
    title?: string;
    favicon?: string; // board icon emoji
    description?: string; // board slug
    image?: string; // thumbnail URL
  };
  deleteNodeWithUndo: (nodeId: string) => void;
  isConnectMode?: boolean;
};

export function BoardNode({ data }: NodeProps) {
  const { content, nodeId, canEdit, metadata, deleteNodeWithUndo, isConnectMode } =
    data as unknown as BoardNodeData;

  const boardName = metadata?.title || "Untitled Board";
  const boardIcon = metadata?.favicon || "📋";
  const boardSlug = metadata?.description;
  const thumbnailUrl = metadata?.image;

  const handleDelete = () => deleteNodeWithUndo(nodeId);

  const href = boardSlug ? `/b/${boardSlug}` : "#";

  return (
    <>
      <div className="bg-card border-2 border-dashed border-primary/30 rounded-lg shadow-sm w-[280px] group relative hover:border-primary/50 transition-colors">
        <Link
          href={href}
          className="block hover:bg-muted/50 transition-colors rounded-lg overflow-hidden"
        >
          {thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt=""
              className="w-full h-[120px] object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg leading-none">{boardIcon}</span>
              <span className="text-sm font-medium leading-snug line-clamp-2 flex-1">
                {boardName}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <LayoutGrid className="h-3 w-3" />
              <span>Linked Board</span>
            </div>
          </div>
        </Link>
        {canEdit && (
          <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              className="bg-destructive rounded-full p-1 shadow-sm hover:bg-destructive/90"
            >
              <Trash2 className="h-3 w-3 text-white" />
            </button>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Top} className={`!absolute !top-0 !left-0 !w-full !h-full !opacity-0 !rounded-none !transform-none !border-0 !z-10 ${isConnectMode ? "!cursor-crosshair" : "!pointer-events-none"}`} />
      <Handle type="target" position={Position.Top} className={`!absolute !top-0 !left-0 !w-full !h-full !opacity-0 !rounded-none !transform-none !border-0 !z-10 ${isConnectMode ? "" : "!pointer-events-none"}`} />
    </>
  );
}

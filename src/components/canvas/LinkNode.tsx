"use client";

import { NodeProps } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ExternalLink, Trash2 } from "lucide-react";

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

  let hostname = "";
  try {
    hostname = new URL(content).hostname.replace(/^www\./, "");
  } catch {
    hostname = content;
  }

  const faviconUrl = metadata?.favicon || getFaviconUrl(content);
  const title = metadata?.title;
  const description = metadata?.description;

  return (
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
}

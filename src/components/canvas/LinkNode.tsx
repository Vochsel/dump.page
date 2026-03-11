"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { ExternalLink, Trash2, Rss, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useBoardOps } from "@/context/board-ops-context";


type LinkNodeData = {
  content: string;
  nodeId: string;
  canEdit: boolean;
  collapsed?: boolean;
  metadataLoading: boolean;
  metadata?: {
    title?: string;
    favicon?: string;
    description?: string;
    image?: string;
  };
  deleteNodeWithUndo: (nodeId: string) => void;
  onPreview?: (nodeId: string) => void;
  isConnectMode?: boolean;
};

function getRootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").split(".");
  if (parts.length > 2) {
    const sld = parts[parts.length - 2];
    if (["co", "com", "org", "net", "gov", "edu", "ac"].includes(sld)) {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  }
  return parts.join(".");
}

function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    const root = getRootDomain(hostname);
    return `https://www.google.com/s2/favicons?domain=${root}&sz=32`;
  } catch {
    return "";
  }
}

function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "m.youtube.com"
    ) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/?]+)/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

function getSpotifyEmbed(
  url: string
): { embedUrl: string; type: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "open.spotify.com") return null;
    const m = u.pathname.match(
      /^\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/
    );
    if (!m) return null;
    return {
      type: m[1],
      embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
    };
  } catch {
    return null;
  }
}

function getGoogleMapsEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const isGoogleMaps =
      ((u.hostname === "www.google.com" || u.hostname === "google.com") &&
        u.pathname.startsWith("/maps")) ||
      u.hostname === "maps.google.com" ||
      u.hostname === "www.maps.google.com" ||
      u.hostname === "maps.app.goo.gl";
    if (!isGoogleMaps) return null;

    // Extract a search query from the URL for the embeddable endpoint
    // /maps/place/Place+Name → "Place Name"
    const placeMatch = u.pathname.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      const query = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }
    // /maps?q=... or /maps/search/...
    const qParam = u.searchParams.get("q");
    if (qParam) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(qParam)}&output=embed`;
    }
    const searchMatch = u.pathname.match(/\/maps\/search\/([^/]+)/);
    if (searchMatch) {
      const query = decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }
    // Fallback: extract @lat,lng if present
    const coordMatch = u.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
    }
    // Short links (maps.app.goo.gl) — use the full URL as query
    if (u.hostname === "maps.app.goo.gl") {
      return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
    }
    return null;
  } catch {
    return null;
  }
}

function getSoundCloudEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "soundcloud.com" && u.hostname !== "www.soundcloud.com")
      return null;
    // Match /artist/track or /artist/sets/playlist
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=true&show_artwork=true`;
  } catch {
    return null;
  }
}

function getTwitterTweetId(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      u.hostname !== "twitter.com" &&
      u.hostname !== "www.twitter.com" &&
      u.hostname !== "x.com" &&
      u.hostname !== "www.x.com"
    )
      return null;
    const m = u.pathname.match(/^\/[^/]+\/status\/(\d+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function looksLikeRssFeed(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if ([".rss", ".xml", ".atom"].some((ext) => path.endsWith(ext))) return true;
    if (["/feed", "/rss", "/atom"].some((p) => path.includes(p))) return true;
    return false;
  } catch {
    return false;
  }
}

function RssIndicator() {
  return (
    <div className="absolute top-2.5 right-2.5 flex items-center justify-center z-10" title="RSS Feed">
      <span className="absolute inline-flex h-4 w-4 rounded-full bg-orange-400/20 animate-ping" />
      <span className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-orange-100 shadow-sm">
        <Rss className="h-2.5 w-2.5 text-orange-500" />
      </span>
    </div>
  );
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

function EmbedNode({
  src,
  title,
  hostname,
  width,
  height,
  aspectRatio,
  canEdit,
  onDelete,
  disablePointerEvents,
}: {
  src: string;
  title?: string;
  hostname: string;
  width: number;
  height?: number;
  aspectRatio?: string;
  canEdit: boolean;
  onDelete: () => void;
  disablePointerEvents?: boolean;
}) {
  return (
    <div
      className="bg-card border rounded-lg shadow-sm group overflow-hidden"
      style={{ width }}
    >
      <div
        className="relative w-full"
        style={
          aspectRatio
            ? { aspectRatio }
            : { height }
        }
      >
        <iframe
          src={src}
          title={title || "Embedded content"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          style={disablePointerEvents ? { pointerEvents: "none" } : undefined}
        />
      </div>
      <div className={`p-3 ${title ? "" : "pt-1"}`}>
        {title && (
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {title}
          </p>
        )}
        <span className="text-xs text-muted-foreground">{hostname}</span>
      </div>
      {canEdit && (
        <div className="absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
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

export function LinkNode({ data }: NodeProps) {
  const { content, nodeId, canEdit, collapsed, metadata, metadataLoading, deleteNodeWithUndo, onPreview, isConnectMode } =
    data as unknown as LinkNodeData;
  const { updateNode } = useBoardOps();

  let hostname = "";
  try {
    hostname = new URL(content).hostname.replace(/^www\./, "");
  } catch {
    hostname = content;
  }

  const faviconUrl = metadata?.favicon || getFaviconUrl(content);
  const title = metadata?.title;
  const description = metadata?.description;
  const youtubeId = getYouTubeVideoId(content);
  const spotifyEmbed = getSpotifyEmbed(content);
  const googleMapsEmbedUrl = getGoogleMapsEmbedUrl(content);
  const soundCloudEmbedUrl = getSoundCloudEmbedUrl(content);
  const tweetId = getTwitterTweetId(content);
  const isRss = looksLikeRssFeed(content);

  const handleDelete = () => deleteNodeWithUndo(nodeId);

  const nodeContent = youtubeId ? (
    <EmbedNode
      src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
      title={title || "YouTube video"}
      hostname={hostname}
      width={360}
      aspectRatio="16/9"
      canEdit={canEdit}
      onDelete={handleDelete}
    />
  ) : spotifyEmbed ? (
    <EmbedNode
      src={spotifyEmbed.embedUrl}
      title={title || `Spotify ${spotifyEmbed.type}`}
      hostname={hostname}
      width={280}
      height={152}
      canEdit={canEdit}
      onDelete={handleDelete}
    />
  ) : googleMapsEmbedUrl ? (
    <EmbedNode
      src={googleMapsEmbedUrl}
      title={title || "Google Maps"}
      hostname={hostname}
      width={320}
      aspectRatio="4/3"
      canEdit={canEdit}
      onDelete={handleDelete}
    />
  ) : soundCloudEmbedUrl ? (
    <EmbedNode
      src={soundCloudEmbedUrl}
      title={title || "SoundCloud"}
      hostname={hostname}
      width={280}
      height={166}
      canEdit={canEdit}
      onDelete={handleDelete}
    />
  ) : tweetId ? (
    <EmbedNode
      src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`}
      title={title || "Tweet"}
      hostname={hostname}
      width={320}
      height={500}
      canEdit={canEdit}
      onDelete={handleDelete}
      disablePointerEvents
    />
  ) : (
    <div className="bg-card border rounded-lg shadow-sm w-[280px] group relative">
      {isRss && <RssIndicator />}
      <a
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-muted/50 transition-colors rounded-lg overflow-hidden"
      >
        {/* OG Image — hidden when collapsed */}
        {!collapsed && !metadataLoading && metadata?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={metadata.image}
            alt=""
            className="w-full h-[140px] object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="p-3">
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
          <span className="text-xs text-muted-foreground truncate flex-1">
            {hostname}
          </span>
          {/* Collapse/expand toggle */}
          {(canEdit || isConnectMode) && (
            <button
              className={`nodrag flex-shrink-0 p-0.5 rounded hover:bg-muted/60 transition-colors text-muted-foreground/50 hover:text-muted-foreground/80 ${isConnectMode ? "pointer-events-none" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateNode({ nodeId, collapsed: !collapsed });
              }}
              title={collapsed ? "Expand link" : "Collapse link"}
            >
              {collapsed ? <ChevronsUpDown className="h-3 w-3" /> : <ChevronsDownUp className="h-3 w-3" />}
            </button>
          )}
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
        </div>
      </a>
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
  );

  return (
    <>
      {nodeContent}
      <Handle type="source" position={Position.Top} className={`!absolute !top-0 !left-0 !w-full !h-full !opacity-0 !rounded-none !transform-none !border-0 !z-10 ${isConnectMode ? "!cursor-crosshair" : "!pointer-events-none"}`} />
      <Handle type="target" position={Position.Top} className={`!absolute !top-0 !left-0 !w-full !h-full !opacity-0 !rounded-none !transform-none !border-0 !z-10 ${isConnectMode ? "" : "!pointer-events-none"}`} />
    </>
  );
}

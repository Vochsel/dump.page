"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Settings,
  Copy,
  RefreshCw,
  Check,
  Grid3X3,
  Map,
  Rss,
  Bot,
} from "lucide-react";
import { IconPicker } from "./IconPicker";

export type BoardSettingsData = {
  backgroundPattern?: "dots" | "paper" | "boxes" | "blank";
  backgroundColor?: string;
  controlsVariant?: "default" | "map";
};

interface BoardShareProps {
  board: {
    _id: Id<"boards">;
    visibility: "private" | "shared" | "public";
    shareToken?: string;
  };
  isOwner: boolean;
}

export function BoardShare({ board, isOwner }: BoardShareProps) {
  const [copied, setCopied] = useState(false);
  const [copiedRss, setCopiedRss] = useState(false);
  const [copiedMcp, setCopiedMcp] = useState(false);
  const updateBoard = useMutation(api.boards.updateBoard);
  const regenerateToken = useMutation(api.boards.regenerateShareToken);

  if (!isOwner) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const shareUrl =
    board.visibility === "shared" && board.shareToken
      ? `${origin}/b/${board._id}?token=${board.shareToken}`
      : board.visibility === "public"
        ? `${origin}/b/${board._id}`
        : null;

  const rssUrl =
    board.visibility === "shared" && board.shareToken
      ? `${origin}/b/${board._id}/rss.xml?token=${board.shareToken}`
      : board.visibility === "public"
        ? `${origin}/b/${board._id}/rss.xml`
        : null;

  const mcpUrl =
    board.visibility === "shared" && board.shareToken
      ? `${origin}/api/mcp/b/${board._id}/mcp?token=${board.shareToken}`
      : board.visibility === "public"
        ? `${origin}/api/mcp/b/${board._id}/mcp`
        : null;

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Visibility
            </label>
            <div className="flex gap-2">
              {(["private", "shared", "public"] as const).map((v) => (
                <Button
                  key={v}
                  variant={board.visibility === v ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    updateBoard({ boardId: board._id, visibility: v })
                  }
                  className="capitalize"
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          {shareUrl && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Share Link
              </label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={copyShareUrl}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {board.visibility === "shared" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-2 text-xs"
                  onClick={() => regenerateToken({ boardId: board._id })}
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate link
                </Button>
              )}
            </div>
          )}

          {rssUrl && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                RSS Feed
              </label>
              <div className="flex gap-2">
                <Input value={rssUrl} readOnly className="text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(rssUrl);
                    setCopiedRss(true);
                    setTimeout(() => setCopiedRss(false), 2000);
                  }}
                >
                  {copiedRss ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Rss className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {mcpUrl && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                MCP Server
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Connect this board to Claude, ChatGPT, or other AI clients.
              </p>
              <div className="flex gap-2">
                <Input value={mcpUrl} readOnly className="text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(mcpUrl);
                    setCopiedMcp(true);
                    setTimeout(() => setCopiedMcp(false), 2000);
                  }}
                >
                  {copiedMcp ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const BG_COLORS = [
  { value: "#f9fafb", label: "White" },
  { value: "#fef9ee", label: "Cream" },
  { value: "#fdf2f8", label: "Pink" },
  { value: "#eff6ff", label: "Blue" },
  { value: "#f0fdf4", label: "Mint" },
  { value: "#faf5ff", label: "Lavender" },
  { value: "#f0f9ff", label: "Sky" },
];

const BG_PATTERNS: { value: BoardSettingsData["backgroundPattern"]; label: string }[] = [
  { value: "dots", label: "Dots" },
  { value: "paper", label: "Paper" },
  { value: "boxes", label: "Boxes" },
  { value: "blank", label: "Blank" },
];

interface BoardSettingsPopoverProps {
  boardId: Id<"boards">;
  icon: string;
  settings: BoardSettingsData;
  canEdit: boolean;
}

export function BoardSettingsPopover({
  boardId,
  icon,
  settings,
  canEdit,
}: BoardSettingsPopoverProps) {
  const updateSettings = useMutation(api.boards.updateBoardSettings);
  const updateBoard = useMutation(api.boards.updateBoard);

  if (!canEdit) return null;

  const currentPattern = settings.backgroundPattern ?? "dots";
  const currentColor = settings.backgroundColor ?? "#ffffff";
  const currentControls = settings.controlsVariant ?? "default";

  const update = (patch: BoardSettingsData) => {
    updateSettings({ boardId, settings: patch });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          {/* Controls variant */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
              Controls
            </label>
            <div className="flex gap-2">
              <Button
                variant={currentControls === "default" ? "default" : "outline"}
                size="sm"
                className="gap-1.5 flex-1"
                onClick={() => update({ controlsVariant: "default" })}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                Design
              </Button>
              <Button
                variant={currentControls === "map" ? "default" : "outline"}
                size="sm"
                className="gap-1.5 flex-1"
                onClick={() => update({ controlsVariant: "map" })}
              >
                <Map className="h-3.5 w-3.5" />
                Map
              </Button>
            </div>
          </div>

          <Separator />

          {/* Board icon */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
              Icon
            </label>
            <IconPicker
              value={icon}
              onChange={(newIcon) => updateBoard({ boardId, icon: newIcon })}
            />
          </div>

          <Separator />

          {/* Background pattern */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
              Background
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {BG_PATTERNS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => update({ backgroundPattern: p.value })}
                  className={`text-xs py-1.5 px-2 rounded-md border transition-colors ${
                    currentPattern === p.value
                      ? "border-primary bg-primary/10 font-medium"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Background color */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
              Color
            </label>
            <div className="flex gap-2">
              {BG_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => update({ backgroundColor: c.value })}
                  title={c.label}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    currentColor === c.value
                      ? "border-primary scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

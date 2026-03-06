"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
  X,
  Clock,
  Send,
  Loader2,
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const updateBoard = useMutation(api.boards.updateBoard);
  const regenerateToken = useMutation(api.boards.regenerateShareToken);
  const addMember = useMutation(api.boardMembers.addMember);
  const removeMember = useMutation(api.boardMembers.removeMember);
  const cancelInvite = useMutation(api.boardMembers.cancelInvite);
  const members = useQuery(api.boardMembers.getMembers, { boardId: board._id });
  const pendingInvites = useQuery(api.boardMembers.getPendingInvites, { boardId: board._id });

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

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteResult({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    setInviteLoading(true);
    setInviteResult(null);
    try {
      const result = await addMember({ boardId: board._id, email });
      const message = result.status === "added"
        ? `${email} has been added`
        : `Invite sent to ${email}`;
      setInviteResult({ type: "success", message });
      setInviteEmail("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send invite";
      setInviteResult({ type: "error", message: msg });
    } finally {
      setInviteLoading(false);
    }
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
          {/* Invite by email */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Add people
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite();
                }}
                className="text-sm"
                disabled={inviteLoading}
              />
              <Button
                size="icon"
                onClick={handleInvite}
                disabled={inviteLoading || !inviteEmail.trim()}
              >
                {inviteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {inviteResult && (
              <p className={`text-xs mt-1.5 ${inviteResult.type === "success" ? "text-green-600" : "text-red-500"}`}>
                {inviteResult.message}
              </p>
            )}
          </div>

          {/* Members list */}
          {members && members.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Members
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {members.map((m) => (
                  <div key={m._id} className="flex items-center gap-2 text-sm">
                    {m.user?.profileImage ? (
                      <img
                        src={m.user.profileImage}
                        alt=""
                        className="w-5 h-5 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex-shrink-0" />
                    )}
                    <span className="truncate flex-1 text-xs">
                      {m.user?.name ?? m.user?.email ?? "Unknown"}
                    </span>
                    {m.role === "owner" ? (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        owner
                      </span>
                    ) : (
                      <button
                        onClick={() => removeMember({ boardId: board._id, userId: m.userId })}
                        className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"
                        title="Remove member"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending invites */}
          {pendingInvites && pendingInvites.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Pending
              </label>
              <div className="space-y-1.5">
                {pendingInvites.map((inv) => (
                  <div key={inv._id} className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate flex-1 text-xs text-muted-foreground">
                      {inv.email}
                    </span>
                    <button
                      onClick={() => cancelInvite({ inviteId: inv._id })}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"
                      title="Cancel invite"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Visibility */}
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

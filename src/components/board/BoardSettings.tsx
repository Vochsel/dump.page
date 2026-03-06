"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FileText,
  UserPlus,
  X,
  Crown,
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
  const [mdOpen, setMdOpen] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const updateBoard = useMutation(api.boards.updateBoard);
  const regenerateToken = useMutation(api.boards.regenerateShareToken);
  const addMember = useMutation(api.boardMembers.addMember);
  const removeMember = useMutation(api.boardMembers.removeMember);
  const members = useQuery(api.boardMembers.getMembers, { boardId: board._id });
  const markdownData = useQuery(
    api.boards.getBoardForMarkdown,
    mdOpen ? { boardId: board._id } : "skip"
  );

  const handleAddMember = useCallback(async () => {
    const email = memberEmail.trim();
    if (!email) return;
    setMemberError("");
    setAddingMember(true);
    try {
      await addMember({ boardId: board._id, email });
      setMemberEmail("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add member";
      // Extract the user-facing message from Convex error format
      const match = msg.match(/Uncaught Error: (.+?)(?:\n|$)/);
      setMemberError(match ? match[1] : msg);
    }
    setAddingMember(false);
  }, [memberEmail, board._id, addMember]);

  const mdContent = (() => {
    if (!mdOpen || !markdownData) return null;
    const { board: b, nodes } = markdownData;
    let md = `# ${b.icon} ${b.name}\n\n`;
    const textNodes = nodes.filter((n) => n.type === "text");
    const linkNodes = nodes.filter((n) => n.type === "link");
    const checklistNodes = nodes.filter((n) => n.type === "checklist");
    if (textNodes.length > 0) {
      md += "## Notes\n\n";
      for (const n of textNodes) {
        if (n.title) md += `### ${n.title}\n\n`;
        const content = n.content.trimStart().startsWith("<")
          ? n.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
          : n.content;
        md += `${content}\n\n`;
      }
    }
    if (checklistNodes.length > 0) {
      md += "## Checklists\n\n";
      for (const n of checklistNodes) {
        if (n.title) md += `### ${n.title}\n\n`;
        try {
          const items = JSON.parse(n.content);
          if (Array.isArray(items)) {
            for (const item of items) {
              md += `- [${item.checked ? "x" : " "}] ${item.text}\n`;
            }
            md += "\n";
          }
        } catch { md += `${n.content}\n\n`; }
      }
    }
    if (linkNodes.length > 0) {
      md += "## Links\n\n";
      for (const n of linkNodes) {
        const title = n.metadata?.title || n.content;
        md += `- [${title}](${n.content})`;
        if (n.metadata?.description) md += ` - ${n.metadata.description}`;
        md += "\n";
      }
    }
    if (nodes.length === 0) md += "*This board is empty.*\n";
    return md;
  })();

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {isOwner && (
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
          )}

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
              {isOwner && board.visibility === "shared" && (
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

          <Separator />

          <div>
            <label className="text-sm font-medium mb-2 block">
              Members
            </label>
            <div className="space-y-1.5 mb-2">
              {members?.map((m) => {
                const name = m.user?.name ?? m.user?.email ?? "Unknown";
                const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={m._id} className="flex items-center gap-2 text-xs">
                    {m.user?.profileImage ? (
                      <img src={m.user.profileImage} alt="" className="h-5 w-5 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <span className="flex-1 truncate">{name}</span>
                    {m.role === "owner" ? (
                      <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    ) : isOwner ? (
                      <button
                        onClick={() => removeMember({ boardId: board._id, userId: m.userId })}
                        className="p-0.5 rounded hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {isOwner && (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddMember();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={memberEmail}
                    onChange={(e) => { setMemberEmail(e.target.value); setMemberError(""); }}
                    placeholder="Email address"
                    type="email"
                    className="text-xs"
                  />
                  <Button variant="outline" size="icon" disabled={addingMember || !memberEmail.trim()}>
                    <UserPlus className="h-3.5 w-3.5" />
                  </Button>
                </form>
                {memberError && (
                  <p className="text-xs text-destructive mt-1">{memberError}</p>
                )}
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={() => setMdOpen(true)}
          >
            <FileText className="h-3.5 w-3.5" />
            Preview Markdown
          </Button>
        </div>
      </PopoverContent>

      <Dialog open={mdOpen} onOpenChange={setMdOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Markdown Preview</DialogTitle>
          </DialogHeader>
          <pre className="flex-1 overflow-auto text-xs font-mono bg-muted p-3 rounded-md whitespace-pre-wrap">
            {mdContent ?? "Loading..."}
          </pre>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 self-end"
            disabled={!mdContent}
            onClick={async () => {
              if (!mdContent) return;
              await navigator.clipboard.writeText(mdContent);
              setCopiedMd(true);
              setTimeout(() => setCopiedMd(false), 2000);
            }}
          >
            {copiedMd ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedMd ? "Copied" : "Copy"}
          </Button>
        </DialogContent>
      </Dialog>
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

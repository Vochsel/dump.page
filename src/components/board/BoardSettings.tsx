"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTheme } from "@/context/theme-context";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatBoardDataAsMarkdown } from "@/lib/board-markdown";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { PRO_MODE_STORAGE_KEY } from "@/lib/chat-providers";
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
  Globe,
  Settings,
  Copy,
  RefreshCw,
  Check,
  Rss,
  FileText,
  UserPlus,
  X,
  Crown,
  Bot,
  Wand2,
  HelpCircle,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { getBoardUrl } from "@/lib/board-url";

export type BoardSettingsData = {
  backgroundPattern?: "dots" | "paper" | "boxes" | "blank";
  backgroundColor?: string;
  contextType?: "default" | "skill" | "agent";
  systemPrompt?: string;
};

function RegenerateButton({ onRegenerate }: { onRegenerate: () => Promise<string> }) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    setSpinning(true);
    try {
      await onRegenerate();
      toast.success("Share link regenerated");
    } catch {
      toast.error("Failed to regenerate link");
    } finally {
      setSpinning(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="mt-2 gap-2 text-xs"
      onClick={handleClick}
      disabled={spinning}
    >
      <RefreshCw className={`h-3 w-3 ${spinning ? "animate-spin" : ""}`} />
      Regenerate link
    </Button>
  );
}

interface BoardShareProps {
  board: {
    _id: Id<"boards">;
    slug: string;
    visibility: "private" | "shared" | "public";
    shareToken?: string;
  };
  isOwner: boolean;
  isMember?: boolean;
}

export function BoardShare({ board, isOwner, isMember }: BoardShareProps) {
  const [copied, setCopied] = useState(false);
  const [copiedRss, setCopiedRss] = useState(false);
  const [proMode] = useLocalStorage(PRO_MODE_STORAGE_KEY, false);
  const [mdOpen, setMdOpen] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const updateBoard = useMutation(api.boards.updateBoard);
  const regenerateToken = useMutation(api.boards.regenerateShareToken);
  const addMember = useMutation(api.boardMembers.addMember);
  const removeMember = useMutation(api.boardMembers.removeMember);
  const members = useQuery(api.boardMembers.getMembers, isMember ? { boardId: board._id } : "skip");
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
    const { board: b, nodes, edges } = markdownData;
    const activeNodes = nodes.filter((n: { archived?: boolean }) => !n.archived);
    return formatBoardDataAsMarkdown(
      { name: `${b.icon} ${b.name}`, settings: b.settings },
      activeNodes.map((n) => ({
        id: n._id,
        type: n.type,
        content: n.content,
        title: n.title,
        position: n.position,
        metadata: n.metadata,
      })),
      (edges || []).map((e) => ({
        source: e.source as string,
        target: e.target as string,
      }))
    );
  })();

  const boardSlug = board.slug ?? board._id;

  const shareUrl =
    board.visibility === "shared" || board.visibility === "public"
      ? getBoardUrl(boardSlug, { visibility: board.visibility, shareToken: board.shareToken })
      : null;

  const rssUrl =
    board.visibility === "shared" || board.visibility === "public"
      ? (() => {
          const base = getBoardUrl(boardSlug, { visibility: board.visibility, shareToken: board.shareToken });
          // Insert /rss.xml before the query string (if any)
          const qIdx = base.indexOf("?");
          if (qIdx >= 0) {
            return `${base.slice(0, qIdx)}/rss.xml${base.slice(qIdx)}`;
          }
          return `${base}/rss.xml`;
        })()
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
          <Share2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Visibility
            </label>
            {isOwner ? (
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
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {board.visibility === "public" && <Globe className="h-3.5 w-3.5" />}
                {board.visibility === "shared" && <ExternalLink className="h-3.5 w-3.5" />}
                {board.visibility === "private" && <Settings className="h-3.5 w-3.5" />}
                <span className="capitalize">{board.visibility}</span>
              </div>
            )}
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
              {isOwner && board.visibility === "shared" && (
                <RegenerateButton
                  onRegenerate={() => regenerateToken({ boardId: board._id })}
                />
              )}
            </div>
          )}

          {proMode && rssUrl && (
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
            {isMember && (
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

export const BG_COLORS = [
  { value: "#f9fafb", dark: "#111113", label: "White" },
  { value: "#fef9ee", dark: "#171310", label: "Cream" },
  { value: "#fdf2f8", dark: "#170f15", label: "Pink" },
  { value: "#eff6ff", dark: "#0d1320", label: "Blue" },
  { value: "#f0fdf4", dark: "#0d1710", label: "Mint" },
  { value: "#faf5ff", dark: "#140f1a", label: "Lavender" },
  { value: "#f0f9ff", dark: "#0d141a", label: "Sky" },
];

export function resolveBgColor(lightColor: string, isDark: boolean): string {
  if (!isDark) return lightColor;
  const entry = BG_COLORS.find((c) => c.value === lightColor);
  return entry?.dark ?? "#111113";
}

const BG_PATTERNS: { value: BoardSettingsData["backgroundPattern"]; label: string }[] = [
  { value: "dots", label: "Dots" },
  { value: "paper", label: "Paper" },
  { value: "boxes", label: "Boxes" },
  { value: "blank", label: "Blank" },
];

interface BoardSettingsPopoverProps {
  boardId: Id<"boards">;
  settings: BoardSettingsData;
  canEdit: boolean;
}

const CONTEXT_TYPES: { value: BoardSettingsData["contextType"]; label: string; description: string; icon: typeof Settings }[] = [
  { value: "default", label: "Default", description: "Standard context dump", icon: FileText },
  { value: "skill", label: "Skill", description: "Usable as a skill by LLMs", icon: Wand2 },
  { value: "agent", label: "Agent", description: "Agent persona & goals", icon: Bot },
];

export function BoardSettingsPopover({
  boardId,
  settings,
  canEdit,
}: BoardSettingsPopoverProps) {
  const updateSettings = useMutation(api.boards.updateBoardSettings);
  const { resolved: theme } = useTheme();
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptValue, setPromptValue] = useState(settings.systemPrompt ?? "");
  const [proMode] = useLocalStorage(PRO_MODE_STORAGE_KEY, false);

  if (!canEdit) return null;

  const currentPattern = settings.backgroundPattern ?? "dots";
  const currentColor = settings.backgroundColor ?? "#ffffff";
  const currentContextType = settings.contextType ?? "default";

  const update = (patch: BoardSettingsData) => {
    updateSettings({ boardId, settings: patch });
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            {proMode && (
              <>
                {/* Context type */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Context Type
                    </label>
                    <Link href="/help/context-type" target="_blank">
                      <HelpCircle className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CONTEXT_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        onClick={() => update({ contextType: ct.value })}
                        title={ct.description}
                        className={`text-xs py-1.5 px-2 rounded-md border transition-colors flex items-center gap-1 justify-center ${
                          currentContextType === ct.value
                            ? "border-primary bg-primary/10 font-medium"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <ct.icon className="h-3 w-3" />
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* System prompt */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                    System Prompt
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => {
                      setPromptValue(settings.systemPrompt ?? "");
                      setPromptOpen(true);
                    }}
                  >
                    <FileText className="h-3 w-3" />
                    {settings.systemPrompt ? "Edit prompt" : "Add prompt"}
                  </Button>
                </div>

                <Separator />
              </>
            )}

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
                    style={{ backgroundColor: theme === "dark" ? c.dark : c.value }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>System Prompt</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            This prompt is included at the top of the generated markdown for LLMs.
          </p>
          <textarea
            className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
            placeholder="Enter a system prompt for this board..."
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            {settings.systemPrompt && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  update({ systemPrompt: "" });
                  setPromptOpen(false);
                }}
              >
                Remove
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                update({ systemPrompt: promptValue.trim() || undefined });
                setPromptOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

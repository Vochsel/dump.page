"use client";

import { useState, useEffect, useCallback } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronDown, Copy, Link2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getBoardUrl } from "@/lib/board-url";

const PROVIDERS = [
  {
    id: "claude",
    name: "Claude",
    favicon: "https://claude.ai/favicon.ico",
    buildUrl: (prompt: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    favicon: "https://chatgpt.com/favicon.ico",
    buildUrl: (prompt: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "grok",
    name: "Grok",
    favicon: "https://grok.com/images/favicon.svg",
    buildUrl: (prompt: string) =>
      `https://grok.com/?q=${encodeURIComponent(prompt)}`,
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

const STORAGE_KEY = "dump-chat-provider";
const SCRAPE_WARNED_KEY = "dump-scrape-warned";

interface ChatButtonProps {
  boardId: Id<"boards">;
  slug: string;
  visibility: "private" | "shared" | "public";
  shareToken?: string;
}

export function ChatButton({ boardId, slug, visibility, shareToken }: ChatButtonProps) {
  const [provider, setProvider] = useState<ProviderId>("claude");
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);
  const [showScrapeWarning, setShowScrapeWarning] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(null);
  const [copying, setCopying] = useState(false);
  const updateBoard = useMutation(api.boards.updateBoard);
  const hasMcp = useQuery(api.mcpAuth.hasActiveMcpToken);

  const boardUrl = getBoardUrl(slug, { visibility, shareToken });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ProviderId | null;
    if (saved && PROVIDERS.some((p) => p.id === saved)) {
      setProvider(saved);
    }
  }, []);

  const selectProvider = useCallback((id: ProviderId) => {
    setProvider(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const openProviderWithPrompt = useCallback(
    (prompt: string, id?: ProviderId) => {
      const chosen = id ?? provider;
      const p = PROVIDERS.find((p) => p.id === chosen)!;
      window.open(p.buildUrl(prompt), "_blank");
    },
    [provider]
  );

  const proceedToChat = useCallback(
    (chosen: ProviderId) => {
      if (visibility === "private" && !hasMcp) {
        setPendingProvider(chosen);
        setShowPrivateDialog(true);
        return;
      }
      const llmsUrl = boardUrl.replace(/\/b\/([^?]+)/, '/b/$1/llms.txt');
      const prompt = `scrape ${llmsUrl} as context to answer:\n`;
      openProviderWithPrompt(prompt, chosen);
    },
    [visibility, boardUrl, openProviderWithPrompt, hasMcp]
  );

  const openChat = useCallback(
    (id?: ProviderId) => {
      const chosen = id ?? provider;
      if (!localStorage.getItem(SCRAPE_WARNED_KEY)) {
        setPendingProvider(chosen);
        setShowScrapeWarning(true);
        return;
      }
      proceedToChat(chosen);
    },
    [provider, proceedToChat]
  );

  const handleScrapeWarningContinue = useCallback(() => {
    localStorage.setItem(SCRAPE_WARNED_KEY, "1");
    setShowScrapeWarning(false);
    const chosen = pendingProvider ?? provider;
    setPendingProvider(null);
    proceedToChat(chosen);
  }, [pendingProvider, provider, proceedToChat]);

  const handleCopyMarkdown = useCallback(async () => {
    setCopying(true);
    try {
      const url = `/api/board-markdown/${slug}`;
      const res = await fetch(url);
      const md = await res.text();
      const chosen = pendingProvider ?? provider;
      const prompt = `Use this board for context:\n\n${md}\n`;
      openProviderWithPrompt(prompt, chosen);
      setShowPrivateDialog(false);
      toast.success("Board context included in prompt");
    } catch {
      toast.error("Failed to fetch board markdown");
    } finally {
      setCopying(false);
    }
  }, [slug, pendingProvider, provider, openProviderWithPrompt]);

  const handleShareAndOpen = useCallback(async () => {
    try {
      const result = await updateBoard({ boardId, visibility: "shared" });
      const chosen = pendingProvider ?? provider;
      const token = result?.shareToken;
      const newBoardUrl = getBoardUrl(slug, { visibility: "shared", shareToken: token });
      const llmsUrl = newBoardUrl.replace(/\/b\/([^?]+)/, '/b/$1/llms.txt');
      const prompt = `scrape ${llmsUrl} as context to answer:\n`;
      openProviderWithPrompt(prompt, chosen);
      setShowPrivateDialog(false);
      toast.success("Board shared with magic link");
    } catch {
      toast.error("Failed to share board");
    }
  }, [boardId, updateBoard, pendingProvider, provider, slug, openProviderWithPrompt]);

  const current = PROVIDERS.find((p) => p.id === provider)!;
  const chosenProvider = PROVIDERS.find((p) => p.id === (pendingProvider ?? provider))!;

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-r-none pr-2 text-xs"
          onClick={() => openChat()}
          title={`Chat with ${current.name}`}
        >
          <img src={current.favicon} alt={current.name} className="h-3.5 w-3.5" />
          {current.name}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-6 rounded-l-none border-l border-border/40 px-0"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PROVIDERS.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => {
                  selectProvider(p.id);
                  openChat(p.id);
                }}
                className="gap-2"
              >
                <img src={p.favicon} alt={p.name} className="h-3.5 w-3.5" />
                {p.name}
                {p.id === provider && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    default
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showScrapeWarning} onOpenChange={setShowScrapeWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Heads up
            </DialogTitle>
            <DialogDescription>
              AI chat apps frequently change how they scrape external sites, so this may not always work reliably. For a consistent experience, use the <a href="/mcp" className="underline text-foreground font-medium">Dump MCP server</a> instead.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowScrapeWarning(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleScrapeWarningContinue}>
              Continue anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrivateDialog} onOpenChange={setShowPrivateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>This board is private</DialogTitle>
            <DialogDescription>
              {chosenProvider.name} can&apos;t access private boards. Choose how to share context:
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={handleCopyMarkdown}
              disabled={copying}
              className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Copy className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">Bake markdown into prompt</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Snapshot of the current board content will be included directly in the prompt. Board stays private.
                </div>
              </div>
            </button>
            <button
              onClick={handleShareAndOpen}
              className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
            >
              <Link2 className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">Share with magic link</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Makes the board &quot;shared&quot; so {chosenProvider.name} can read live content via a secure link. Anyone with the link can view.
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

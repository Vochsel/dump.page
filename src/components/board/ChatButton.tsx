"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, ChevronDown } from "lucide-react";

const PROVIDERS = [
  {
    id: "claude",
    name: "Claude",
    buildUrl: (prompt: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    buildUrl: (prompt: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "gemini",
    name: "Gemini",
    buildUrl: (prompt: string) =>
      `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "grok",
    name: "Grok",
    buildUrl: (prompt: string) =>
      `https://grok.com/?q=${encodeURIComponent(prompt)}`,
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

const STORAGE_KEY = "dump-chat-provider";

function buildMarkdown(
  board: { icon: string; name: string },
  nodes: Array<{
    type: string;
    content: string;
    title?: string;
    metadata?: { title?: string; description?: string } | null;
  }>
): string {
  let md = `# ${board.icon} ${board.name}\n\n`;
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
      } catch {
        md += `${n.content}\n\n`;
      }
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
}

interface ChatButtonProps {
  boardId: Id<"boards">;
}

export function ChatButton({ boardId }: ChatButtonProps) {
  const [provider, setProvider] = useState<ProviderId>("claude");
  const markdownData = useQuery(api.boards.getBoardForMarkdown, { boardId });

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

  const openChat = useCallback(
    (id?: ProviderId) => {
      const chosen = id ?? provider;
      if (!markdownData) return;
      const md = buildMarkdown(markdownData.board, markdownData.nodes);
      const prompt = `Use this context to help have this conversation:\n\n${md}`;
      const p = PROVIDERS.find((p) => p.id === chosen)!;
      window.open(p.buildUrl(prompt), "_blank");
    },
    [provider, markdownData]
  );

  const current = PROVIDERS.find((p) => p.id === provider)!;

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 rounded-r-none pr-2 text-xs"
        onClick={() => openChat()}
        disabled={!markdownData}
        title={`Chat with ${current.name}`}
      >
        <MessageSquare className="h-3.5 w-3.5" />
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
            >
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
  );
}

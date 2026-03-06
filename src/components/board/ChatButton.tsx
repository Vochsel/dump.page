"use client";

import { useState, useEffect, useCallback } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";

const SITE_URL = "https://www.get-dump.com";

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
    id: "gemini",
    name: "Gemini",
    favicon: "https://gemini.google.com/favicon.ico",
    buildUrl: (prompt: string) =>
      `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "grok",
    name: "Grok",
    favicon: "https://grok.com/favicon.ico",
    buildUrl: (prompt: string) =>
      `https://grok.com/?q=${encodeURIComponent(prompt)}`,
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

const STORAGE_KEY = "dump-chat-provider";

interface ChatButtonProps {
  boardId: Id<"boards">;
  slug: string;
}

export function ChatButton({ boardId, slug }: ChatButtonProps) {
  const [provider, setProvider] = useState<ProviderId>("claude");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? undefined;

  const boardUrl = `${SITE_URL}/b/${slug}${token ? `?token=${token}` : ""}`;

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
      const prompt = `Use this board for context: ${boardUrl}`;
      const p = PROVIDERS.find((p) => p.id === chosen)!;
      window.open(p.buildUrl(prompt), "_blank");
    },
    [provider, boardUrl]
  );

  const current = PROVIDERS.find((p) => p.id === provider)!;

  return (
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
  );
}

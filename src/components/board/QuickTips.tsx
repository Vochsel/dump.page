"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tip = {
  id: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

const TIPS: Tip[] = [
  {
    id: "copy-share-url",
    title: "Quick share",
    body: "Press Ctrl+C (or Cmd+C) with nothing selected to copy this board's share URL to your clipboard — ready to paste into any AI chatbot.",
  },
  {
    id: "customize-board",
    title: "Make it yours",
    body: "Try changing the background color and pattern via the settings button in the top toolbar. Each board can have its own look!",
  },
  {
    id: "snap-to-grid",
    title: "Snap to grid",
    body: "Enable snap-to-grid in the preferences menu (bottom left) to keep your cards neatly aligned. Great for organizing bigger boards!",
  },
  {
    id: "connect-mcp",
    title: "Connect via MCP",
    body: "Connect Dump as an MCP server in Claude, Cursor, or any MCP-compatible client to give your LLM live access to your boards — keeping context perfectly in sync as you work.",
    cta: { label: "Learn more", href: "/mcp" },
  },
  {
    id: "quick-search",
    title: "Quick search",
    body: "Press Cmd/Ctrl+K to quickly search for items in any board or navigate to recent boards.",
  },
];

const STORAGE_KEY_DISMISSED = "dump-tips-dismissed";
const STORAGE_KEY_NEVER = "dump-tips-never";
const STORAGE_KEY_LAST_SHOWN = "dump-tips-last-shown";

function getDismissedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_DISMISSED) || "[]");
  } catch {
    return [];
  }
}

function getNeverShow(): boolean {
  return localStorage.getItem(STORAGE_KEY_NEVER) === "true";
}

function getLastShownDate(): string | null {
  return localStorage.getItem(STORAGE_KEY_LAST_SHOWN);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function QuickTips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getNeverShow()) return;
    if (getLastShownDate() === todayStr()) return;

    const dismissed = getDismissedIds();
    const next = TIPS.find((t) => !dismissed.includes(t.id));
    if (!next) return;

    setTip(next);
    setVisible(true);
    localStorage.setItem(STORAGE_KEY_LAST_SHOWN, todayStr());
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (tip) {
      const dismissed = getDismissedIds();
      if (!dismissed.includes(tip.id)) {
        localStorage.setItem(
          STORAGE_KEY_DISMISSED,
          JSON.stringify([...dismissed, tip.id])
        );
      }
    }
  };

  const neverShow = () => {
    localStorage.setItem(STORAGE_KEY_NEVER, "true");
    setVisible(false);
  };

  if (!visible || !tip) return null;

  return (
    <div className="absolute bottom-16 left-4 z-50 max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border rounded-xl shadow-lg p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{tip.title}</p>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 -mt-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {tip.body}
        </p>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={neverShow}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Don&apos;t show tips
          </button>
          <div className="flex items-center gap-1">
            {tip.cta && (
              <Button variant="outline" size="sm" className="h-6 text-xs px-2" asChild>
                <Link href={tip.cta.href}>{tip.cta.label}</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

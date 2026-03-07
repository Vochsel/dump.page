"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Bug, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changelog, type ChangelogEntry } from "@/lib/changelog";
import { BUILD_VERSION } from "@/lib/constants";
import { DraggableCard } from "@/components/landing/DraggableCard";
import { SmallLoginButton } from "@/components/auth/SmallLoginButton";

type Filter = "all" | "feature" | "fix";

function EntryIcon({ type }: { type: ChangelogEntry["type"] }) {
  if (type === "feature") return <Sparkles className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />;
  return <Bug className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />;
}

const stickyNotes = [
  { top: "8%", left: "calc(50% - 520px)", rotate: "rotate-[3deg]", bg: "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200/80 dark:border-yellow-700/40", color: "text-yellow-700 dark:text-yellow-300", title: "TODO:", body: "Add dark mode for the changelog page... eventually" },
  { top: "22%", left: "calc(50% + 400px)", rotate: "rotate-[-2deg]", bg: "bg-pink-100 dark:bg-pink-900/40 border-pink-200/80 dark:border-pink-700/40", color: "text-pink-700 dark:text-pink-300", title: undefined, body: "Remember: ship it before it's perfect" },
  { top: "42%", left: "calc(50% - 540px)", rotate: "rotate-[1.5deg]", bg: "bg-blue-100 dark:bg-blue-900/40 border-blue-200/80 dark:border-blue-700/40", color: "text-blue-700 dark:text-blue-300", title: "Fun fact", body: "This changelog was built on a Dump board" },
  { top: "58%", left: "calc(50% + 410px)", rotate: "rotate-[-3deg]", bg: "bg-green-100 dark:bg-green-900/40 border-green-200/80 dark:border-green-700/40", color: "text-green-700 dark:text-green-300", title: undefined, body: "If you're reading this, you're our favorite user" },
  { top: "75%", left: "calc(50% - 530px)", rotate: "rotate-[2deg]", bg: "bg-purple-100 dark:bg-purple-900/40 border-purple-200/80 dark:border-purple-700/40", color: "text-purple-700 dark:text-purple-300", title: "Secret", body: "There's a hidden sound when you add a card" },
  { top: "88%", left: "calc(50% + 390px)", rotate: "rotate-[-1deg]", bg: "bg-orange-100 dark:bg-orange-900/40 border-orange-200/80 dark:border-orange-700/40", color: "text-orange-700 dark:text-orange-300", title: undefined, body: "We spent way too long picking these colors" },
];

const linkCards = [
  { top: "15%", left: "calc(50% + 410px)", rotate: "rotate-[-1deg]", emoji: "\u{1F986}", title: "Rubber Duck Debugging", subtitle: "Our #1 dev tool" },
  { top: "35%", left: "calc(50% + 420px)", rotate: "rotate-[2deg]", emoji: "\u{2615}", title: "Coffee Counter", subtitle: "4,217 cups & counting" },
  { top: "50%", left: "calc(50% - 550px)", rotate: "rotate-[-1.5deg]", emoji: "\u{1F3B5}", title: "Lofi Beats Playlist", subtitle: "Fuel for shipping" },
  { top: "65%", left: "calc(50% - 530px)", rotate: "rotate-[1deg]", emoji: "\u{1F680}", title: "Launch Checklist", subtitle: "Almost there..." },
  { top: "82%", left: "calc(50% - 540px)", rotate: "rotate-[-2deg]", emoji: "\u{1F354}", title: "Lunch Decision Board", subtitle: "The hardest problem" },
  { top: "92%", left: "calc(50% + 400px)", rotate: "rotate-[1.5deg]", emoji: "\u{1F431}", title: "Office Cat Pics", subtitle: "Very important folder" },
];

export default function ChangelogPage() {
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <div className="min-h-screen bg-[#fef9ee] dark:bg-gray-950 relative overflow-hidden">
      {/* Whiteboard decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-[0.04]">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Tape strips at top corners */}
      <div className="absolute top-4 left-8 w-16 h-6 bg-amber-200/40 dark:bg-amber-700/20 rotate-[-8deg] rounded-sm" />
      <div className="absolute top-4 right-8 w-16 h-6 bg-amber-200/40 dark:bg-amber-700/20 rotate-[5deg] rounded-sm" />

      {/* Draggable sticky notes scattered across viewport */}
      {stickyNotes.map((note, i) => (
        <DraggableCard
          key={`sticky-${i}`}
          className={`absolute ${note.rotate} ${note.bg} border rounded-sm p-3 shadow-md w-36 hidden xl:block z-20`}
          style={{ top: note.top, left: note.left }}
        >
          {note.title && <p className={`text-[11px] font-medium ${note.color}`}>{note.title}</p>}
          <p className={`text-[10px] ${note.color} ${note.title ? "mt-1" : ""} leading-relaxed`}>{note.body}</p>
        </DraggableCard>
      ))}

      {/* Draggable link cards scattered across viewport */}
      {linkCards.map((card, i) => (
        <DraggableCard
          key={`link-${i}`}
          className={`absolute ${card.rotate} bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-700 rounded-lg p-2.5 shadow-sm w-40 hidden xl:block z-20`}
          style={{ top: card.top, left: card.left }}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-stone-100 dark:bg-gray-800 rounded flex items-center justify-center text-[10px]">{card.emoji}</div>
            <div>
              <p className="text-[10px] font-medium text-stone-700 dark:text-stone-300 truncate">{card.title}</p>
              <p className="text-[9px] text-stone-400 dark:text-stone-500">{card.subtitle}</p>
            </div>
          </div>
        </DraggableCard>
      ))}

      <header className="relative z-10 border-b border-amber-200/40 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/dump.png" alt="Dump" className="h-9" />
            <span className="font-[family-name:var(--font-dynapuff)] text-lg text-gray-800 dark:text-gray-200">
              Changelog
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/help">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </Link>
            <SmallLoginButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xs text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide mr-2">
            Filter
          </span>
          {(["all", "feature", "fix"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 shadow-sm"
                  : "bg-white/60 dark:bg-gray-800/60 text-stone-500 dark:text-stone-400 hover:bg-white dark:hover:bg-gray-800 border border-stone-200 dark:border-gray-700"
              }`}
            >
              {f === "all" ? "All" : f === "feature" ? "Features" : "Fixes"}
            </button>
          ))}
        </div>

        {/* Version sections */}
        <div className="space-y-10">
          {changelog.map((version) => {
            const filteredEntries = version.entries.filter(
              (e) => filter === "all" || e.type === filter
            );

            return (
              <section
                key={version.version}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-stone-200/60 dark:border-gray-800 shadow-sm p-6 relative"
              >
                {/* Sticky note tab */}
                <div className="absolute -top-3 left-6 bg-amber-100 dark:bg-amber-900/60 px-3 py-0.5 rounded-t-md border border-b-0 border-amber-200/60 dark:border-amber-700/40 text-xs font-mono text-amber-700 dark:text-amber-300">
                  v{version.version}
                </div>

                <div className="flex items-baseline justify-between mb-4 mt-1">
                  <h2 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-stone-800 dark:text-stone-100">
                    Version {version.version}
                  </h2>
                  <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">{version.date}</span>
                </div>

                <div className="space-y-2">
                  {version.entries.map((entry, i) => {
                    const dimmed = filter !== "all" && entry.type !== filter;
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2.5 py-1.5 transition-opacity duration-200 ${
                          dimmed ? "opacity-20" : ""
                        }`}
                      >
                        <div className="mt-0.5">
                          <EntryIcon type={entry.type} />
                        </div>
                        <span className="text-sm text-stone-700 dark:text-stone-300">{entry.description}</span>
                      </div>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <p className="text-sm text-stone-400 dark:text-stone-500 italic py-2">
                      No {filter === "feature" ? "features" : "fixes"} in this version.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="text-center text-xs text-stone-300 dark:text-stone-600 font-mono mt-10">
          v{BUILD_VERSION}
        </div>
      </main>
    </div>
  );
}

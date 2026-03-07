"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changelog, type ChangelogEntry } from "@/lib/changelog";
import { BUILD_VERSION } from "@/lib/constants";

type Filter = "all" | "feature" | "fix";

function EntryIcon({ type }: { type: ChangelogEntry["type"] }) {
  if (type === "feature") return <Sparkles className="h-3.5 w-3.5 text-amber-500" />;
  return <Bug className="h-3.5 w-3.5 text-blue-500" />;
}

export default function ChangelogPage() {
  const [filter, setFilter] = useState<Filter>("all");

  return (
    <div className="min-h-screen bg-[#fef9ee] dark:bg-gray-950 relative overflow-hidden">
      {/* Whiteboard decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid pattern */}
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
      <div className="absolute top-4 left-8 w-16 h-6 bg-amber-200/40 rotate-[-8deg] rounded-sm" />
      <div className="absolute top-4 right-8 w-16 h-6 bg-amber-200/40 rotate-[5deg] rounded-sm" />

      {/* Pin dots */}
      <div className="absolute top-6 left-1/3 w-3 h-3 bg-red-400 rounded-full shadow-sm" />
      <div className="absolute top-8 right-1/4 w-3 h-3 bg-blue-400 rounded-full shadow-sm" />

      <header className="relative z-10 border-b border-amber-200/40 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/dump.png" alt="Dump" className="h-9" />
            <span className="font-[family-name:var(--font-dynapuff)] text-lg text-gray-800">
              Changelog
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xs text-stone-400 font-medium uppercase tracking-wide mr-2">
            Filter
          </span>
          {(["all", "feature", "fix"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? "bg-stone-800 text-white shadow-sm"
                  : "bg-white/60 text-stone-500 hover:bg-white border border-stone-200"
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
                <div className="absolute -top-3 left-6 bg-amber-100 px-3 py-0.5 rounded-t-md border border-b-0 border-amber-200/60 text-xs font-mono text-amber-700">
                  v{version.version}
                </div>

                <div className="flex items-baseline justify-between mb-4 mt-1">
                  <h2 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-stone-800 dark:text-stone-100">
                    Version {version.version}
                  </h2>
                  <span className="text-xs text-stone-400 font-mono">{version.date}</span>
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
                    <p className="text-sm text-stone-400 italic py-2">
                      No {filter === "feature" ? "features" : "fixes"} in this version.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="text-center text-xs text-stone-300 font-mono mt-10">
          v{BUILD_VERSION}
        </div>
      </main>
    </div>
  );
}

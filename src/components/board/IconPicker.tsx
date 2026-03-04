"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { LUCIDE_ICONS, EMOJI_OPTIONS, BoardIcon } from "./BoardIcon";
import { Search } from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"emoji" | "icon">(
    value.startsWith("lucide:") ? "icon" : "emoji"
  );

  const query = search.toLowerCase().trim();

  const filteredEmojis = query
    ? EMOJI_OPTIONS.filter(() => false) // can't meaningfully search emoji by text
    : EMOJI_OPTIONS;

  const lucideEntries = Object.entries(LUCIDE_ICONS);
  const filteredIcons = query
    ? lucideEntries.filter(([name]) => name.includes(query))
    : lucideEntries;

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <button
          onClick={() => setTab("emoji")}
          className={`text-xs py-1 px-3 rounded-md border transition-colors ${
            tab === "emoji"
              ? "border-primary bg-primary/10 font-medium"
              : "border-border hover:bg-muted"
          }`}
        >
          Emoji
        </button>
        <button
          onClick={() => setTab("icon")}
          className={`text-xs py-1 px-3 rounded-md border transition-colors ${
            tab === "icon"
              ? "border-primary bg-primary/10 font-medium"
              : "border-border hover:bg-muted"
          }`}
        >
          Icons
        </button>
      </div>

      {tab === "icon" && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs pl-7"
          />
        </div>
      )}

      <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
        {tab === "emoji"
          ? filteredEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onChange(emoji)}
                className={`text-lg p-1 rounded-md hover:bg-muted transition-colors aspect-square flex items-center justify-center ${
                  value === emoji ? "bg-muted ring-2 ring-primary" : ""
                }`}
              >
                {emoji}
              </button>
            ))
          : filteredIcons.map(([name]) => {
              const iconValue = `lucide:${name}`;
              return (
                <button
                  key={name}
                  onClick={() => onChange(iconValue)}
                  title={name}
                  className={`p-1 rounded-md hover:bg-muted transition-colors aspect-square flex items-center justify-center ${
                    value === iconValue ? "bg-muted ring-2 ring-primary" : ""
                  }`}
                >
                  <BoardIcon icon={iconValue} size={16} />
                </button>
              );
            })}
        {tab === "icon" && filteredIcons.length === 0 && (
          <div className="col-span-8 text-xs text-muted-foreground text-center py-3">
            No icons found
          </div>
        )}
      </div>
    </div>
  );
}

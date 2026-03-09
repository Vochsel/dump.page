"use client";

import { useState } from "react";
import Link from "next/link";
import { DraggableCard } from "@/components/landing/DraggableCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const aiLogos = [
  { name: "ChatGPT", icon: "https://cdn.worldvectorlogo.com/logos/chatgpt-6.svg" },
  { name: "Claude", icon: "/claude-color.svg" },
  { name: "Gemini", icon: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg" },
  { name: "Grok", icon: "https://cdn.worldvectorlogo.com/logos/grok-1.svg" },
];

const steps = [
  { number: "1", label: "Dump onto a board", description: "Drop links, notes, and ideas onto your board." },
  { number: "2", label: "Copy the board URL", description: "Grab the link to your board from the address bar." },
  { number: "3", label: "Paste in {ai}", description: "Share the URL in your AI chat as context." },
  { number: "4", label: "Profit!", description: "AI reads your board as structured markdown." },
];

export function AiWorksWithSection() {
  const [selectedAi, setSelectedAi] = useState<string | null>(null);

  return (
    <div className="mt-16 max-w-xl w-full space-y-3 px-2">
      <p className="text-center text-xs font-[family-name:var(--font-poppins)] text-gray-700 dark:text-gray-300 uppercase tracking-widest">
        Works with your favorite AI
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {aiLogos.map((ai) => (
          <DraggableCard
            key={ai.name}
            className="flex items-center gap-2 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 cursor-pointer"
            onClick={() => setSelectedAi(ai.name)}
          >
            <img src={ai.icon} alt={ai.name} className="h-5 w-5" />
            <span className="text-sm text-gray-700 dark:text-gray-200 font-medium font-[family-name:var(--font-poppins)]">
              {ai.name}
            </span>
          </DraggableCard>
        ))}
      </div>
      <p className="text-center text-xs text-gray-600 font-[family-name:var(--font-poppins)]">
        Just paste a board link — or connect via{" "}
        <span className="text-gray-700 font-medium">MCP server</span> for deeper integration.
      </p>

      <Dialog open={!!selectedAi} onOpenChange={(open) => !open && setSelectedAi(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-poppins)] flex items-center gap-2">
              {selectedAi && (
                <img
                  src={aiLogos.find((a) => a.name === selectedAi)?.icon}
                  alt={selectedAi}
                  className="h-5 w-5"
                />
              )}
              Use Dump with {selectedAi}
            </DialogTitle>
            <DialogDescription className="font-[family-name:var(--font-poppins)]">
              4 simple steps to give {selectedAi} the context it needs.
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3 py-2">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center font-[family-name:var(--font-poppins)]">
                  {step.number}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 font-[family-name:var(--font-poppins)]">
                    {step.label.replace("{ai}", selectedAi ?? "")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-[family-name:var(--font-poppins)]">
                    {step.description.replace("{ai}", selectedAi ?? "")}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/help">See full how-to</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/new">Start dumping</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

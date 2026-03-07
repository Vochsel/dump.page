"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUILD_VERSION } from "@/lib/constants";

const AI_PROVIDERS = [
  {
    name: "ChatGPT",
    icon: "https://chatgpt.com/favicon.ico",
    steps: [
      "Share your board using the share button in the header",
      "Click the Chat button and select ChatGPT from the dropdown",
      "ChatGPT will open with your board context ready to go",
    ],
  },
  {
    name: "Claude",
    icon: "https://claude.ai/favicon.ico",
    steps: [
      "Share your board using the share button in the header",
      "Click the Chat button and select Claude from the dropdown",
      "Claude will open with your board context pre-loaded",
    ],
  },
  {
    name: "Claude Code",
    icon: "https://claude.ai/favicon.ico",
    steps: [
      "Share your board using the share button in the header",
      "Copy the board's share link and give it to Claude Code",
      "The /llms.txt format is optimized for code-assistant workflows",
    ],
  },
  {
    name: "Codex",
    icon: "https://chatgpt.com/favicon.ico",
    steps: [
      "Share your board using the share button in the header",
      "Copy the board's share link and include it in your Codex prompt",
      "Codex will fetch and use the board content as reference material",
    ],
  },
  {
    name: "Grok",
    icon: "https://grok.com/images/favicon.svg",
    steps: [
      "Share your board using the share button in the header",
      "Click the Chat button and select Grok from the dropdown",
      "Grok will open with your board context in the prompt",
    ],
  },
  {
    name: "Gemini",
    icon: "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png",
    steps: [
      "Share your board using the share button in the header",
      "Copy the board's share link and paste it into a Gemini conversation",
      "Gemini can read the board content and use it as context",
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/dump.png" alt="Dump" className="h-9" />
            <span className="font-[family-name:var(--font-dynapuff)] text-lg text-gray-800">
              Help
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold text-stone-900 mb-2">
          Getting Started with Dump
        </h1>
        <p className="text-stone-500 mb-10">
          Dump is a shared whiteboard for links, notes, and checklists — readable by humans and AI agents.
        </p>

        {/* Adding context */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-stone-800 mb-4">
            Ways to add context
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Right-click the canvas", desc: "Add text notes, links, or checklists at the cursor position." },
              { title: "Paste", desc: "Paste any URL or text onto the canvas. URLs automatically become link cards with metadata." },
              { title: "Drag and drop", desc: "Drag links from your browser or text files from your desktop directly onto the board." },
              { title: "Toolbar", desc: "Use the toolbar buttons at the bottom of the canvas to add items at the center of your view." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-lg border border-stone-200 p-4">
                <h3 className="font-medium text-stone-800 text-sm">{item.title}</h3>
                <p className="text-xs text-stone-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sharing */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-stone-800 mb-4">
            Sharing your board
          </h2>
          <div className="bg-white rounded-lg border border-stone-200 p-4 text-sm text-stone-600 space-y-2">
            <p>Click the <strong>share button</strong> in the board header to set your board&apos;s visibility and copy the share link.</p>
            <ul className="space-y-1.5 ml-4 list-disc text-stone-500 text-xs">
              <li><strong className="text-stone-700">Private</strong> — only you and invited members can access</li>
              <li><strong className="text-stone-700">Shared</strong> — anyone with the magic link can view</li>
              <li><strong className="text-stone-700">Public</strong> — anyone with the board URL can view</li>
            </ul>
            <p className="text-xs text-stone-400">Shared and public boards are automatically accessible to AI assistants via the board&apos;s <code className="bg-stone-100 px-1 rounded font-mono">/llms.txt</code> endpoint.</p>
          </div>
        </section>

        {/* AI provider sections */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-stone-800 mb-4">
            Using with AI assistants
          </h2>
          <p className="text-stone-500 text-sm mb-6">
            Every shared or public board has a <code className="bg-stone-200 px-1.5 py-0.5 rounded text-xs font-mono">/llms.txt</code> endpoint that serves board content in a plain-text format optimized for AI consumption.
          </p>
          <div className="space-y-4">
            {AI_PROVIDERS.map((provider) => (
              <details
                key={provider.name}
                className="bg-white rounded-lg border border-stone-200 overflow-hidden group"
              >
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50 transition-colors">
                  <img src={provider.icon} alt={provider.name} className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm text-stone-800">{provider.name}</span>
                </summary>
                <div className="px-4 pb-4 border-t border-stone-100">
                  <ol className="space-y-2 mt-3">
                    {provider.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm text-stone-600">
                        <span className="text-stone-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-stone-800 mb-4">
            Keyboard shortcuts
          </h2>
          <div className="bg-white rounded-lg border border-stone-200 divide-y divide-stone-100">
            {[
              { keys: "Cmd/Ctrl + C", desc: "Copy board share link (when nothing is selected)" },
              { keys: "Cmd/Ctrl + Z", desc: "Undo" },
              { keys: "Cmd/Ctrl + Shift + Z", desc: "Redo" },
              { keys: "F", desc: "Fit view to selected nodes (or all nodes)" },
              { keys: "Right-click", desc: "Context menu to add items or manage nodes" },
            ].map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-stone-600">{shortcut.desc}</span>
                <kbd className="bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-xs font-mono text-stone-600">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center text-xs text-stone-300 font-mono">
          v{BUILD_VERSION}
        </div>
      </main>
    </div>
  );
}

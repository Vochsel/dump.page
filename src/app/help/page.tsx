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
      "Open your board and click the Chat button in the header",
      "Select ChatGPT from the dropdown",
      'If your board is shared or public, the board URL with /llms.txt will be sent as context',
      'If private, choose to bake markdown into the prompt or share with a magic link',
    ],
  },
  {
    name: "Claude",
    icon: "https://claude.ai/favicon.ico",
    steps: [
      "Open your board and click the Chat button in the header",
      "Select Claude from the dropdown",
      "Claude will open with your board context pre-loaded",
      "You can also paste the board's llms.txt URL directly into a conversation",
    ],
  },
  {
    name: "Claude Code",
    icon: "https://claude.ai/favicon.ico",
    steps: [
      "Copy your board's llms.txt URL from the share dialog",
      "Use WebFetch or curl to fetch the content in your CLI session",
      "The plain-text format is optimized for code-assistant workflows",
    ],
  },
  {
    name: "Codex",
    icon: "https://chatgpt.com/favicon.ico",
    steps: [
      "Copy the llms.txt URL from the share dialog",
      "Include it in your Codex prompt as a context URL",
      "Codex will fetch and use the board content as reference material",
    ],
  },
  {
    name: "Grok",
    icon: "https://grok.com/images/favicon.svg",
    steps: [
      "Open your board and click the Chat button in the header",
      "Select Grok from the dropdown",
      "Grok will open with your board context in the prompt",
    ],
  },
  {
    name: "Gemini",
    icon: "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png",
    steps: [
      "Copy your board's share URL or llms.txt URL",
      "Paste it into a Gemini conversation",
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
            Adding context to your board
          </h2>
          <div className="space-y-3">
            {[
              { step: "1", title: "Right-click the canvas", desc: "Choose Add Text, Add Link, or Add Checklist to create a new item at the cursor position." },
              { step: "2", title: "Paste a URL", desc: "Copy any URL and paste it onto the canvas. Dump auto-detects URLs and creates link cards with metadata." },
              { step: "3", title: "Drag and drop", desc: "Drag links from your browser or text files from your desktop directly onto the board." },
              { step: "4", title: "Share your board", desc: "Click the share icon in the header to set visibility and copy the share link." },
            ].map((item) => (
              <div key={item.step} className="flex gap-3 bg-white rounded-lg border border-stone-200 p-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-sm font-semibold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-medium text-stone-800 text-sm">{item.title}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
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

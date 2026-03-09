"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmallLoginButton } from "@/components/auth/SmallLoginButton";
import { Footer } from "@/components/Footer";
import { useState } from "react";

const MCP_URL = "https://www.dump.page/api/mcp";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-stone-200/50 dark:bg-gray-700/50 hover:bg-stone-300/50 dark:hover:bg-gray-600/50 transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
      )}
    </button>
  );
}

const PROVIDERS = [
  {
    name: "Claude",
    icon: "https://claude.ai/favicon.ico",
    description: "Add Dump as an MCP integration in Claude's web interface.",
    steps: [
      <>Go to <strong>Settings &rarr; Integrations</strong> in Claude</>,
      <>Click <strong>Add More</strong> and paste the server URL:</>,
    ],
    url: MCP_URL,
    note: "Claude will open a browser window to authorize with your Dump account via Google sign-in.",
    youtubeId: "2rENNLjg954",
  },
  {
    name: "ChatGPT",
    icon: "https://chatgpt.com/favicon.ico",
    description: "Connect Dump as an MCP connector in ChatGPT.",
    steps: [
      <>Go to <strong>Settings &rarr; Connectors</strong> in ChatGPT</>,
      <>Click <strong>Add connector</strong> and paste the server URL:</>,
    ],
    url: MCP_URL,
    note: "ChatGPT will redirect you to authorize with your Dump account. Once connected, Dump tools will appear in your conversations.",
    youtubeId: "EH6_v0GtFmU",
  },
  {
    name: "Claude Code",
    icon: "https://claude.ai/favicon.ico",
    description: "Add the Dump MCP server to Claude Code's configuration.",
    steps: [
      <>Run the following command in your terminal:</>,
    ],
    command: `claude mcp add dump-mcp --transport http ${MCP_URL}`,
    note: "Claude Code will prompt you to authorize in your browser on first use. Your boards will then be accessible as tools.",
  },
  {
    name: "Codex",
    icon: "https://chatgpt.com/favicon.ico",
    description: "Add the Dump MCP server to Codex's configuration.",
    steps: [
      <>Add the following to your <code className="bg-stone-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">.codex/config.json</code>:</>,
    ],
    json: JSON.stringify({
      mcpServers: {
        "dump-mcp": {
          type: "http",
          url: MCP_URL,
        },
      },
    }, null, 2),
    note: "Codex will prompt you to authorize on first use. Once connected, you can ask Codex to read and update your Dump boards.",
  },
];

export default function McpPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950">
      <header className="border-b border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/dump.png" alt="Dump" className="h-9" />
            <span className="font-[family-name:var(--font-dynapuff)] text-lg text-gray-800 dark:text-gray-200">
              MCP Integration
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/help">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                Help
              </Button>
            </Link>
            <SmallLoginButton />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Connect Dump to your AI assistant
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-4">
          The Dump MCP server lets AI assistants read your boards, search your notes, and create new content — all through a secure OAuth connection.
        </p>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-800 p-4 mb-10">
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Available tools</h3>
          <ul className="space-y-1 text-sm text-stone-500 dark:text-stone-400">
            <li><strong className="text-stone-700 dark:text-stone-300">list_boards</strong> — List all your boards</li>
            <li><strong className="text-stone-700 dark:text-stone-300">get_board</strong> — Read the full content of a board</li>
            <li><strong className="text-stone-700 dark:text-stone-300">search_boards</strong> — Search boards by name</li>
            <li><strong className="text-stone-700 dark:text-stone-300">search_items</strong> — Search notes, links, and checklists across boards</li>
          </ul>
        </div>

        <div className="space-y-6">
          {PROVIDERS.map((provider) => (
            <details
              key={provider.name}
              className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-800 overflow-hidden group"
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors">
                <img src={provider.icon} alt={provider.name} className="h-5 w-5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-sm text-stone-800 dark:text-stone-200">{provider.name}</span>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{provider.description}</p>
                </div>
              </summary>
              <div className="px-5 pb-5 border-t border-stone-100 dark:border-gray-800">
                <ol className="space-y-3 mt-4">
                  {provider.steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-stone-600 dark:text-stone-300">
                      <span className="text-stone-400 dark:text-stone-500 font-mono text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {provider.url && (
                  <div className="relative mt-3 ml-5">
                    <pre className="bg-stone-100 dark:bg-gray-800 rounded-lg px-4 py-3 pr-10 text-sm font-mono text-stone-700 dark:text-stone-300 overflow-x-auto">
                      {provider.url}
                    </pre>
                    <CopyButton text={provider.url} />
                  </div>
                )}

                {provider.command && (
                  <div className="relative mt-3 ml-5">
                    <pre className="bg-stone-100 dark:bg-gray-800 rounded-lg px-4 py-3 pr-10 text-sm font-mono text-stone-700 dark:text-stone-300 overflow-x-auto">
                      {provider.command}
                    </pre>
                    <CopyButton text={provider.command} />
                  </div>
                )}

                {provider.json && (
                  <div className="relative mt-3 ml-5">
                    <pre className="bg-stone-100 dark:bg-gray-800 rounded-lg px-4 py-3 pr-10 text-sm font-mono text-stone-700 dark:text-stone-300 overflow-x-auto">
                      {provider.json}
                    </pre>
                    <CopyButton text={provider.json} />
                  </div>
                )}

                {provider.note && (
                  <p className="mt-3 ml-5 text-xs text-stone-400 dark:text-stone-500">
                    {provider.note}
                  </p>
                )}

                {provider.youtubeId && (
                  <div className="mt-4 ml-5 aspect-video rounded-lg overflow-hidden border border-stone-200 dark:border-gray-700">
                    <iframe
                      src={`https://www.youtube.com/embed/${provider.youtubeId}`}
                      title={`${provider.name} MCP setup guide`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10">
          <Footer />
        </div>
      </main>
    </div>
  );
}

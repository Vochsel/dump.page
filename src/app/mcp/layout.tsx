import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Dump MCP | Shared context for ChatGPT, Claude, Codex, and AI agents",
  description:
    "Connect Dump to ChatGPT, Claude, Claude Code, Codex, and other MCP-aware tools so they can read and update shared project boards.",
  path: "/mcp",
  keywords: [
    "Dump MCP server",
    "ChatGPT MCP connector",
    "Claude MCP integration",
    "shared context for AI agents",
  ],
});

export default function McpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

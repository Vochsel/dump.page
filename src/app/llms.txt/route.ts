import { BLOG_POSTS } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

export async function GET() {
  const body = [
    "# Dump",
    "",
    "Dump is a collaborative context board for humans and AI.",
    "Use it to collect links, notes, checklists, and project briefs, then share that context with ChatGPT, Claude, Codex, Claude Code, and teammates.",
    "",
    "## Primary use cases",
    "- Share project context between ChatGPT and Claude",
    "- Keep a reusable project brief outside any single AI chat",
    "- Give coding agents a stable context layer through MCP",
    "- Build a research board your team and AI tools can both read",
    "",
    "## Key URLs",
    `- Home: ${absoluteUrl("/")}`,
    `- MCP setup: ${absoluteUrl("/mcp")}`,
    `- Help: ${absoluteUrl("/help")}`,
    `- Blog: ${absoluteUrl("/blog")}`,
    `- GitHub: https://github.com/Vochsel/dump.page`,
    "",
    "## Blog posts",
    ...BLOG_POSTS.map(
      (post) => `- ${post.title}: ${absoluteUrl(`/blog/${post.slug}`)}`
    ),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

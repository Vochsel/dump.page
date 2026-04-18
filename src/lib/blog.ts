export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedTime: string;
  readingTime: string;
  tags: string[];
};

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "share-project-context-between-chatgpt-and-claude",
    title: "How to share project context between ChatGPT and Claude",
    description:
      "Use Dump as a shared project board so ChatGPT, Claude, and your team work from the same links, notes, and decisions.",
    publishedTime: "2026-04-18",
    readingTime: "4 min read",
    tags: ["ChatGPT", "Claude", "project context", "AI collaboration"],
  },
  {
    slug: "ai-project-handoff-board",
    title: "The AI project handoff board: one brief for humans and agents",
    description:
      "Turn scattered prompts, docs, and bookmarks into a reusable project handoff board for teammates, coding agents, and future chats.",
    publishedTime: "2026-04-18",
    readingTime: "5 min read",
    tags: ["project handoff", "agents", "team workflows", "research"],
  },
  {
    slug: "mcp-shared-context-for-agents",
    title: "MCP is better when your agent context already lives somewhere useful",
    description:
      "Why shared boards plus MCP beat pasting context into every conversation for ChatGPT, Claude Code, Codex, and other tools.",
    publishedTime: "2026-04-18",
    readingTime: "4 min read",
    tags: ["MCP", "ChatGPT", "Claude Code", "Codex"],
  },
];

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

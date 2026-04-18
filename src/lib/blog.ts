export type BlogPalette = {
  page: string;
  panel: string;
  accent: string;
  ink: string;
  canvasBase: string;
  colors: [string, string, string, string];
};

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedTime: string;
  readingTime: string;
  eyebrow: string;
  tags: string[];
  palette: BlogPalette;
};

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "share-project-context-between-chatgpt-and-claude",
    title: "How to share project context between ChatGPT and Claude",
    description:
      "Use Dump as a shared project board so ChatGPT, Claude, and your team work from the same links, notes, and decisions.",
    publishedTime: "2026-04-18",
    readingTime: "4 min read",
    eyebrow: "Cross-agent workflows",
    tags: ["ChatGPT", "Claude", "project context", "AI collaboration"],
    palette: {
      page: "#f8f0e6",
      panel: "#fdf7f0",
      accent: "#a6462b",
      ink: "#1d1a17",
      canvasBase: "#f4e8d7",
      colors: ["#e66f51", "#f3bc52", "#2d8f83", "#2554c7"],
    },
  },
  {
    slug: "ai-project-handoff-board",
    title: "The AI project handoff board: one brief for humans and agents",
    description:
      "Turn scattered prompts, docs, and bookmarks into a reusable project handoff board for teammates, coding agents, and future chats.",
    publishedTime: "2026-04-18",
    readingTime: "5 min read",
    eyebrow: "Reusable context systems",
    tags: ["project handoff", "agents", "team workflows", "research"],
    palette: {
      page: "#eef1e8",
      panel: "#f7f8f1",
      accent: "#1f6f58",
      ink: "#17221d",
      canvasBase: "#e2ead8",
      colors: ["#2563eb", "#ff8c42", "#1f6f58", "#c85151"],
    },
  },
  {
    slug: "mcp-shared-context-for-agents",
    title: "MCP is better when your agent context already lives somewhere useful",
    description:
      "Why shared boards plus MCP beat pasting context into every conversation for ChatGPT, Claude Code, Codex, and other tools.",
    publishedTime: "2026-04-18",
    readingTime: "4 min read",
    eyebrow: "Agent infrastructure",
    tags: ["MCP", "ChatGPT", "Claude Code", "Codex"],
    palette: {
      page: "#eef3f4",
      panel: "#f7fafb",
      accent: "#165f73",
      ink: "#13212a",
      canvasBase: "#dde8ea",
      colors: ["#00a7b7", "#0f766e", "#ff6b6b", "#d8a431"],
    },
  },
];

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function formatBlogDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

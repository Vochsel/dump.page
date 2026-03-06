import { NextRequest, NextResponse } from "next/server";

const BOT_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "Claude-Web",
  "ClaudeBot",
  "Anthropic",
  "CCBot",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "PerplexityBot",
  "YouBot",
  "Bytespider",
  "cohere-ai",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "TelegramBot",
  "Discordbot",
  "Slackbot",
  "Applebot",
  "ia_archiver",
  "Scrapy",
  "wget",
  "curl",
  "python-requests",
  "node-fetch",
  "axios",
  "httpx",
  "undici",
  "got/",
  "MagpaiBot",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept board pages
  if (!pathname.startsWith("/b/")) return NextResponse.next();

  // Skip sub-paths like /b/[boardId]/llms.txt or /b/[boardId]/rss.xml
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 2) return NextResponse.next();

  const userAgent = request.headers.get("user-agent") ?? "";
  const accept = request.headers.get("accept") ?? "";

  // Serve markdown if: bot user agent, or client prefers text/markdown or text/plain (not HTML)
  const prefersText = (accept.includes("text/markdown") || accept.includes("text/plain")) &&
    !accept.includes("text/html");

  if (!isBot(userAgent) && !prefersText) return NextResponse.next();

  // Extract board ID from path: /b/[boardId]
  const boardId = segments[1];
  if (!boardId) return NextResponse.next();

  const token = request.nextUrl.searchParams.get("token") ?? undefined;

  // Redirect bots to the markdown API route
  const markdownUrl = new URL(`/api/board-markdown/${boardId}`, request.url);
  if (token) markdownUrl.searchParams.set("token", token);

  return NextResponse.rewrite(markdownUrl);
}

export const config = {
  matcher: "/b/:path*",
};

import { NextRequest, NextResponse } from "next/server";

const BOT_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
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
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept board pages
  if (!pathname.startsWith("/b/")) return NextResponse.next();

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!isBot(userAgent)) return NextResponse.next();

  // Extract board ID from path: /b/[boardId]
  const segments = pathname.split("/");
  const boardId = segments[2];
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

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
  "XBot",
  "Grok",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = request.cookies.has("__dump_authed");

  // Auth-hint redirects: skip flicker by redirecting before page renders
  if (pathname === "/" && hasAuthCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname === "/dashboard" && !hasAuthCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

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

  // Redirect bots to the llms.txt route (plain text, no API hop — works with restricted fetch layers)
  const llmsUrl = new URL(`/b/${boardId}/llms.txt`, request.url);
  if (token) llmsUrl.searchParams.set("token", token);

  return NextResponse.rewrite(llmsUrl);
}

export const config = {
  matcher: ["/", "/dashboard", "/b/:path*"],
};

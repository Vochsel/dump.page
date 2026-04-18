import { NextRequest, NextResponse } from "next/server";

// Bots that should get markdown/llms.txt (LLM crawlers, search engines, CLI tools)
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

// OG scrapers that need HTML to read meta tags (not redirected to markdown)
const OG_SCRAPERS = [
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "TelegramBot",
  "Discordbot",
  "Slackbot",
];

function isOgScraper(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return OG_SCRAPERS.some((bot) => ua.includes(bot.toLowerCase()));
}

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

export function middleware(request: NextRequest) {
  const sharedPathMatch = request.nextUrl.pathname.match(/^\/s\/([^/]+)\/b\/(.+)$/);
  const pathToken = sharedPathMatch?.[1];
  const pathname = sharedPathMatch ? `/b/${sharedPathMatch[2]}` : request.nextUrl.pathname;
  const hasAuthCookie = request.cookies.has("__dump_authed");
  const token = pathToken ?? request.nextUrl.searchParams.get("token") ?? undefined;

  const buildRewriteUrl = (targetPath: string) => {
    const url = new URL(targetPath, request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      if (key !== "token") {
        url.searchParams.set(key, value);
      }
    });
    if (token) {
      url.searchParams.set("token", token);
    }
    return url;
  };

  // Auth-hint redirects: skip flicker by redirecting before page renders
  if (pathname === "/" && hasAuthCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname === "/dashboard" && !hasAuthCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Only intercept board pages
  if (!pathname.startsWith("/b/")) return NextResponse.next();

  const segments = pathname.split("/").filter(Boolean);
  // Skip sub-routes that are already content endpoints (llms.txt, rss.xml)
  const lastSegment = segments[segments.length - 1];
  if (lastSegment?.includes(".")) {
    return pathToken ? NextResponse.rewrite(buildRewriteUrl(pathname)) : NextResponse.next();
  }
  // Only handle /b/[boardId] and /b/[boardId]/[itemId]
  if (segments.length > 3) {
    return pathToken ? NextResponse.rewrite(buildRewriteUrl(pathname)) : NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const accept = request.headers.get("accept") ?? "";

  // Serve markdown if: bot user agent, or client prefers text/markdown or text/plain (not HTML)
  const prefersText = (accept.includes("text/markdown") || accept.includes("text/plain")) &&
    !accept.includes("text/html");

  // OG scrapers (Discord, Slack, etc.) need HTML to read meta tags.
  // TODO: Some LLMs may share user-agents with these scrapers in future,
  // which would break their access to the markdown/llms.txt content.
  // Consider serving both OG tags AND markdown, or using a query param override.
  if (isOgScraper(userAgent)) {
    return pathToken ? NextResponse.rewrite(buildRewriteUrl(pathname)) : NextResponse.next();
  }

  if (!isBot(userAgent) && !prefersText) {
    return pathToken ? NextResponse.rewrite(buildRewriteUrl(pathname)) : NextResponse.next();
  }

  const boardId = segments[1];
  if (!boardId) return NextResponse.next();
  const itemId = segments[2]; // undefined for board-only URLs

  // Redirect bots to the llms.txt route (plain text, no API hop — works with restricted fetch layers)
  const llmsPath = itemId
    ? `/b/${boardId}/${itemId}/llms.txt`
    : `/b/${boardId}/llms.txt`;

  return NextResponse.rewrite(buildRewriteUrl(llmsPath));
}

export const config = {
  matcher: ["/", "/dashboard", "/b/:path*", "/s/:path*"],
};

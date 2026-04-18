import type { Metadata } from "next";

export const SITE_NAME = "Dump";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dump.page";
export const DEFAULT_OG_IMAGE = "/opengraph-image";

export const CORE_KEYWORDS = [
  "share project context between ChatGPT and Claude",
  "shared project board for AI",
  "AI project context",
  "ChatGPT Claude shared context",
  "MCP server for ChatGPT and Claude",
  "Claude Code project context",
  "Codex project context",
  "shared research board",
  "AI-readable whiteboard",
  "collaborative context board",
];

type MetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createMetadata({
  title,
  description,
  path = "/",
  keywords = [],
}: MetadataOptions): Metadata {
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    alternates: {
      canonical: path,
    },
    keywords: [...CORE_KEYWORDS, ...keywords],
    authors: [{ name: "Vochsel" }],
    creator: "Vochsel",
    publisher: "Vochsel",
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Dump collaborative context board",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    icons: {
      icon: "/dump.png",
      apple: "/dump.png",
    },
  };
}

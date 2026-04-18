import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/blog",
  "/changelog",
  "/help",
  "/help/context-type",
  "/help/pro-mode",
  "/mcp",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((route) => ({
      url: absoluteUrl(route),
    })),
    ...BLOG_POSTS.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.publishedTime,
    })),
  ];
}

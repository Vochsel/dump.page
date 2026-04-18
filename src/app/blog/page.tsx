import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";
import { createMetadata } from "@/lib/seo";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = createMetadata({
  title: "Dump Blog | Guides for sharing project context with ChatGPT, Claude, and agents",
  description:
    "Read guides on using Dump as a shared project board, AI handoff layer, research hub, and MCP-ready context source.",
  path: "/blog",
  keywords: [
    "share project context blog",
    "ChatGPT Claude workflows",
    "AI project handoff guide",
    "MCP context guide",
  ],
});

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Dump blog
          </p>
          <h1 className="font-[family-name:var(--font-poppins)] text-4xl font-semibold leading-tight text-stone-900">
            Guides for shared AI project context
          </h1>
          <p className="text-lg leading-8 text-stone-600">
            These guides explain how to position Dump as a shared project board,
            a cross-model handoff layer, a research hub, and an MCP-ready
            context source for agents.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-stone-400"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                {post.readingTime}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-poppins)] text-xl font-semibold text-stone-900">
                {post.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {post.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        <Footer />
      </main>
    </div>
  );
}

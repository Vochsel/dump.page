import type { Metadata } from "next";
import Link from "next/link";
import { BlogCanvasArt } from "@/components/blog/BlogCanvasArt";
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
    <div className="min-h-screen overflow-hidden bg-[#f6efe6]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_18%_14%,rgba(230,111,81,0.14),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(37,84,199,0.16),transparent_30%),radial-gradient(circle_at_48%_0%,rgba(243,188,82,0.16),transparent_24%)]" />

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-end">
          <div className="max-w-3xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-stone-500">
              Dump guides
            </p>
            <h1 className="font-[family-name:var(--font-poppins)] text-4xl font-semibold leading-[1.02] text-stone-900 sm:text-5xl lg:text-6xl">
              Guides for shared project context
            </h1>
            <p className="text-lg leading-8 text-stone-700 sm:text-xl">
              Practical ways to use Dump for ChatGPT, Claude, coding agents,
              and team handoffs without rebuilding the same context every time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/new"
                className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
              >
                Start a board
              </Link>
              <Link
                href="/mcp"
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-500 hover:bg-white/70"
              >
                Explore MCP
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-5 -top-4 z-10 rounded-[0.9rem] border border-stone-900/10 bg-white/80 px-4 py-3 text-right text-sm text-stone-600 shadow-sm">
              Abstract context map
              <br />
              for humans and agents
            </div>
            <BlogCanvasArt
              palette={BLOG_POSTS[0].palette}
              seed={17}
              className="h-[360px] border border-stone-900/10 p-2 shadow-[0_28px_80px_rgba(0,0,0,0.08)]"
            />
          </div>
        </section>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-[1.2rem] border border-stone-900/10 bg-white/80 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(0,0,0,0.1)]"
              style={{
                backgroundColor: "rgba(255,255,255,0.78)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="relative overflow-hidden rounded-[0.95rem] border p-2"
                style={{
                  borderColor: `${post.palette.ink}18`,
                  backgroundColor: post.palette.panel,
                }}
              >
                <BlogCanvasArt
                  palette={post.palette}
                  seed={post.title.length}
                  className="h-52"
                />
                <div className="absolute inset-x-5 bottom-5 flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em]"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.76)",
                      color: post.palette.accent,
                    }}
                  >
                    {post.eyebrow}
                  </span>
                  <span
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.76)",
                      color: `${post.palette.ink}bf`,
                    }}
                  >
                    {post.readingTime}
                  </span>
                </div>
              </div>

              <div className="px-3 pb-3 pt-5">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.28em]"
                  style={{ color: `${post.palette.ink}80` }}
                >
                  {post.eyebrow}
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-poppins)] text-2xl font-semibold leading-tight text-stone-900">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  {post.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${post.palette.accent}12`,
                        color: post.palette.accent,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-6 text-sm font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 group-hover:decoration-stone-600">
                  Read guide
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="pt-14">
          <Footer />
        </div>
      </main>
    </div>
  );
}

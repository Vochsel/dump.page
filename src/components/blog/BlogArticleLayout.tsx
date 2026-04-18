import Link from "next/link";
import { BlogCanvasArt } from "@/components/blog/BlogCanvasArt";
import { Footer } from "@/components/Footer";
import type { BlogPalette } from "@/lib/blog";
import { formatBlogDate } from "@/lib/blog";

type BlogArticleLayoutProps = {
  title: string;
  description: string;
  publishedTime: string;
  readingTime: string;
  eyebrow: string;
  tags: string[];
  palette: BlogPalette;
  children: React.ReactNode;
};

export function BlogArticleLayout({
  title,
  description,
  publishedTime,
  readingTime,
  eyebrow,
  tags,
  palette,
  children,
}: BlogArticleLayoutProps) {
  const formattedDate = formatBlogDate(publishedTime);

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{ backgroundColor: palette.page }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-90"
        style={{
          backgroundImage: [
            `radial-gradient(circle at 12% 16%, ${palette.colors[0]}22, transparent 30%)`,
            `radial-gradient(circle at 88% 22%, ${palette.colors[1]}2a, transparent 28%)`,
            `radial-gradient(circle at 56% 4%, ${palette.colors[2]}22, transparent 24%)`,
            `linear-gradient(180deg, ${palette.panel}, transparent)`,
          ].join(", "),
        }}
      />

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-end">
          <div className="space-y-5">
            <Link
              href="/blog"
              className="inline-flex rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/70"
              style={{
                borderColor: `${palette.ink}26`,
                color: palette.ink,
                backgroundColor: "rgba(255,255,255,0.56)",
              }}
            >
              Back to guides
            </Link>

            <div className="space-y-4">
              <p
                className="text-xs font-semibold uppercase tracking-[0.32em]"
                style={{ color: `${palette.ink}99` }}
              >
                {eyebrow}
              </p>
              <h1
                className="font-[family-name:var(--font-poppins)] text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl"
                style={{ color: palette.ink }}
              >
                {title}
              </h1>
              <p
                className="max-w-2xl text-lg leading-8 sm:text-xl"
                style={{ color: `${palette.ink}c7` }}
              >
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: "rgba(255,255,255,0.72)",
                  color: palette.ink,
                }}
              >
                {formattedDate}
              </span>
              <span
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: "rgba(255,255,255,0.72)",
                  color: palette.ink,
                }}
              >
                {readingTime}
              </span>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-4 py-2 text-sm font-medium"
                  style={{
                    borderColor: `${palette.accent}44`,
                    backgroundColor: `${palette.accent}12`,
                    color: palette.accent,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -left-7 top-5 z-10 hidden rounded-[0.95rem] border px-4 py-3 text-sm text-left shadow-sm lg:block"
              style={{
                borderColor: `${palette.ink}18`,
                backgroundColor: "rgba(255,255,255,0.8)",
                color: `${palette.ink}c0`,
                transform: "rotate(-4deg)",
              }}
            >
              Shared context
              <br />
              in visual form
            </div>
            <BlogCanvasArt
              palette={palette}
              seed={title.length}
              className="h-[320px] border p-2 shadow-[0_28px_70px_rgba(0,0,0,0.08)]"
            />
            <div
              className="absolute bottom-4 right-4 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em]"
              style={{
                backgroundColor: "rgba(255,255,255,0.78)",
                color: palette.accent,
              }}
            >
              Dump guide
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <div
              className="rounded-[1.1rem] border p-5 shadow-sm"
              style={{
                borderColor: `${palette.ink}12`,
                backgroundColor: "rgba(255,255,255,0.68)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: `${palette.ink}80` }}
              >
                Guide lens
              </p>
              <p
                className="mt-3 text-sm leading-6"
                style={{ color: `${palette.ink}cf` }}
              >
                {eyebrow} is the framing here. The goal is to make the same
                project context useful to people, agents, and future chats.
              </p>
            </div>
            <div
              className="rounded-[1.1rem] border p-5 shadow-sm"
              style={{
                borderColor: `${palette.ink}12`,
                backgroundColor: "rgba(255,255,255,0.68)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-[0.28em]"
                style={{ color: `${palette.ink}80` }}
              >
                Themes
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${palette.accent}12`,
                      color: palette.accent,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <div
              className="rounded-[1.25rem] border px-6 py-8 shadow-[0_28px_80px_rgba(0,0,0,0.08)] sm:px-10 sm:py-10"
              style={{
                borderColor: `${palette.ink}14`,
                backgroundColor: "rgba(255,255,255,0.84)",
              }}
            >
              <article className="blog-article prose prose-stone prose-lg max-w-none prose-headings:font-[family-name:var(--font-poppins)] prose-headings:text-stone-900 prose-p:text-stone-700 prose-li:text-stone-700 prose-strong:text-stone-900">
                {children}
              </article>
            </div>

            <div
              className="rounded-[1.2rem] border p-6 sm:p-8"
              style={{
                borderColor: `${palette.accent}33`,
                background: `linear-gradient(135deg, rgba(255,255,255,0.82), ${palette.accent}14)`,
              }}
            >
              <h2
                className="font-[family-name:var(--font-poppins)] text-2xl font-semibold"
                style={{ color: palette.ink }}
              >
                Try Dump with your next project
              </h2>
              <p
                className="mt-3 max-w-2xl text-sm leading-7 sm:text-base"
                style={{ color: `${palette.ink}c7` }}
              >
                Start a board, add the links and notes you keep re-explaining,
                and share the same context with ChatGPT, Claude, teammates, or
                any tool that speaks MCP.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/new"
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
                  style={{ backgroundColor: palette.ink }}
                >
                  Start a board
                </Link>
                <Link
                  href="/mcp"
                  className="rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/60"
                  style={{
                    borderColor: `${palette.ink}2e`,
                    color: palette.ink,
                  }}
                >
                  Connect via MCP
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-14">
          <Footer />
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { Footer } from "@/components/Footer";

type BlogArticleLayoutProps = {
  title: string;
  description: string;
  publishedTime: string;
  readingTime: string;
  children: React.ReactNode;
};

export function BlogArticleLayout({
  title,
  description,
  publishedTime,
  readingTime,
  children,
}: BlogArticleLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50">
      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-10 space-y-4">
          <Link
            href="/blog"
            className="inline-flex text-sm font-medium text-stone-500 underline decoration-stone-300 underline-offset-4 transition-colors hover:text-stone-900"
          >
            Back to guides
          </Link>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
              Dump guides
            </p>
            <h1 className="font-[family-name:var(--font-poppins)] text-4xl font-semibold leading-tight text-stone-900">
              {title}
            </h1>
            <p className="text-lg leading-8 text-stone-600">{description}</p>
            <p className="text-sm text-stone-500">
              {publishedTime} | {readingTime}
            </p>
          </div>
        </div>

        <article className="prose prose-stone max-w-none prose-headings:font-[family-name:var(--font-poppins)] prose-headings:text-stone-900 prose-p:text-stone-700 prose-li:text-stone-700 prose-strong:text-stone-900">
          {children}
        </article>

        <div className="mt-14 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-[family-name:var(--font-poppins)] text-xl font-semibold text-stone-900">
            Try Dump with your next project
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Start a board, add the links and notes you keep re-explaining, and
            share the same context with ChatGPT, Claude, teammates, or any tool
            that speaks MCP.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/new"
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
            >
              Start a board
            </Link>
            <Link
              href="/mcp"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-900"
            >
              Connect via MCP
            </Link>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import { BlogArticleLayout } from "@/components/blog/BlogArticleLayout";
import { StructuredData } from "@/components/seo/StructuredData";
import { getBlogPost } from "@/lib/blog";
import { absoluteUrl, createMetadata } from "@/lib/seo";

const post = getBlogPost("ai-project-handoff-board")!;

export const metadata: Metadata = createMetadata({
  title: `${post.title} | Dump`,
  description: post.description,
  path: `/blog/${post.slug}`,
  keywords: post.tags,
});

export default function AiProjectHandoffBoardPage() {
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedTime,
          author: {
            "@type": "Organization",
            name: "Dump",
          },
          publisher: {
            "@type": "Organization",
            name: "Dump",
          },
          mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
        }}
      />
      <BlogArticleLayout
        title={post.title}
        description={post.description}
        publishedTime={post.publishedTime}
        readingTime={post.readingTime}
      >
        <p>
          Most teams already create project handoff documents. The problem is
          that they do it in too many places: a Notion doc, a Slack thread, a
          list of bookmarks, and a few AI chats that nobody can reconstruct
          later. Dump turns that fragmented handoff into one board.
        </p>
        <h2>A handoff board is more reusable than a prompt</h2>
        <p>
          Prompts are disposable. Handoff boards are reusable. They hold the
          reference material behind the prompt, which means a teammate, ChatGPT,
          Claude Code, or Codex can all start from the same brief without asking
          you to restate the project every time.
        </p>
        <h2>What makes a strong AI project handoff board</h2>
        <ul>
          <li>A short note that explains the project and current goal</li>
          <li>Links to source docs, repos, tickets, and design files</li>
          <li>A checklist of what is done, blocked, or still under debate</li>
          <li>Enough context to let someone new ask smart follow-up questions</li>
        </ul>
        <h2>Who this helps</h2>
        <p>
          This framing is useful well beyond chat assistants. Engineers use it
          to brief coding agents. Product teams use it to keep research and
          requirements together. Agencies can use it to move a client project
          between people without letting important context disappear inside
          private chats.
        </p>
        <h2>Other ways to position the same product</h2>
        <ul>
          <li>Shared project brief for humans and AI</li>
          <li>Cross-chat memory layer</li>
          <li>Research board for modern product teams</li>
          <li>Link-and-notes workspace for coding agents</li>
        </ul>
        <p>
          Those are not separate products. They are different entry points into
          the same behavior: keep project context in one place that can survive
          model changes, team changes, and conversation changes.
        </p>
      </BlogArticleLayout>
    </>
  );
}

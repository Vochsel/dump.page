import type { Metadata } from "next";
import { BlogArticleLayout } from "@/components/blog/BlogArticleLayout";
import { StructuredData } from "@/components/seo/StructuredData";
import { getBlogPost } from "@/lib/blog";
import { absoluteUrl, createMetadata } from "@/lib/seo";

const post = getBlogPost("mcp-shared-context-for-agents")!;

export const metadata: Metadata = createMetadata({
  title: `${post.title} | Dump`,
  description: post.description,
  path: `/blog/${post.slug}`,
  keywords: post.tags,
});

export default function McpSharedContextForAgentsPage() {
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
        eyebrow={post.eyebrow}
        tags={post.tags}
        palette={post.palette}
      >
        <p>
          MCP makes agents more useful, but only if the agent can reach context
          that is already organized. If the real project brief lives across chat
          history and browser tabs, connecting an MCP server does not solve much
          by itself. Dump gives MCP something worth connecting to.
        </p>
        <h2>Why shared boards matter before the integration layer</h2>
        <p>
          An MCP connector is a transport. It does not decide what your project
          context should look like. Dump fills that gap by letting you keep the
          board, links, notes, and checklists in one place before ChatGPT,
          Claude Code, Codex, or Cursor starts reading them.
        </p>
        <h2>What this unlocks</h2>
        <ul>
          <li>Agents can list, search, and read boards instead of asking for the same links again.</li>
          <li>Teams can update the source board once and let every tool see the change.</li>
          <li>Public or shared boards stay useful even outside MCP through URLs and llms.txt.</li>
        </ul>
        <h2>The search-friendly positioning</h2>
        <p>
          The most useful framing here is not just &ldquo;MCP server.&rdquo; That is too
          abstract for many people. A clearer description is{" "}
          <strong>MCP-ready shared context for agents and humans</strong>. It
          explains both the technical surface and the workflow benefit.
        </p>
        <h2>Who cares about this angle</h2>
        <p>
          Developers setting up Claude Code or Codex care because they need a
          stable project brief. Teams experimenting with ChatGPT connectors care
          because they want one reusable source of context. People comparing AI
          tools care because they do not want their notes trapped inside a
          single vendor&apos;s chat history.
        </p>
      </BlogArticleLayout>
    </>
  );
}

import type { Metadata } from "next";
import { BlogArticleLayout } from "@/components/blog/BlogArticleLayout";
import { StructuredData } from "@/components/seo/StructuredData";
import { getBlogPost } from "@/lib/blog";
import { absoluteUrl, createMetadata } from "@/lib/seo";

const post = getBlogPost("share-project-context-between-chatgpt-and-claude")!;

export const metadata: Metadata = createMetadata({
  title: `${post.title} | Dump`,
  description: post.description,
  path: `/blog/${post.slug}`,
  keywords: post.tags,
});

export default function ShareProjectContextBetweenChatGptAndClaudePage() {
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
          The fastest way to make ChatGPT and Claude useful on the same project
          is to stop treating each conversation like a fresh start. Put the
          links, notes, requirements, repo references, and open questions into a
          single Dump board, then share that board with both models.
        </p>
        <h2>Why this works better than copy-pasting prompts</h2>
        <p>
          Prompt copy becomes stale immediately. One chat has the latest spec,
          another has the meeting notes, and a third has the links you forgot to
          paste. A shared board gives both models the same project context, so
          you spend less time rebuilding state and more time comparing useful
          answers.
        </p>
        <ul>
          <li>ChatGPT can review the strategy and generate options.</li>
          <li>Claude can synthesize the same context into a cleaner plan.</li>
          <li>Your team can inspect and update the exact source material.</li>
        </ul>
        <h2>What to put on the board</h2>
        <p>
          The best shared boards look like a compact project brief, not a random
          pile of bookmarks. Add the pieces you usually repeat in every chat:
        </p>
        <ul>
          <li>Goals, constraints, and the definition of done</li>
          <li>Key docs, Figma files, specs, and repository links</li>
          <li>Open decisions, blockers, and rough hypotheses</li>
          <li>Checklists or next steps that need to survive between chats</li>
        </ul>
        <h2>How teams use it in practice</h2>
        <p>
          A common workflow is simple. One person curates the board. Another
          asks ChatGPT for exploration. A third asks Claude for synthesis or
          critique. Because both models read from the same source, the outputs
          are easier to compare and merge.
        </p>
        <p>
          Dump also works when the humans are the bottleneck. Instead of sending
          five links and a paragraph in Slack, you share one board URL. That
          makes the handoff cleaner for teammates and for AI tools.
        </p>
        <h2>The positioning angle</h2>
        <p>
          If you need a short description, position Dump as a{" "}
          <strong>shared project context board for ChatGPT, Claude, and humans</strong>.
          That phrase is concrete, understandable, and maps directly to how
          people search for this problem.
        </p>
      </BlogArticleLayout>
    </>
  );
}

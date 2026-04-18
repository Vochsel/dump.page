import Link from "next/link";
import { Suspense } from "react";
import { DraggableCard } from "@/components/landing/DraggableCard";
import { AuthRedirect } from "@/components/landing/AuthRedirect";
import { StartDumpingButton } from "@/components/landing/StartDumpingButton";
import { AiWorksWithSection } from "@/components/landing/AiWorksWithSection";
import { BoardCounter } from "@/components/BoardCounter";
import { LoginButton } from "@/components/auth/LoginButton";
import { Footer } from "@/components/Footer";
import { BLOG_POSTS } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";
import { StructuredData } from "@/components/seo/StructuredData";

const features = [
  {
    title: "Capture the project brief",
    description:
      "Collect links, notes, checklists, and decisions in one board instead of scattering them across chats.",
    color: "bg-yellow-100 border-yellow-300",
    rotate: "-rotate-2",
  },
  {
    title: "Share one context source",
    description:
      "Give the same board to teammates, ChatGPT, Claude, and coding agents so everyone starts from the same place.",
    color: "bg-blue-100 border-blue-300",
    rotate: "rotate-1",
  },
  {
    title: "Use URLs or MCP",
    description:
      "Paste a board URL into a chat or connect Dump as an MCP server for deeper agent workflows.",
    color: "bg-pink-100 border-pink-300",
    rotate: "-rotate-1",
  },
];

const useCases = [
  {
    emoji: "\u{1F516}",
    title: "Shared research board",
    description:
      "Turn docs, repos, articles, and meeting notes into a research board your whole project can keep using.",
    accent: "from-amber-50 to-orange-50 border-amber-200/80",
    emojiAccent: "bg-amber-100",
  },
  {
    emoji: "\u{1F916}",
    title: "ChatGPT + Claude handoff",
    description:
      "Keep one project board that both ChatGPT and Claude can read instead of rebuilding context in every conversation.",
    accent: "from-violet-50 to-purple-50 border-violet-200/80",
    emojiAccent: "bg-violet-100",
  },
  {
    emoji: "\u{1F5C2}\u{FE0F}",
    title: "Coding agent brief",
    description:
      "Give Claude Code, Codex, Cursor, or any MCP-aware tool a stable brief with the docs and links they need.",
    accent: "from-emerald-50 to-teal-50 border-emerald-200/80",
    emojiAccent: "bg-emerald-100",
  },
  {
    emoji: "\u{1F4AC}",
    title: "Context layer for teams",
    description:
      "Replace long Slack threads and bookmark folders with one board that keeps project context searchable and shareable.",
    accent: "from-sky-50 to-blue-50 border-sky-200/80",
    emojiAccent: "bg-sky-100",
  },
];

const positioningAngles = [
  {
    title: "AI project handoff board",
    description:
      "A reusable brief that survives across prompts, chats, and team members.",
  },
  {
    title: "Shared memory between models",
    description:
      "A practical way to move work between ChatGPT, Claude, and coding agents without losing context.",
  },
  {
    title: "MCP-ready context layer",
    description:
      "A board that is already organized for tools, not just humans, so your agent integrations start useful.",
  },
  {
    title: "Research hub for modern teams",
    description:
      "A lightweight space for product, design, engineering, and ops research that stays readable by people and AI.",
  },
];

const faqItems = [
  {
    question: "Can I use Dump to share a project between ChatGPT and Claude?",
    answer:
      "Yes. Put the project links, notes, requirements, and open questions on one board, then share that board with both ChatGPT and Claude so they work from the same context.",
  },
  {
    question: "Is Dump only for AI chats?",
    answer:
      "No. Teams use Dump as a shared project brief, a research board, a bookmark layer, and a handoff space between humans and agents.",
  },
  {
    question: "How do agents read Dump boards?",
    answer:
      "Shared and public boards expose AI-friendly formats, and Dump also offers an MCP server so compatible tools can search and update boards directly.",
  },
  {
    question: "What makes Dump different from pasting links into Slack or docs?",
    answer:
      "Dump keeps project context in a dedicated board built for links, notes, and checklists, which makes it easier to reuse across chats, teammates, and tools.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Dump",
    url: absoluteUrl("/"),
    description:
      "A collaborative context board for sharing project links, notes, and briefs with ChatGPT, Claude, coding agents, and humans.",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Dump",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/"),
    description:
      "Dump helps teams share project context between ChatGPT, Claude, coding agents, and people using collaborative boards and MCP.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Collaborative boards for links, notes, and checklists",
      "Shared project context for ChatGPT and Claude",
      "MCP server for AI assistants and coding agents",
      "AI-readable board URLs and llms.txt endpoints",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
];

export default function Home() {
  return (
    <div className="landing-dot-grid min-h-screen flex flex-col items-center px-4 py-20">
      <StructuredData data={structuredData} />
      <Suspense>
        <AuthRedirect />
      </Suspense>

      {/* Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/dump.png"
          alt="Dump"
          className="h-24 sm:h-30"
        />
        <span className="font-[family-name:var(--font-dynapuff)] text-4xl sm:text-5xl text-gray-800 dark:text-gray-100">
          Dump
        </span>
      </div>

      {/* CTA Heading */}
      <div className="text-center space-y-4 max-w-2xl mt-8">
        <p className="font-[family-name:var(--font-poppins)] text-xs uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300">
          The prompt dump for humans and AI
        </p>
        <h1 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
          One project context for
          <br />
          ChatGPT, Claude, and your team
        </h1>
        <p className="font-[family-name:var(--font-poppins)] text-base sm:text-lg text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
          Dump is a shared board for links, notes, and briefs, so humans and
          agents work from the same context.
        </p>
        <StartDumpingButton />
        <Suspense>
          <BoardCounter />
        </Suspense>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-[family-name:var(--font-poppins)] text-gray-500">
          <Link href="/mcp" className="underline decoration-gray-300 underline-offset-4 hover:text-gray-800">
            Connect with MCP
          </Link>
        </div>
      </div>

      {/* Works with AI */}
      <AiWorksWithSection />

      {/* Screenshot showcase */}
      <div className="mt-12 max-w-4xl w-full px-4">
        <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40 rounded-2xl p-3 sm:p-4">
          <img
            src="/screenshot-ai-demo.png"
            alt="Dump board showing project links, notes, and tasks ready to share with ChatGPT, Claude, and teammates"
            className="w-full rounded-xl"
          />
        </div>
      </div>

      {/* Feature cards */}
      <p className="mt-16 text-center text-xs font-[family-name:var(--font-poppins)] text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-6">
        How it works
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-2xl w-full px-2">
        {features.map((feature) => (
          <DraggableCard
            key={feature.title}
            className={`${feature.color} ${feature.rotate} border-2 rounded-sm p-5 shadow-md hover:shadow-lg cursor-default`}
          >
            <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </DraggableCard>
        ))}
      </div>

      {/* Use cases */}
      <div className="mt-16 max-w-2xl w-full px-2">
        <p className="text-center text-xs font-[family-name:var(--font-poppins)] text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-6">
          Core positioning angles
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {useCases.map((useCase) => (
            <DraggableCard
              key={useCase.title}
              className={`bg-gradient-to-br ${useCase.accent} border rounded-xl p-5 space-y-2.5 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-lg ${useCase.emojiAccent} rounded-lg w-8 h-8 flex items-center justify-center`}>
                  {useCase.emoji}
                </span>
                <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-gray-800 text-sm">
                  {useCase.title}
                </h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-[family-name:var(--font-poppins)]">
                {useCase.description}
              </p>
            </DraggableCard>
          ))}
        </div>
      </div>

      <div className="mt-16 max-w-4xl w-full px-2">
        <p className="text-center text-xs font-[family-name:var(--font-poppins)] text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-6">
          What Dump becomes in practice
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {positioningAngles.map((angle) => (
            <div
              key={angle.title}
              className="rounded-2xl border border-gray-200 bg-white/70 px-6 py-5 text-left shadow-sm"
            >
              <h3 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-gray-900">
                {angle.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {angle.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Why we built this */}
      <div className="mt-16 max-w-xl w-full px-2 space-y-4">
        <p className="text-center text-xs font-[family-name:var(--font-poppins)] text-gray-700 dark:text-gray-300 uppercase tracking-widest">
          Why we built this
        </p>
        <div className="bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-3">
          <ul className="space-y-2 text-sm text-gray-600 font-[family-name:var(--font-poppins)] leading-relaxed">
            <li className="flex gap-2">
              <span className="text-gray-400 flex-shrink-0">1.</span>
              To quickly store <span className="font-semibold text-gray-800 dark:text-gray-100">reusable context</span> outside of any one LLM.
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400 flex-shrink-0">2.</span>
              To share <span className="font-semibold text-gray-800 dark:text-gray-100">multimodal context</span> between team members.
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400 flex-shrink-0">3.</span>
              To <span className="font-semibold text-gray-800 dark:text-gray-100">regain control of our tokens</span>.
            </li>
          </ul>
          <p className="text-sm text-gray-500 font-[family-name:var(--font-poppins)] pt-2 border-t border-gray-100">
            See the dump we use for making Dump!{" "}
            <a
              href="https://www.dump.page/b/hy0rfopn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 font-semibold underline decoration-gray-300 hover:decoration-gray-500 transition-colors"
            >
              Take a look &rarr;
            </a>
          </p>
        </div>
      </div>

      <div className="mt-16 max-w-4xl w-full px-2">
        <p className="text-center text-xs font-[family-name:var(--font-poppins)] text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-6">
          Guides for teams and agents
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white/80 p-5 text-left shadow-sm transition-colors hover:border-gray-400"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                {post.readingTime}
              </p>
              <h3 className="mt-3 font-[family-name:var(--font-poppins)] text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                {post.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {post.description}
              </p>
              <p className="mt-4 text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-4">
                Read guide
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* MCP sticker */}
      <DraggableCard className="mt-12 -rotate-3">
        <a
          href="/mcp"
          className="block bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border-2 border-green-300 dark:border-green-700 border-dashed rounded-lg px-5 py-3 shadow-md hover:shadow-lg transition-shadow"
        >
          <p className="font-[family-name:var(--font-dynapuff)] text-sm text-green-800 dark:text-green-200 text-center">
            Now with 100% more MCP
          </p>
          <p className="text-[10px] text-green-600 dark:text-green-400 text-center mt-0.5 font-[family-name:var(--font-poppins)]">
            Connect ChatGPT, Claude &amp; more &rarr;
          </p>
        </a>
      </DraggableCard>

      <div className="mt-16 max-w-3xl w-full px-2">
        <p className="text-center text-xs font-[family-name:var(--font-poppins)] text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-6">
          FAQ
        </p>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="rounded-2xl border border-gray-200 bg-white/80 px-6 py-5 text-left shadow-sm"
            >
              <h2 className="font-[family-name:var(--font-poppins)] text-lg font-semibold text-gray-900">
                {item.question}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Login */}
      <div className="mt-16 flex flex-col items-center gap-3">
        <Suspense fallback={<div className="h-10" />}>
          <LoginButton />
        </Suspense>
        <p className="text-xs text-gray-400 font-[family-name:var(--font-poppins)]">
          Free to use &middot; No credit card required &middot;{" "}
          <a href="/help" className="underline hover:text-gray-600 transition-colors">Help</a>
          {" "}&middot;{" "}
          <a href="/blog" className="underline hover:text-gray-600 transition-colors">Blog</a>
          {" "}&middot;{" "}
          <a href="https://github.com/Vochsel/dump.page" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 transition-colors">GitHub</a>
        </p>
      </div>

      <Footer />
    </div>
  );
}

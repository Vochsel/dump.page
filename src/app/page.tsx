import { Suspense } from "react";
import { DraggableCard } from "@/components/landing/DraggableCard";
import { AuthRedirect } from "@/components/landing/AuthRedirect";
import { StartDumpingButton } from "@/components/landing/StartDumpingButton";
import { AiWorksWithSection } from "@/components/landing/AiWorksWithSection";
import { BoardCounter } from "@/components/BoardCounter";
import { LoginButton } from "@/components/auth/LoginButton";
import { Footer } from "@/components/Footer";

const features = [
  {
    title: "Drop links & notes",
    description: "Toss in URLs, ideas, and snippets — your board catches everything.",
    color: "bg-yellow-100 border-yellow-300",
    rotate: "-rotate-2",
  },
  {
    title: "Share with your team",
    description: "Invite collaborators and build context together in real time.",
    color: "bg-blue-100 border-blue-300",
    rotate: "rotate-1",
  },
  {
    title: "AI-readable boards",
    description: "Your boards become context that AI tools can actually understand.",
    color: "bg-pink-100 border-pink-300",
    rotate: "-rotate-1",
  },
];

const useCases = [
  {
    emoji: "\u{1F516}",
    title: "Smarter bookmarks",
    description:
      "Save links you actually want to find again — organized by project, not buried in a browser folder.",
    accent: "from-amber-50 to-orange-50 border-amber-200/80",
    emojiAccent: "bg-amber-100",
  },
  {
    emoji: "\u{1F916}",
    title: "Context for AI chats",
    description:
      "Dump reference links into a board and share it with ChatGPT, Claude, or any LLM for richer answers.",
    accent: "from-violet-50 to-purple-50 border-violet-200/80",
    emojiAccent: "bg-violet-100",
  },
  {
    emoji: "\u{1F5C2}\u{FE0F}",
    title: "Cross-project research",
    description:
      "Collect docs, articles, and repos across multiple projects in one place your whole team can access.",
    accent: "from-emerald-50 to-teal-50 border-emerald-200/80",
    emojiAccent: "bg-emerald-100",
  },
  {
    emoji: "\u{1F4AC}",
    title: "Share context, not links",
    description:
      "Instead of pasting 5 URLs in Slack, share one board with all the context anyone needs.",
    accent: "from-sky-50 to-blue-50 border-sky-200/80",
    emojiAccent: "bg-sky-100",
  },
];


export default function Home() {
  return (
    <div className="landing-dot-grid min-h-screen flex flex-col items-center px-4 py-20">
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
      <div className="text-center space-y-3 max-w-xl mt-8">
        <h1 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
          The prompt dump for humans and AI{" "}
          <span className="inline-block landing-sparkle">&#10024;</span>
        </h1>
        <p className="font-[family-name:var(--font-poppins)] text-base sm:text-lg text-gray-500 dark:text-gray-400 font-medium">
          Shared whiteboards of links and text, accessible to all agents and chatbots.
        </p>
        <StartDumpingButton />
        <Suspense>
          <BoardCounter />
        </Suspense>
      </div>

      {/* Works with AI */}
      <AiWorksWithSection />

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
          How people use Dump
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

      {/* Login */}
      <div className="mt-16 flex flex-col items-center gap-3">
        <Suspense fallback={<div className="h-10" />}>
          <LoginButton />
        </Suspense>
        <p className="text-xs text-gray-400 font-[family-name:var(--font-poppins)]">
          Free to use &middot; No credit card required &middot;{" "}
          <a href="/help" className="underline hover:text-gray-600 transition-colors">Help</a>
          {" "}&middot;{" "}
          <a href="https://github.com/Vochsel/dump.page" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 transition-colors">GitHub</a>
        </p>
      </div>

      <Footer />
    </div>
  );
}

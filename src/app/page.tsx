"use client";

import { useAuth } from "@/context/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";

function DraggableCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    started: boolean;
  } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (window.matchMedia("(pointer: coarse)").matches) return;
      if ((e.target as HTMLElement).closest("a, button")) return;
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: offset.x,
        baseY: offset.y,
        started: false,
      };
    },
    [offset]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      if (!ds.started && Math.abs(dx) + Math.abs(dy) < 5) return;
      ds.started = true;
      setDragging(true);
      setOffset({ x: ds.baseX + dx, y: ds.baseY + dy });
    };
    const onMouseUp = () => {
      if (dragState.current?.started) {
        setDragging(false);
      }
      dragState.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      className={className}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        cursor: dragging ? "grabbing" : "grab",
        zIndex: dragging ? 50 : undefined,
        userSelect: dragging ? "none" : undefined,
        transition: dragging ? "none" : "box-shadow 0.2s",
      }}
    >
      {children}
    </div>
  );
}

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

const painPoints = [
  { text: "Where is that doc again?", rotate: "rotate-1" },
  { text: "Can you reshare that prompt?", rotate: "-rotate-2" },
  { text: "I bookmarked it somewhere…", rotate: "rotate-2" },
  { text: "Which channel was that in?", rotate: "-rotate-1" },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="landing-dot-grid min-h-screen flex flex-col items-center px-4 py-20">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/dump.png"
          alt="Dump"
          className="h-24 sm:h-30"
        />
        <span className="font-[family-name:var(--font-dynapuff)] text-4xl sm:text-5xl text-gray-800">
          Dump
        </span>
      </div>

      {/* CTA Heading */}
      <div className="text-center space-y-3 max-w-xl mt-8">
        <h1 className="font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          One place for every link, note &amp; idea{" "}
          <span className="inline-block landing-sparkle">&#10024;</span>
        </h1>
        <p className="font-[family-name:var(--font-poppins)] text-base sm:text-lg text-gray-500 font-medium">
          Your team&apos;s{" "}
          <span className="landing-underline relative text-gray-900 font-semibold">
            context dump
          </span>{" "}
          — shared boards that humans and AI can actually use.
        </p>
        <button
          onClick={() => router.push('/new')}
          className="mt-4 px-8 py-3 text-white text-lg font-semibold rounded-full font-[family-name:var(--font-poppins)] transition-all hover:scale-105 shadow-md"
          style={{ backgroundColor: "#7bd096", outline: "3px solid white", outlineOffset: "-1px", boxShadow: "0 2px 8px rgba(123, 208, 150, 0.4)" }}
        >
          Start dumping — it&apos;s free
        </button>
      </div>

      {/* Pain points — whiteboard scribbles */}
      <div className="mt-16 max-w-md w-full">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {painPoints.map((item) => (
            <DraggableCard
              key={item.text}
              className={`${item.rotate} inline-block bg-white/60 border border-dashed border-gray-300 rounded px-3 py-1.5 text-sm text-gray-400 line-through decoration-red-400/60 decoration-2 font-[family-name:var(--font-poppins)]`}
            >
              {item.text}
            </DraggableCard>
          ))}
        </div>
        <p className="text-center text-sm text-gray-600 font-medium font-[family-name:var(--font-poppins)] mt-4">
          One place for links your team, agents, and chatbots can all reach.
        </p>
      </div>

      {/* Feature cards */}
      <p className="mt-16 text-center text-xs font-[family-name:var(--font-poppins)] text-gray-400 uppercase tracking-widest mb-6">
        How it works
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-2xl w-full px-2">
        {features.map((feature) => (
          <DraggableCard
            key={feature.title}
            className={`${feature.color} ${feature.rotate} border-2 rounded-sm p-5 shadow-md hover:shadow-lg cursor-default`}
          >
            <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-gray-800 text-sm mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </DraggableCard>
        ))}
      </div>

      {/* Use cases */}
      <div className="mt-16 max-w-2xl w-full px-2">
        <p className="text-center text-xs font-[family-name:var(--font-poppins)] text-gray-400 uppercase tracking-widest mb-6">
          How people use Dump
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              emoji: "🔖",
              title: "Smarter bookmarks",
              description:
                "Save links you actually want to find again — organized by project, not buried in a browser folder.",
              accent: "from-amber-50 to-orange-50 border-amber-200/80",
              emojiAccent: "bg-amber-100",
            },
            {
              emoji: "🤖",
              title: "Context for AI chats",
              description:
                "Dump reference links into a board and share it with ChatGPT, Claude, or any LLM for richer answers.",
              accent: "from-violet-50 to-purple-50 border-violet-200/80",
              emojiAccent: "bg-violet-100",
            },
            {
              emoji: "🗂️",
              title: "Cross-project research",
              description:
                "Collect docs, articles, and repos across multiple projects in one place your whole team can access.",
              accent: "from-emerald-50 to-teal-50 border-emerald-200/80",
              emojiAccent: "bg-emerald-100",
            },
            {
              emoji: "💬",
              title: "Share context, not links",
              description:
                "Instead of pasting 5 URLs in Slack, share one board with all the context anyone needs.",
              accent: "from-sky-50 to-blue-50 border-sky-200/80",
              emojiAccent: "bg-sky-100",
            },
          ].map((useCase) => (
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

      {/* Works with AI */}
      <div className="mt-16 max-w-xl w-full space-y-3 px-2">
        <p className="text-center text-xs font-[family-name:var(--font-poppins)] text-gray-400 uppercase tracking-widest">
          Works with your favorite AI
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { name: "ChatGPT", icon: "https://cdn.worldvectorlogo.com/logos/chatgpt-6.svg" },
            { name: "Claude", icon: "/claude-color.svg" },
            { name: "Gemini", icon: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg" },
            { name: "Grok", icon: "https://cdn.worldvectorlogo.com/logos/grok-1.svg" },
          ].map((ai) => (
            <DraggableCard
              key={ai.name}
              className="flex items-center gap-2 bg-white/70 border border-gray-200 rounded-full px-4 py-2"
            >
              <img src={ai.icon} alt={ai.name} className="h-5 w-5" />
              <span className="text-sm text-gray-700 font-medium font-[family-name:var(--font-poppins)]">
                {ai.name}
              </span>
            </DraggableCard>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 font-[family-name:var(--font-poppins)]">
          Just paste a board link — or connect via{" "}
          <span className="text-gray-500 font-medium">MCP server</span> for deeper integration.
        </p>
      </div>

      {/* Login */}
      <div className="mt-16 flex flex-col items-center gap-3">
        <LoginButton />
        <p className="text-xs text-gray-400 font-[family-name:var(--font-poppins)]">
          Free to use &middot; No credit card required
        </p>
      </div>
    </div>
  );
}

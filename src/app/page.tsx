"use client";

import { useAuth } from "@/context/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <img
        src="http://magpai.app/magpai_full_logo_black.svg"
        alt="Magpai"
        className="h-12 sm:h-14"
      />

      {/* Tagline */}
      <div className="text-center space-y-1.5 max-w-lg mt-8">
        <p className="font-[family-name:var(--font-poppins)] text-lg sm:text-xl text-gray-600 font-medium">
          Your team&apos;s{" "}
          <span className="landing-underline relative text-gray-900 font-semibold">
            context whiteboard
          </span>{" "}
          <span className="inline-block landing-sparkle">&#10024;</span>
        </p>
        <p className="text-sm text-gray-400 font-[family-name:var(--font-poppins)]">
          Collect links, notes &amp; ideas — make them useful for humans and AI.
        </p>
      </div>

      {/* Pain points — whiteboard scribbles */}
      <div className="mt-16 max-w-md w-full">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {painPoints.map((item) => (
            <span
              key={item.text}
              className={`${item.rotate} inline-block bg-white/60 border border-dashed border-gray-300 rounded px-3 py-1.5 text-sm text-gray-400 line-through decoration-red-400/60 decoration-2 font-[family-name:var(--font-poppins)]`}
            >
              {item.text}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 font-[family-name:var(--font-poppins)] mt-4">
          Stop losing context. Put it all on a board.
        </p>
      </div>

      {/* Feature cards */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-2xl w-full px-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`${feature.color} ${feature.rotate} border-2 rounded-sm p-5 shadow-md hover:shadow-lg transition-shadow cursor-default`}
          >
            <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-gray-800 text-sm mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
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
            <div
              key={ai.name}
              className="flex items-center gap-2 bg-white/70 border border-gray-200 rounded-full px-4 py-2"
            >
              <img src={ai.icon} alt={ai.name} className="h-5 w-5" />
              <span className="text-sm text-gray-700 font-medium font-[family-name:var(--font-poppins)]">
                {ai.name}
              </span>
            </div>
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

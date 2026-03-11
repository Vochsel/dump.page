import Link from "next/link";
import { ArrowLeft, Zap, Send, ListChecks, Rss, LayoutGrid, FileText, Bot, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

const PRO_FEATURES = [
  {
    icon: Send,
    title: "Send to AI",
    description:
      "Right-click any item on the canvas and send it directly to your preferred AI chat (Claude, ChatGPT, or Grok). The prompt includes your board as context with a deep link to the specific item.",
    color: "blue",
  },
  {
    icon: MessageSquare,
    title: "Prompt dialog",
    description:
      "When clicking the AI chat button in the header, a prompt dialog opens so you can type your question before sending. Your question is appended to the board context automatically.",
    color: "violet",
  },
  {
    icon: ListChecks,
    title: "Convert note to checklist",
    description:
      "Right-click any text note and convert it to a checklist. Each line in the note becomes a separate checklist item.",
    color: "green",
  },
  {
    icon: Rss,
    title: "RSS feed",
    description:
      "The RSS feed URL for your board appears in the share popover, making it easy to subscribe to board updates in any RSS reader.",
    color: "orange",
  },
  {
    icon: LayoutGrid,
    title: "View switcher",
    description:
      "Switch between Board, List, and Document views directly from the canvas. Each view presents your board content in a different layout.",
    color: "indigo",
  },
  {
    icon: FileText,
    title: "Context type & system prompt",
    description:
      "Set your board's context type (Default, Skill, or Agent) and add a custom system prompt in board settings. These control how AI assistants interpret your board content.",
    color: "amber",
  },
];

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
  violet: "bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
  green: "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400",
  orange: "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
  indigo: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
  amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
};

export default function ProModeHelpPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950">
      <header className="border-b border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/help">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/dump.png" alt="Dump" className="h-9" />
            <span className="font-[family-name:var(--font-dynapuff)] text-lg text-gray-800 dark:text-gray-200">
              Pro Mode
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Pro Mode
          </h1>
        </div>
        <p className="text-stone-500 dark:text-stone-400 mb-10">
          Pro mode unlocks power-user features for deeper AI integration and faster workflows.
          Enable it in the canvas preferences (gear icon, bottom-left).
        </p>

        <div className="space-y-4">
          {PRO_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-800 p-5"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`p-1.5 rounded-md ${COLOR_MAP[feature.color]}`}>
                  <feature.icon className="h-4 w-4" />
                </div>
                <h2 className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 dark:text-stone-200">
                  {feature.title}
                </h2>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-stone-100 dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-sm text-stone-600 dark:text-stone-300">
            <strong>How to enable:</strong> Open any board, click the gear icon in the
            bottom-left corner, and toggle <strong>Pro mode</strong>. The setting persists
            across all boards.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link href="/help">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-3 w-3" />
              Back to Help
            </Button>
          </Link>
        </div>

        <Footer />
      </main>
    </div>
  );
}

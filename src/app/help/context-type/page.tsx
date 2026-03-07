import Link from "next/link";
import { ArrowLeft, FileText, Wand2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContextTypeHelpPage() {
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
              Context Types
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Context Types
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-10">
          Context types help inform AI assistants how to treat the content on your board. You can set this in your board&apos;s settings popover.
        </p>

        <div className="space-y-6">
          {/* Default */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-md bg-stone-100 dark:bg-gray-800">
                <FileText className="h-4 w-4 text-stone-600 dark:text-stone-300" />
              </div>
              <h2 className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 dark:text-stone-200">
                Default
              </h2>
              <span className="text-[10px] uppercase tracking-wide font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                Recommended
              </span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
              The standard mode — your board is a collection of context. Links, notes, and checklists are presented as-is to the AI with no special instructions.
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              This works for most use cases: research boards, project notes, link collections, meeting prep, and anything where you just want the AI to have access to the information.
            </p>
          </div>

          {/* Skill */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-950/40">
                <Wand2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 dark:text-stone-200">
                Skill
              </h2>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
              Marks this board as an extensible capability for the AI. The generated markdown includes a preamble telling the assistant to use this board as a skill — a reusable set of knowledge or instructions it can draw on at any time.
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Great for reference material the AI should check frequently: coding standards, API documentation, brand guidelines, product specs, or any knowledge base that augments what the AI can do.
            </p>
          </div>

          {/* Agent */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950/40">
                <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 dark:text-stone-200">
                Agent
              </h2>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-2">
              Tells the AI to adopt this board as its persona. The goals, personality, tone, and instructions on the board should take over the AI&apos;s current context — effectively turning it into a custom agent.
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Use this for boards that define a specific role: a customer support agent, a writing assistant with a particular voice, a code reviewer with your team&apos;s conventions, or any persona you want the AI to embody.
            </p>
          </div>
        </div>

        {/* System prompt note */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Tip:</strong> Combine a context type with a custom system prompt for even more control. The system prompt appears right after the context type preamble in the generated markdown.
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
      </main>
    </div>
  );
}

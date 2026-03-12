"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmallLoginButton } from "@/components/auth/SmallLoginButton";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950">
      <header className="border-b border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <img src="/dump.png" alt="Dump" className="h-9" />
            <span className="font-[family-name:var(--font-dynapuff)] text-lg text-gray-800 dark:text-gray-200">
              Privacy Policy
            </span>
          </div>
          <SmallLoginButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Last updated: March 12, 2026</p>

        <div className="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Overview</h2>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              Dump (&ldquo;dump.page&rdquo;) is a collaborative whiteboard tool. We respect your privacy and are committed
              to protecting your personal data. This policy explains what information we collect, how we use it, and your
              rights regarding that information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-300">
              <li><strong>Account information:</strong> When you sign in with Google, we receive your name, email address, and profile photo from Google OAuth.</li>
              <li><strong>Board content:</strong> Notes, checklists, links, and other items you create on your boards are stored on our servers.</li>
              <li><strong>Usage data:</strong> We collect basic analytics such as page views to improve the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">MCP Integration</h2>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              When you connect Dump to an AI assistant via the MCP (Model Context Protocol) server, the assistant can
              read your boards and create or modify content on your behalf. The MCP integration uses OAuth 2.0 with
              scoped access tokens. We only share board data that you have access to, and write operations require
              explicit write scope authorization. We do not collect or store any conversation data from connected AI
              assistants — only the specific tool calls made to your boards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-300">
              <li>To provide and maintain the Dump service</li>
              <li>To authenticate you and manage board access permissions</li>
              <li>To enable sharing and collaboration features</li>
              <li>To generate board previews and metadata (e.g., link previews, OG images)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Data Storage &amp; Security</h2>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              Your data is stored on Convex&apos;s secure infrastructure. All data is transmitted over HTTPS/TLS. OAuth
              access tokens expire after one hour and can be revoked at any time from your profile.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-300">
              <li><strong>Google OAuth:</strong> For authentication</li>
              <li><strong>Convex:</strong> For backend data storage and real-time sync</li>
              <li><strong>Vercel:</strong> For hosting and edge functions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Your Rights</h2>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              You can delete your boards and their content at any time. You can revoke MCP access tokens from your
              profile page. For account deletion requests or other privacy concerns, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Contact</h2>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              For privacy-related questions or requests, reach out at{" "}
              <a href="mailto:hello@vochsel.com" className="underline hover:text-stone-800 dark:hover:text-stone-100">hello@vochsel.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Footer />
        </div>
      </main>
    </div>
  );
}

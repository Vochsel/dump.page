"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserMenu } from "@/components/auth/UserMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const hasMcp = useQuery(api.mcpAuth.hasActiveMcpToken);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-gray-950">
        <div className="animate-pulse text-muted-foreground font-[family-name:var(--font-poppins)]">
          Loading...
        </div>
      </div>
    );
  }

  const initials = (user.displayName ?? user.email ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <Avatar className="h-20 w-20 rounded-xl">
            <AvatarImage
              src={user.photoURL ?? undefined}
              alt={user.displayName ?? ""}
              className="rounded-xl"
            />
            <AvatarFallback className="text-2xl rounded-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="font-[family-name:var(--font-poppins)] text-xl font-semibold text-stone-900 dark:text-stone-100">
              {user.displayName ?? "User"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user.email}
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  MCP Connection
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect AI assistants to your boards
                </p>
              </div>
              {hasMcp === undefined ? (
                <span className="text-xs text-muted-foreground">...</span>
              ) : hasMcp ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full">
                  <Check className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                <Link
                  href="/mcp"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-gray-800 px-2.5 py-1 rounded-full hover:bg-stone-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Not connected
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

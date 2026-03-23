"use client";

import { type ComponentProps, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Archive, ArrowLeft, FileText, HelpCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/context/auth-context";
import { BoardCard } from "@/components/board/BoardCard";
import { CreateBoardDialog } from "@/components/board/CreateBoardDialog";
import { UserMenu } from "@/components/auth/UserMenu";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

type ArchivedBoard = ComponentProps<typeof BoardCard>["board"];

export default function ArchivePage() {
  const { user, loading } = useAuth();
  const boards = useQuery(api.boards.getArchivedBoards);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-gray-950">
        <div className="animate-pulse text-muted-foreground font-[family-name:var(--font-poppins)]">
          Loading...
        </div>
      </div>
    );
  }

  const sortedBoards = boards?.slice().sort((a, b) => b.updatedAt - a.updatedAt) ?? [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950">
      <header className="border-b border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Dashboard
              </Link>
            </Button>
            <span className="font-[family-name:var(--font-poppins)] text-sm font-medium text-stone-700 dark:text-stone-200">
              Archive
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/help">
                <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                Help
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/changelog">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Changelog
              </Link>
            </Button>
            <CreateBoardDialog />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-poppins)] text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Archived Boards
          </h1>
          <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400 dark:text-stone-500 mt-1">
            Restore a board here to bring it back to your dashboard.
          </p>
        </div>

        {boards === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-800 p-5 h-52 animate-pulse"
              >
                <div className="h-5 w-24 bg-stone-100 rounded mb-3" />
                <div className="h-3 w-32 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
        ) : sortedBoards.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 mb-4">
              <Archive className="h-7 w-7 text-stone-400" />
            </div>
            <p className="font-[family-name:var(--font-poppins)] text-lg font-medium text-stone-600 dark:text-stone-300 mb-1">
              Nothing archived
            </p>
            <p className="font-[family-name:var(--font-poppins)] text-sm text-stone-400">
              Boards you archive will show up here until you restore them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedBoards.map((board: ArchivedBoard) => (
              <BoardCard key={board._id} board={board} mode="archived" />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

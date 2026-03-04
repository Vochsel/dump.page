"use client";

import { useAuth } from "@/context/auth-context";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BoardCard } from "@/components/board/BoardCard";
import { CreateBoardDialog } from "@/components/board/CreateBoardDialog";
import { UserMenu } from "@/components/auth/UserMenu";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const boards = useQuery(api.boards.getMyBoards);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-lg">Magpai Collab</h1>
          <div className="flex items-center gap-4">
            <CreateBoardDialog />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Boards</h2>
        {boards === undefined ? (
          <div className="animate-pulse text-muted-foreground">Loading boards...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No boards yet</p>
            <p className="text-sm">Create your first board to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {boards.map(
              (board) =>
                board && (
                  <BoardCard
                    key={board._id}
                    board={board}
                  />
                )
            )}
          </div>
        )}
      </main>
    </div>
  );
}

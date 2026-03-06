"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Canvas } from "@/components/canvas/Canvas";
import { LocalBoardOpsProvider, clearLocalBoard } from "@/context/local-board-ops";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Share2, LogIn } from "lucide-react";
import { LoginButton } from "@/components/auth/LoginButton";
import Link from "next/link";

const EXAMPLE_NODES = [
  {
    type: "text" as const,
    content: "<p><strong>Welcome to Dump!</strong> </p><p>This is a note, dump can store notes, links, or todo lists.</p>",
    position: { x: 80, y: 180 },
  },
  {
    type: "text" as const,
    content: "<p>Paste in things, drag in things, go nuts!</p>",
    position: { x: 123.08, y: 316.11 },
  },
  {
    type: "link" as const,
    content: "https://news.ycombinator.com",
    position: { x: 148.48, y: 430.59 },
    metadata: { title: "Hacker News", description: "Links for the intellectually curious", favicon: "https://news.ycombinator.com/favicon.ico" },
  },
  {
    type: "link" as const,
    content: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    position: { x: 519.73, y: 52.39 },
    metadata: { title: "Me at the zoo", description: "The first video on YouTube", favicon: "https://www.youtube.com/s/desktop/favicon.ico" },
  },
];

const STORAGE_KEY = "dump-local-board";

if (typeof window !== "undefined") {
  const w = window as Window & { dumpReset?: () => void; dumpExport?: () => unknown[] };
  w.dumpReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };
  w.dumpExport = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const nodes = raw ? JSON.parse(raw) : [];
    const json = JSON.stringify(nodes, null, 2);
    console.log(json);
    return nodes;
  };
  console.log("Dump console commands:\n  dumpReset()  — clear local board & reload\n  dumpExport() — print board JSON to console");
}

export default function NewBoardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const persistLocalBoard = useMutation(api.boards.persistLocalBoard);

  const handleShare = useCallback(async () => {
    if (!user) {
      setShareDialogOpen(true);
      return;
    }
    await persistAndRedirect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // When user signs in while share dialog is open, auto-persist
  const pendingPersistRef = useRef(false);
  useEffect(() => {
    if (user && shareDialogOpen && !persisting && !pendingPersistRef.current) {
      pendingPersistRef.current = true;
      setShareDialogOpen(false);
      persistAndRedirect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, shareDialogOpen]);

  const persistAndRedirect = useCallback(async () => {
    setPersisting(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const nodes = raw ? JSON.parse(raw) : [];
      const boardId = await persistLocalBoard({
        name: "Untitled Board",
        icon: "📋",
        nodes: nodes.map((n: { type: string; content: string; position: { x: number; y: number }; metadata?: { title?: string; favicon?: string; description?: string } }) => ({
          type: n.type as "text" | "link" | "checklist",
          content: n.content,
          position: n.position,
          metadata: n.metadata,
        })),
      });
      clearLocalBoard();
      router.push(`/b/${boardId}`);
    } catch {
      setPersisting(false);
    }
  }, [persistLocalBoard, router]);

  return (
    <div className="h-screen relative">
      <div className="absolute inset-0">
        <LocalBoardOpsProvider seedNodes={EXAMPLE_NODES}>
          <Canvas canEdit={true} />
        </LocalBoardOpsProvider>
      </div>

      <header className="absolute top-0 left-0 right-0 z-10 md:flex md:justify-center md:px-4 md:mt-4">
        <div className="border-b md:border md:rounded-2xl md:w-1/2 md:min-w-[480px] md:max-w-[720px] bg-white/90 backdrop-blur-sm">
          <div className="px-4 h-12 flex items-center relative">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/">
                <img src="/dump.png" alt="Dump" className="h-7" />
              </Link>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h1 className="font-semibold text-gray-800 pointer-events-auto">
                Untitled Board
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {!user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-600"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <LogIn className="h-4 w-4" />
                  Log in
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleShare}
                disabled={persisting}
              >
                <Share2 className="h-4 w-4" />
                {persisting ? "Saving..." : "Share"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save & share this board</DialogTitle>
            <DialogDescription>
              Create an account to save your board and share it with others.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <LoginButton />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

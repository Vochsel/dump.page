"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Canvas } from "@/components/canvas/Canvas";
import { ConvexBoardOpsProvider } from "@/context/convex-board-ops";
import { BoardShare, BoardSettingsPopover } from "@/components/board/BoardSettings";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/context/auth-context";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { DeleteBoardButton } from "@/components/board/DeleteBoardButton";
import { ChatButton } from "@/components/board/ChatButton";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/LoginButton";
import { BoardIcon } from "@/components/board/BoardIcon";
import { BoardIconPicker } from "@/components/board/BoardIconPicker";
import { darkenHex, lightenHex } from "@/lib/utils";
import { useTheme } from "@/context/theme-context";
import { resolveBgColor } from "@/components/board/BoardSettings";
import { toast } from "sonner";
import { BUILD_VERSION } from "@/lib/constants";

function EditableBoardName({
  boardId,
  name,
  canEdit,
}: {
  boardId: Id<"boards">;
  name: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateBoard = useMutation(api.boards.updateBoard);

  useEffect(() => {
    setValue(name);
  }, [name]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) {
      updateBoard({ boardId, name: trimmed });
    } else {
      setValue(name);
    }
  };

  if (!canEdit) {
    return <h1 className="font-semibold truncate">{name}</h1>;
  }

  if (!editing) {
    return (
      <h1
        className="font-semibold truncate cursor-text hover:bg-black/5 dark:hover:bg-white/10 rounded px-1 -mx-1 transition-colors"
        onClick={() => setEditing(true)}
      >
        {name}
      </h1>
    );
  }

  return (
    <input
      ref={inputRef}
      className="font-semibold bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 -mx-1 min-w-0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setValue(name);
          setEditing(false);
        }
      }}
    />
  );
}

export default function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? undefined;
  const { user, loading: authLoading } = useAuth();
  const { resolved: theme } = useTheme();

  const access = useQuery(api.boardMembers.checkAccess, {
    slug: boardId,
    shareToken: token,
  });

  // Update tab title with board name and icon
  useEffect(() => {
    if (access?.board) {
      const icon = access.board.icon ? `${access.board.icon} ` : "";
      document.title = `${icon}${access.board.name} — Dump`;
    }
    return () => { document.title = "Dump — The context dump for humans and AI"; };
  }, [access?.board?.name, access?.board?.icon]);

  // Debug: log board markdown to console (hooks must be before early returns)
  const markdownLogged = useRef(false);
  const boardName = access?.board?.name;
  const logMarkdown = useCallback(async () => {
    if (markdownLogged.current) return;
    markdownLogged.current = true;
    try {
      const url = `/api/board-markdown/${boardId}${token ? `?token=${token}` : ""}`;
      const res = await fetch(url);
      const md = await res.text();
      console.log(`📋 Board markdown for ${boardName}:\n${md}`);
    } catch (e) {
      console.warn("Failed to fetch board markdown:", e);
    }
  }, [boardId, token, boardName]);

  // Cmd/Ctrl+C with nothing selected → copy share URL
  const shareUrl = (() => {
    if (!access?.board) return "";
    const slug = access.board.slug ?? boardId;
    const base = `https://www.dump.page/b/${slug}`;
    if (access.board.visibility === "shared" && access.board.shareToken) {
      return `${base}?token=${access.board.shareToken}`;
    }
    return base;
  })();

  useEffect(() => {
    if (!shareUrl) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "c" || !(e.metaKey || e.ctrlKey)) return;
      const sel = window.getSelection()?.toString();
      if (sel && sel.length > 0) return; // native copy
      // Check if focus is in an input/textarea
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      e.preventDefault();
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success("Board link copied to clipboard");
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shareUrl]);

  useEffect(() => {
    if (access?.canView && access?.board) {
      logMarkdown();
    }
  }, [logMarkdown, access?.canView, access?.board]);

  if (access === undefined || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading board...</div>
      </div>
    );
  }

  if (!access.canView || !access.board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          {user
            ? "You don't have access to this board."
            : "Sign in to access this board."}
        </p>
        {!user && <LoginButton />}
        <Link href={user ? "/dashboard" : "/"}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {user ? "Back to dashboard" : "Go home"}
          </Button>
        </Link>
      </div>
    );
  }

  const boardSettings = access.board.settings ?? {};
  const bgColorRaw = boardSettings.backgroundColor ?? "#f9fafb";
  const bgColor = resolveBgColor(bgColorRaw, theme === "dark");
  const headerColor = theme === "dark" ? lightenHex(bgColor, 0.06) : lightenHex(bgColor, 0.03);
  const headerBorder = theme === "dark" ? lightenHex(bgColor, 0.12) : darkenHex(bgColor, 0.15);

  const rssUrl = `/b/${boardId}/rss.xml${token ? `?token=${token}` : ""}`;

  return (
    <div className="h-screen relative">
      <link
        rel="alternate"
        type="application/rss+xml"
        title={`${access.board.name} RSS Feed`}
        href={rssUrl}
      />
      <div className="absolute inset-0">
        <ConvexBoardOpsProvider boardId={access.board._id}>
          <Canvas
            canEdit={access.canEdit}
            settings={boardSettings}
            boardSlug={access.board.slug ?? boardId}
            shareToken={access.board.shareToken}
          />
        </ConvexBoardOpsProvider>
      </div>
      <header className="absolute top-0 left-0 right-0 z-10 md:flex md:justify-center md:px-4 md:mt-4">
        <div
          className="border-b md:border md:rounded-2xl md:w-1/2 md:min-w-[480px] md:max-w-[720px]"
          style={{ backgroundColor: headerColor, borderColor: headerBorder }}
        >
          <div className="px-2 h-12 flex items-center relative">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <BoardIconPicker
                boardId={access.board._id}
                icon={access.board.icon}
                canEdit={access.role === "owner"}
              />
              <EditableBoardName
                boardId={access.board._id}
                name={access.board.name}
                canEdit={access.role === "owner"}
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              <ChatButton
                boardId={access.board._id}
                slug={access.board.slug ?? boardId}
                visibility={access.board.visibility}
                shareToken={access.board.shareToken}
              />
              <BoardSettingsPopover
                boardId={access.board._id}
                settings={boardSettings}
                canEdit={access.role === "owner"}
              />
              <BoardShare
                board={access.board}
                isOwner={access.role === "owner"}
              />
              {access.role === "owner" && (
                <DeleteBoardButton
                  boardId={access.board._id}
                  boardName={access.board.name}
                  variant="icon"
                />
              )}
              <Link href="/help">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
      <div className="absolute bottom-2 right-3 z-10 text-[10px] text-gray-400/60 dark:text-gray-500/60 font-mono select-none pointer-events-none">
        v{BUILD_VERSION}
      </div>
    </div>
  );
}

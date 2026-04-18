"use client";

import Link from "next/link";
import { Users, Link as LinkIcon, FileText, ExternalLink, CheckSquare } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { BoardIcon } from "./BoardIcon";
import { DeleteBoardButton } from "./DeleteBoardButton";
import { BoardArchiveButton, BoardStarButton } from "./BoardMembershipButtons";
import { cn } from "@/lib/utils";

type BoardVisibility = "private" | "shared" | "public";
type BoardRole = "owner" | "editor";

interface RecentNode {
  _id: string;
  type: "text" | "link" | "checklist" | "board";
  content: string;
  title?: string;
  metadata?: {
    title?: string;
  };
}

export interface DashboardBoard {
  _id: Id<"boards">;
  slug: string;
  name: string;
  icon: string;
  visibility: BoardVisibility;
  memberCount: number;
  role: BoardRole;
  starred?: boolean;
  archived?: boolean;
  thumbnailUrl?: string | null;
  updatedAt?: number;
  settings?: {
    backgroundColor?: string;
  };
  recentNodes?: RecentNode[];
}

interface BoardCardProps {
  board: DashboardBoard;
  mode?: "dashboard" | "archived";
}

function renderRecentNode(node: RecentNode) {
  if (node.type === "link") {
    return node.metadata?.title ||
      node.content.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }

  if (node.type === "checklist") {
    try {
      const items = JSON.parse(node.content);
      if (Array.isArray(items)) {
        const checked = items.filter((item: { checked: boolean }) => item.checked).length;
        const total = items.length;
        const label = node.title || items.find((item: { text: string }) => item.text)?.text || "Checklist";
        return `${label} (${checked}/${total})`;
      }
    } catch {
      return "Checklist";
    }
    return "Checklist";
  }

  return node.content.replace(/<[^>]*>/g, "").slice(0, 60);
}

function BoardActionIcons({
  boardId,
  boardName,
  role,
  starred,
  archived,
}: {
  boardId: Id<"boards">;
  boardName: string;
  role: BoardRole;
  starred: boolean;
  archived: boolean;
}) {
  return (
    <div className="relative z-10 flex items-center gap-1">
      <BoardStarButton
        boardId={boardId}
        starred={starred}
        className={cn(
          "h-8 w-8 rounded-lg bg-white/90 dark:bg-gray-900/90 shadow-sm transition-opacity",
          starred ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        )}
      />
      <BoardArchiveButton
        boardId={boardId}
        archived={archived}
        showToast
        className="h-8 w-8 rounded-lg bg-white/90 dark:bg-gray-900/90 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      />
      {role === "owner" ? (
        <span className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <DeleteBoardButton boardId={boardId} boardName={boardName} />
        </span>
      ) : null}
    </div>
  );
}

export function BoardCard({ board, mode = "dashboard" }: BoardCardProps) {
  const boardHref = `/b/${board.slug ?? board._id}`;
  const starred = board.starred ?? false;
  const archived = board.archived ?? false;
  const isArchivedView = mode === "archived";

  return (
    <Link
      href={boardHref}
      className="group bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-800 hover:border-stone-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
    >
      {board.thumbnailUrl ? (
        <>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={board.thumbnailUrl}
              alt={`${board.name} preview`}
              className="w-full h-40 object-cover"
            />
            {!isArchivedView ? (
              <div className="absolute top-2 left-2">
                <BoardActionIcons
                  boardId={board._id}
                  boardName={board.name}
                  role={board.role}
                  starred={starred}
                  archived={archived}
                />
              </div>
            ) : null}
            <Badge
              variant={
                board.visibility === "public"
                  ? "default"
                  : board.visibility === "shared"
                    ? "secondary"
                    : "outline"
              }
              className="absolute top-2 right-2 text-[10px] capitalize px-1.5 py-0"
            >
              {board.visibility}
            </Badge>
          </div>
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <BoardIcon icon={board.icon} className="text-base flex-shrink-0" size={18} />
              <span className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 dark:text-stone-100 text-sm truncate">
                {board.name}
              </span>
            </div>
            <span className="text-[11px] text-stone-400 flex items-center gap-1 flex-shrink-0 ml-2">
              <Users className="h-3 w-3" />
              {board.memberCount}
            </span>
          </div>
          {isArchivedView ? (
            <div className="px-4 pb-4 flex items-center justify-between gap-3">
              <span className="text-[11px] text-stone-400">Hidden from dashboard</span>
              <BoardArchiveButton
                boardId={board._id}
                archived
                showToast
                showLabel
                size="sm"
                variant="outline"
              />
            </div>
          ) : null}
        </>
      ) : (
        <>
          {board.settings?.backgroundColor && board.settings.backgroundColor !== "#f9fafb" ? (
            <div className="h-2 w-full" style={{ backgroundColor: board.settings.backgroundColor }} />
          ) : null}
          <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0">
                <BoardIcon icon={board.icon} className="text-xl" size={22} />
              </span>
              <h3 className="font-[family-name:var(--font-poppins)] font-semibold text-stone-800 dark:text-stone-100 text-[15px] truncate">
                {board.name}
              </h3>
            </div>
            {isArchivedView ? (
              <Badge
                variant={
                  board.visibility === "public"
                    ? "default"
                    : board.visibility === "shared"
                      ? "secondary"
                      : "outline"
                }
                className="text-[10px] capitalize px-1.5 py-0"
              >
                {board.visibility}
              </Badge>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Badge
                  variant={
                    board.visibility === "public"
                      ? "default"
                      : board.visibility === "shared"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-[10px] capitalize px-1.5 py-0"
                >
                  {board.visibility}
                </Badge>
                <BoardActionIcons
                  boardId={board._id}
                  boardName={board.name}
                  role={board.role}
                  starred={starred}
                  archived={archived}
                />
              </div>
            )}
          </div>
          <div className="px-5 pb-4 flex-1">
            {board.recentNodes && board.recentNodes.length > 0 ? (
              <ul className="space-y-1.5">
                {board.recentNodes.map((node) => (
                  <li
                    key={node._id}
                    className="flex items-center gap-2 text-xs text-stone-500 min-w-0"
                  >
                    {node.type === "link" ? (
                      <LinkIcon className="h-3 w-3 text-blue-400 flex-shrink-0" />
                    ) : node.type === "checklist" ? (
                      <CheckSquare className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-3 w-3 text-amber-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{renderRecentNode(node)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-300 italic">
                {isArchivedView ? "No recent items" : "No items yet"}
              </p>
            )}
          </div>
          <div className="px-5 py-3 border-t border-stone-100 dark:border-gray-800 flex items-center justify-between gap-3">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {board.memberCount} {board.memberCount === 1 ? "member" : "members"}
            </span>
            {isArchivedView ? (
              <BoardArchiveButton
                boardId={board._id}
                archived
                showToast
                showLabel
                size="sm"
                variant="outline"
              />
            ) : (
              <span className="text-[11px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Open <ExternalLink className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        </>
      )}
    </Link>
  );
}

export function BoardRow({ board, mode = "dashboard" }: BoardCardProps) {
  const boardHref = `/b/${board.slug ?? board._id}`;
  const starred = board.starred ?? false;
  const archived = board.archived ?? false;
  const isArchivedView = mode === "archived";

  return (
    <Link
      href={boardHref}
      className="group bg-white dark:bg-gray-900 rounded-lg border border-stone-200 dark:border-gray-800 hover:border-stone-300 dark:hover:border-gray-700 hover:shadow-sm transition-all duration-200 flex items-center gap-3 px-4 py-2.5"
    >
      <span className="flex-shrink-0">
        <BoardIcon icon={board.icon} className="text-lg" size={20} />
      </span>
      <span className="font-[family-name:var(--font-poppins)] font-medium text-stone-800 dark:text-stone-100 text-sm truncate min-w-0 flex-1">
        {board.name}
      </span>
      <span className="hidden sm:inline-flex text-[11px] text-stone-400 items-center gap-1 flex-shrink-0">
        {board.recentNodes?.length ?? 0} items
      </span>
      <Badge
        variant={
          board.visibility === "public"
            ? "default"
            : board.visibility === "shared"
              ? "secondary"
              : "outline"
        }
        className="hidden sm:inline-flex text-[10px] capitalize px-1.5 py-0 flex-shrink-0"
      >
        {board.visibility}
      </Badge>
      <span className="text-[11px] text-stone-400 flex items-center gap-1 flex-shrink-0 w-10 justify-end">
        <Users className="h-3 w-3" />
        {board.memberCount}
      </span>
      {isArchivedView ? (
        <BoardArchiveButton
          boardId={board._id}
          archived
          showToast
          showLabel
          size="sm"
          variant="outline"
        />
      ) : (
        <BoardActionIcons
          boardId={board._id}
          boardName={board.name}
          role={board.role}
          starred={starred}
          archived={archived}
        />
      )}
    </Link>
  );
}

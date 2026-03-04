"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";
import { BoardIcon } from "./BoardIcon";

interface BoardCardProps {
  board: {
    _id: Id<"boards">;
    name: string;
    icon: string;
    visibility: "private" | "shared" | "public";
    memberCount: number;
  };
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link href={`/b/${board._id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="space-y-3">
          <BoardIcon icon={board.icon} className="text-3xl" size={30} />
          <CardTitle className="text-base">{board.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                board.visibility === "public"
                  ? "default"
                  : board.visibility === "shared"
                    ? "secondary"
                    : "outline"
              }
              className="text-xs capitalize"
            >
              {board.visibility}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {board.memberCount}
            </span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

"use client";

import { type ComponentProps, useState } from "react";
import { useMutation } from "convex/react";
import { Star, Archive } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

interface BoardStarButtonProps {
  boardId: Id<"boards">;
  starred: boolean;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  showLabel?: boolean;
}

export function BoardStarButton({
  boardId,
  starred,
  className,
  size = "icon-sm",
  variant = "ghost",
  showLabel = false,
}: BoardStarButtonProps) {
  const updatePreferences = useMutation(api.boardMembers.updatePreferences);
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        starred && "text-amber-500 hover:text-amber-600",
        className
      )}
      disabled={pending}
      title={starred ? "Remove star" : "Star board"}
      aria-label={starred ? "Remove star" : "Star board"}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setPending(true);
        try {
          await updatePreferences({ boardId, starred: !starred });
        } finally {
          setPending(false);
        }
      }}
    >
      <Star className={cn("h-4 w-4", starred && "fill-current")} />
      {showLabel ? (starred ? "Starred" : "Star") : null}
    </Button>
  );
}

interface BoardArchiveButtonProps {
  boardId: Id<"boards">;
  archived: boolean;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  showLabel?: boolean;
  showToast?: boolean;
}

export function BoardArchiveButton({
  boardId,
  archived,
  className,
  size = "icon-sm",
  variant = "ghost",
  showLabel = false,
  showToast = false,
}: BoardArchiveButtonProps) {
  const updatePreferences = useMutation(api.boardMembers.updatePreferences);
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      title={archived ? "Unarchive board" : "Archive board"}
      aria-label={archived ? "Unarchive board" : "Archive board"}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setPending(true);
        try {
          await updatePreferences({ boardId, archived: !archived });
          if (showToast) {
            toast.success(archived ? "Board restored" : "Board archived");
          }
        } finally {
          setPending(false);
        }
      }}
    >
      <Archive className="h-4 w-4" />
      {showLabel ? (archived ? "Unarchive" : "Archive") : null}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteBoardButtonProps {
  boardId: Id<"boards">;
  boardName: string;
  redirectTo?: string;
  variant?: "icon" | "menu";
}

export function DeleteBoardButton({
  boardId,
  boardName,
  redirectTo = "/dashboard",
  variant = "icon",
}: DeleteBoardButtonProps) {
  const [deleting, setDeleting] = useState(false);
  const deleteBoard = useMutation(api.boards.deleteBoard);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBoard({ boardId });
      router.push(redirectTo);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <button
            className="p-1 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete board"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete board
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{boardName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this board and all its contents. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

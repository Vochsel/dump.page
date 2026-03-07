"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BoardIcon } from "./BoardIcon";
import { IconPicker } from "./IconPicker";

interface BoardIconPickerProps {
  boardId: Id<"boards">;
  icon: string;
  canEdit: boolean;
}

export function BoardIconPicker({ boardId, icon, canEdit }: BoardIconPickerProps) {
  const updateBoard = useMutation(api.boards.updateBoard);

  if (!canEdit) {
    return <BoardIcon icon={icon} className="text-lg flex-shrink-0" size={20} />;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex-shrink-0 rounded-md p-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer">
          <BoardIcon icon={icon} className="text-lg" size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <IconPicker
          value={icon}
          onChange={(newIcon) => updateBoard({ boardId, icon: newIcon })}
        />
      </PopoverContent>
    </Popover>
  );
}

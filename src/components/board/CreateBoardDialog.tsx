"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconPicker } from "./IconPicker";

export function CreateBoardDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📋");
  const [visibility, setVisibility] = useState<"private" | "shared" | "public">("private");
  const createBoard = useMutation(api.boards.createBoard);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    const boardId = await createBoard({ name: name.trim(), icon, visibility });
    setOpen(false);
    setName("");
    setIcon("📋");
    setVisibility("private");
    router.push(`/b/${boardId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              placeholder="My Context Board"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Icon</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Visibility</label>
            <div className="flex gap-2">
              {(["private", "shared", "public"] as const).map((v) => (
                <Button
                  key={v}
                  variant={visibility === v ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibility(v)}
                  className="capitalize"
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

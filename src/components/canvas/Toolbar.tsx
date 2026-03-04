"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Type, Link, Plus, CheckSquare } from "lucide-react";
import { useReactFlow } from "@xyflow/react";

interface ToolbarProps {
  boardId: Id<"boards">;
}

export function Toolbar({ boardId }: ToolbarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const createNode = useMutation(api.nodes.createNode);
  const fetchMetadata = useAction(api.nodes.fetchLinkMetadata);
  const { screenToFlowPosition } = useReactFlow();

  const getCenter = () => {
    return screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  };

  const addTextNode = async () => {
    const pos = getCenter();
    await createNode({
      boardId,
      type: "text",
      content: "",
      position: { x: pos.x - 140, y: pos.y - 60 },
    });
  };

  const addChecklistNode = async () => {
    const pos = getCenter();
    await createNode({
      boardId,
      type: "checklist",
      content: "[]",
      position: { x: pos.x - 110, y: pos.y - 60 },
    });
  };

  const addLinkNode = async () => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    const pos = getCenter();
    const nodeId = await createNode({
      boardId,
      type: "link",
      content: url,
      position: { x: pos.x - 140, y: pos.y - 60 },
    });
    setLinkUrl("");
    setLinkOpen(false);
    // Fire and forget — metadata populates async via subscription
    fetchMetadata({ nodeId, url });
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-card border rounded-lg shadow-lg p-2">
      <Button variant="ghost" size="sm" className="gap-2" onClick={addTextNode}>
        <Type className="h-4 w-4" />
        Text
      </Button>
      <Button variant="ghost" size="sm" className="gap-2" onClick={addChecklistNode}>
        <CheckSquare className="h-4 w-4" />
        Checklist
      </Button>
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Link className="h-4 w-4" />
            Link
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="top">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLinkNode()}
              autoFocus
            />
            <Button size="sm" onClick={addLinkNode}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
